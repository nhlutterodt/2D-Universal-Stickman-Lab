/**
 * Workspace management utility for monorepo operations.
 * Features:
 * - Package installation and linking
 * - Dependency management
 * - Workspace validation
 * - Bulk operations across packages
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface WorkspaceOptions {
  command: 'install' | 'link' | 'validate' | 'update' | 'info';
  package?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface PackageInfo {
  name: string;
  version: string;
  path: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

class WorkspaceManager {
  private startTime: number = performance.now();
  private packages: Map<string, PackageInfo> = new Map();

  private log(message: string, error: boolean = false): void {
    const timestamp = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const prefix = error ? '🔴' : '🟢';
    console.log(`${prefix} [${timestamp}s] ${message}`);
  }

  private execCommand(command: string, cwd?: string): string {
    try {
      return execSync(command, {
        cwd: cwd || process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      }).toString().trim();
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error}`);
    }
  }

  private findPackages(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        if (fs.existsSync(path.join(fullPath, 'package.json'))) {
          results.push(fullPath);
        } else {
          results.push(...this.findPackages(fullPath));
        }
      }
    }
    return results;
  }

  private loadPackageInfo(packagePath: string): PackageInfo {
    const pkgJsonPath = path.join(packagePath, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    
    return {
      name: pkgJson.name || path.basename(packagePath),
      version: pkgJson.version || '0.0.0',
      path: packagePath,
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {}
    };
  }

  private discoverPackages(): void {
    this.log('Discovering workspace packages...');
    const roots = ['packages', 'apps', 'cli'];
    const packagePaths = roots.flatMap(root => 
      this.findPackages(path.join(__dirname, '..', root))
    );

    for (const pkgPath of packagePaths) {
      const pkg = this.loadPackageInfo(pkgPath);
      this.packages.set(pkg.name, pkg);
    }

    this.log(`Found ${this.packages.size} packages`);
  }

  private async installDependencies(options: WorkspaceOptions): Promise<void> {
    this.log('Installing dependencies...');
    
    if (options.package) {
      const pkg = this.packages.get(options.package);
      if (!pkg) {
        throw new Error(`Package '${options.package}' not found`);
      }
      
      this.log(`Installing dependencies for ${pkg.name}...`);
      if (!options.dryRun) {
        this.execCommand('npm install', pkg.path);
      }
    } else {
      // Install root dependencies first
      this.log('Installing root dependencies...');
      if (!options.dryRun) {
        this.execCommand('npm install');
      }

      // Install package dependencies
      for (const [name, pkg] of this.packages) {
        this.log(`Installing dependencies for ${name}...`);
        if (!options.dryRun) {
          try {
            this.execCommand('npm install', pkg.path);
          } catch (error) {
            this.log(`Failed to install dependencies for ${name}: ${error}`, true);
          }
        }
      }
    }
  }

  private async linkPackages(options: WorkspaceOptions): Promise<void> {
    this.log('Linking workspace packages...');
    
    // Create symlinks for internal dependencies
    for (const [name, pkg] of this.packages) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      for (const depName of Object.keys(allDeps)) {
        const depPkg = this.packages.get(depName);
        if (depPkg) {
          const linkPath = path.join(pkg.path, 'node_modules', depName);
          const targetPath = path.relative(path.dirname(linkPath), depPkg.path);
          
          this.log(`Linking ${depName} in ${name}...`);
          
          if (!options.dryRun) {
            try {
              // Ensure node_modules directory exists
              const nodeModulesDir = path.dirname(linkPath);
              if (!fs.existsSync(nodeModulesDir)) {
                fs.mkdirSync(nodeModulesDir, { recursive: true });
              }
              
              // Remove existing link/directory
              if (fs.existsSync(linkPath)) {
                fs.rmSync(linkPath, { recursive: true, force: true });
              }
              
              // Create symlink
              fs.symlinkSync(targetPath, linkPath, 'dir');
            } catch (error) {
              this.log(`Failed to link ${depName} in ${name}: ${error}`, true);
            }
          }
        }
      }
    }
  }

  private async validateWorkspace(): Promise<void> {
    this.log('Validating workspace...');
    
    const issues: string[] = [];
    
    // Check for circular dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const checkCircular = (pkgName: string): boolean => {
      if (visiting.has(pkgName)) {
        issues.push(`Circular dependency detected involving ${pkgName}`);
        return true;
      }
      
      if (visited.has(pkgName)) {
        return false;
      }
      
      visiting.add(pkgName);
      const pkg = this.packages.get(pkgName);
      
      if (pkg) {
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const depName of Object.keys(allDeps)) {
          if (this.packages.has(depName)) {
            if (checkCircular(depName)) {
              return true;
            }
          }
        }
      }
      
      visiting.delete(pkgName);
      visited.add(pkgName);
      return false;
    };
    
    for (const pkgName of this.packages.keys()) {
      checkCircular(pkgName);
    }
    
    // Check for missing dependencies
    for (const [name, pkg] of this.packages) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      for (const depName of Object.keys(allDeps)) {
        if (this.packages.has(depName)) {
          const depPkg = this.packages.get(depName);
          if (!depPkg) {
            issues.push(`${name} depends on missing package ${depName}`);
          }
        }
      }
    }
    
    // Check for version mismatches
    const externalDeps = new Map<string, Set<string>>();
    
    for (const [name, pkg] of this.packages) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      for (const [depName, version] of Object.entries(allDeps)) {
        if (!this.packages.has(depName)) {
          if (!externalDeps.has(depName)) {
            externalDeps.set(depName, new Set());
          }
          externalDeps.get(depName)!.add(version);
        }
      }
    }
    
    for (const [depName, versions] of externalDeps) {
      if (versions.size > 1) {
        issues.push(`Version mismatch for ${depName}: ${Array.from(versions).join(', ')}`);
      }
    }
    
    // Report results
    if (issues.length === 0) {
      this.log('Workspace validation passed ✅');
    } else {
      this.log('Workspace validation failed ❌', true);
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
    }
  }

  private async updateDependencies(options: WorkspaceOptions): Promise<void> {
    this.log('Updating dependencies...');
    
    if (options.package) {
      const pkg = this.packages.get(options.package);
      if (!pkg) {
        throw new Error(`Package '${options.package}' not found`);
      }
      
      this.log(`Updating dependencies for ${pkg.name}...`);
      if (!options.dryRun) {
        this.execCommand('npm update', pkg.path);
      }
    } else {
      // Update root dependencies
      this.log('Updating root dependencies...');
      if (!options.dryRun) {
        this.execCommand('npm update');
      }
      
      // Update package dependencies
      for (const [name, pkg] of this.packages) {
        this.log(`Updating dependencies for ${name}...`);
        if (!options.dryRun) {
          try {
            this.execCommand('npm update', pkg.path);
          } catch (error) {
            this.log(`Failed to update dependencies for ${name}: ${error}`, true);
          }
        }
      }
    }
  }

  private async showInfo(): Promise<void> {
    this.log('Workspace Information');
    console.log('====================');
    
    console.log(`Total packages: ${this.packages.size}`);
    
    // Package breakdown by type
    const packagesByType = new Map<string, number>();
    for (const [name, pkg] of this.packages) {
      const type = pkg.path.includes('/apps/') ? 'app' : 
                   pkg.path.includes('/packages/') ? 'package' : 
                   pkg.path.includes('/cli/') ? 'cli' : 'other';
      packagesByType.set(type, (packagesByType.get(type) || 0) + 1);
    }
    
    for (const [type, count] of packagesByType) {
      console.log(`  ${type}: ${count}`);
    }
    
    // Dependency statistics
    const allExternalDeps = new Set<string>();
    let totalInternalDeps = 0;
    
    for (const [name, pkg] of this.packages) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      for (const depName of Object.keys(allDeps)) {
        if (this.packages.has(depName)) {
          totalInternalDeps++;
        } else {
          allExternalDeps.add(depName);
        }
      }
    }
    
    console.log(`\nDependencies:`);
    console.log(`  Internal: ${totalInternalDeps}`);
    console.log(`  External (unique): ${allExternalDeps.size}`);
  }

  public async manage(options: WorkspaceOptions): Promise<void> {
    try {
      this.discoverPackages();
      
      switch (options.command) {
        case 'install':
          await this.installDependencies(options);
          break;
        case 'link':
          await this.linkPackages(options);
          break;
        case 'validate':
          await this.validateWorkspace();
          break;
        case 'update':
          await this.updateDependencies(options);
          break;
        case 'info':
          await this.showInfo();
          break;
        default:
          throw new Error(`Unknown command: ${options.command}`);
      }
      
      const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Workspace operation completed in ${duration}s`);
      
    } catch (error) {
      this.log(`Workspace operation failed: ${error}`, true);
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: WorkspaceOptions = {
  command: 'info' // default
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case 'install':
    case 'link':
    case 'validate':
    case 'update':
    case 'info':
      options.command = args[i] as any;
      break;
    case '--package':
    case '-p':
      options.package = args[++i];
      break;
    case '--force':
      options.force = true;
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--help':
      console.log(`
Usage: npx ts-node scripts/workspace.ts <command> [options]

Commands:
  install     Install dependencies for all packages
  link        Link internal dependencies
  validate    Validate workspace configuration
  update      Update dependencies
  info        Show workspace information

Options:
  -p, --package <name>  Target specific package
  --force               Force operation
  --dry-run             Show what would be done
  --help                Show this help message

Examples:
  npx ts-node scripts/workspace.ts install
  npx ts-node scripts/workspace.ts link --dry-run
  npx ts-node scripts/workspace.ts validate
  npx ts-node scripts/workspace.ts update --package my-package
`);
      process.exit(0);
  }
}

// Run workspace management
const workspaceManager = new WorkspaceManager();
workspaceManager.manage(options).catch((error: Error) => {
  console.error('Fatal workspace error:', error);
  process.exit(1);
});
