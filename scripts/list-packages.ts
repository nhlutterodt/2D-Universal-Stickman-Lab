/**
 * Enhanced package discovery and management utility.
 * Features:
 * - Package dependency graph visualization
 * - Package health checks
 * - Workspace analysis
 * - Package information display
 */

import * as fs from 'fs';
import * as path from 'path';

interface PackageInfo {
  name: string;
  version: string;
  path: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: string[];
  hasTests: boolean;
  hasBuild: boolean;
  size?: number;
}

interface PackageOptions {
  verbose?: boolean;
  health?: boolean;
  graph?: boolean;
  json?: boolean;
}

class PackageManager {
  private packages: Map<string, PackageInfo> = new Map();

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

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory() && item !== 'node_modules') {
          totalSize += this.getDirectorySize(itemPath);
        } else if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
    } catch {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }

  private loadPackageInfo(packagePath: string): PackageInfo {
    const pkgJsonPath = path.join(packagePath, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    
    const dependencies = Object.keys(pkgJson.dependencies || {});
    const devDependencies = Object.keys(pkgJson.devDependencies || {});
    const scripts = Object.keys(pkgJson.scripts || {});
    
    return {
      name: pkgJson.name || path.basename(packagePath),
      version: pkgJson.version || '0.0.0',
      path: packagePath,
      dependencies,
      devDependencies,
      scripts,
      hasTests: scripts.includes('test'),
      hasBuild: scripts.includes('build'),
      size: this.getDirectorySize(packagePath)
    };
  }

  private checkPackageHealth(pkg: PackageInfo): string[] {
    const issues: string[] = [];
    
    // Check for missing essential scripts
    if (!pkg.hasTests) {
      issues.push('No test script');
    }
    
    if (!pkg.hasBuild && pkg.dependencies.length > 0) {
      issues.push('No build script but has dependencies');
    }
    
    // Check for package.json issues
    if (!pkg.version || pkg.version === '0.0.0') {
      issues.push('Missing or default version');
    }
    
    // Check for large package size (> 10MB)
    if (pkg.size && pkg.size > 10 * 1024 * 1024) {
      issues.push('Large package size');
    }
    
    return issues;
  }

  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [name, pkg] of this.packages) {
      const internalDeps = pkg.dependencies.filter(dep => this.packages.has(dep));
      graph.set(name, internalDeps);
    }
    
    return graph;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  public discover(): void {
    const roots = ['packages', 'apps', 'cli'];
    const packagePaths = roots.flatMap(root => 
      this.findPackages(path.join(__dirname, '..', root))
    );

    for (const pkgPath of packagePaths) {
      const pkg = this.loadPackageInfo(pkgPath);
      this.packages.set(pkg.name, pkg);
    }
  }

  public list(options: PackageOptions = {}): void {
    this.discover();

    if (options.json) {
      const packageArray = Array.from(this.packages.values());
      console.log(JSON.stringify(packageArray, null, 2));
      return;
    }

    console.log('Workspace packages:');
    console.log('==================');

    for (const [name, pkg] of this.packages) {
      const relativePath = path.relative(path.join(__dirname, '..'), pkg.path);
      
      if (options.verbose) {
        console.log(`\n📦 ${name} (v${pkg.version})`);
        console.log(`   Path: ${relativePath}`);
        console.log(`   Scripts: ${pkg.scripts.join(', ') || 'none'}`);
        console.log(`   Dependencies: ${pkg.dependencies.length}`);
        console.log(`   Dev Dependencies: ${pkg.devDependencies.length}`);
        
        if (pkg.size) {
          console.log(`   Size: ${this.formatSize(pkg.size)}`);
        }
        
        if (options.health) {
          const issues = this.checkPackageHealth(pkg);
          if (issues.length > 0) {
            console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
          } else {
            console.log(`   ✅ Healthy`);
          }
        }
      } else {
        const status = options.health ? 
          (this.checkPackageHealth(pkg).length === 0 ? '✅' : '⚠️') : '';
        console.log(`  ${status} ${name} - ${relativePath}`);
      }
    }

    if (options.graph) {
      console.log('\nDependency Graph:');
      console.log('=================');
      const graph = this.buildDependencyGraph();
      
      for (const [name, deps] of graph) {
        if (deps.length > 0) {
          console.log(`${name} → ${deps.join(', ')}`);
        }
      }
    }

    console.log(`\nTotal packages: ${this.packages.size}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: PackageOptions = {};

for (const arg of args) {
  switch (arg) {
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--health':
    case '-h':
      options.health = true;
      break;
    case '--graph':
    case '-g':
      options.graph = true;
      break;
    case '--json':
    case '-j':
      options.json = true;
      break;
    case '--help':
      console.log(`
Usage: npx ts-node scripts/list-packages.ts [options]

Options:
  -v, --verbose    Show detailed package information
  -h, --health     Show package health status
  -g, --graph      Show dependency graph
  -j, --json       Output as JSON
  --help           Show this help message
`);
      process.exit(0);
  }
}

// Run package listing
const packageManager = new PackageManager();
packageManager.list(options);
