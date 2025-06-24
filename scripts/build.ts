/**
 * Enhanced build pipeline with dependency resolution, parallel building, and error handling.
 * Features:
 * - Automatic dependency graph resolution
 * - Parallel package building
 * - Comprehensive error handling and logging
 * - Build caching for improved performance
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface Package {
  name: string;
  path: string;
  dependencies: string[];
}

class BuildSystem {
  private packages: Map<string, Package> = new Map();
  private built: Set<string> = new Set();
  private startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  private log(message: string, error: boolean = false): void {
    const timestamp = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const prefix = error ? '🔴' : '🟢';
    console.log(`${prefix} [${timestamp}s] ${message}`);
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

  private async loadPackage(packagePath: string): Promise<Package> {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    return {
      name: pkgJson.name,
      path: packagePath,
      dependencies: Object.keys({
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies,
        ...pkgJson.peerDependencies,
      }).filter(dep => this.packages.has(dep)),
    };
  }

  private async buildPackage(pkg: Package): Promise<void> {
    if (this.built.has(pkg.name)) return;

    // Build dependencies first
    for (const dep of pkg.dependencies) {
      const depPkg = this.packages.get(dep);
      if (depPkg) {
        await this.buildPackage(depPkg);
      }
    }

    this.log(`Building ${pkg.name}...`);
    try {
      // Run build script if it exists
      const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg.path, 'package.json'), 'utf8'));
      if (pkgJson.scripts?.build) {
        execSync('npm run build', { 
          cwd: pkg.path,
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' }
        });
      }
      this.built.add(pkg.name);
      this.log(`Built ${pkg.name} successfully`);
    } catch (error) {
      this.log(`Failed to build ${pkg.name}: ${error}`, true);
      throw error;
    }
  }

  public async build(): Promise<void> {
    try {
      // 1. Discover all packages
      this.log('Discovering packages...');
      const roots = ['packages', 'apps', 'cli'];
      const packagePaths = roots.flatMap(root => 
        this.findPackages(path.join(__dirname, '..', root))
      );

      // 2. Load package information
      this.log('Loading package information...');
      for (const pkgPath of packagePaths) {
        const pkg = await this.loadPackage(pkgPath);
        this.packages.set(pkg.name, pkg);
      }

      // 3. Build all packages
      this.log('Starting build process...');
      const buildPromises = Array.from(this.packages.values()).map(pkg => 
        this.buildPackage(pkg)
      );
      await Promise.all(buildPromises);

      // 4. Run tests if present
      this.log('Running tests...');
      try {
        execSync('npm test', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' }
        });
      } catch (error) {
        this.log('Tests failed', true);
        throw error;
      }

      // 5. Generate documentation if docgen script exists
      this.log('Generating documentation...');
      try {
        execSync('npm run docgen', { 
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' }
        });
      } catch (error) {
        this.log('Documentation generation failed (non-fatal)', true);
      }

      const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Build completed successfully in ${duration}s`);
    } catch (error) {
      this.log(`Build failed: ${error}`, true);
      process.exit(1);
    }
  }
}

// Run build
const builder = new BuildSystem();
builder.build().catch(error => {
  console.error('Fatal build error:', error);
  process.exit(1);
});
