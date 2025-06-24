/**
 * Enhanced cleanup utility for build artifacts and temporary files.
 * Features:
 * - Selective cleaning (build artifacts, dependencies, cache)
 * - Dry run mode
 * - Size reporting
 * - Safe deletion with confirmation
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface CleanOptions {
  artifacts?: boolean;
  dependencies?: boolean;
  cache?: boolean;
  logs?: boolean;
  all?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

class CleanSystem {
  private startTime: number = performance.now();
  private deletedSize: number = 0;
  private deletedCount: number = 0;

  private log(message: string, error: boolean = false): void {
    const timestamp = ((performance.now() - this.startTime) / 1000).toFixed(2);
    const prefix = error ? '🔴' : '🟢';
    console.log(`${prefix} [${timestamp}s] ${message}`);
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

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }

  private deleteDirectory(dirPath: string, dryRun: boolean = false): void {
    if (!fs.existsSync(dirPath)) return;

    const size = this.getDirectorySize(dirPath);
    this.deletedSize += size;
    this.deletedCount++;

    if (dryRun) {
      this.log(`Would delete: ${dirPath} (${this.formatSize(size)})`);
      return;
    }

    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      this.log(`Deleted: ${dirPath} (${this.formatSize(size)})`);
    } catch (error) {
      this.log(`Failed to delete ${dirPath}: ${error}`, true);
    }
  }

  private deleteFile(filePath: string, dryRun: boolean = false): void {
    if (!fs.existsSync(filePath)) return;

    const stats = fs.statSync(filePath);
    this.deletedSize += stats.size;
    this.deletedCount++;

    if (dryRun) {
      this.log(`Would delete: ${filePath} (${this.formatSize(stats.size)})`);
      return;
    }

    try {
      fs.unlinkSync(filePath);
      this.log(`Deleted: ${filePath} (${this.formatSize(stats.size)})`);
    } catch (error) {
      this.log(`Failed to delete ${filePath}: ${error}`, true);
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

  private cleanArtifacts(dryRun: boolean): void {
    this.log('Cleaning build artifacts...');
    
    // Common build output directories
    const artifactDirs = [
      'dist',
      'build',
      'out',
      'lib',
      '.next',
      '.nuxt',
      'coverage'
    ];

    // Clean root level artifacts
    for (const dir of artifactDirs) {
      this.deleteDirectory(dir, dryRun);
    }

    // Clean package-level artifacts
    const roots = ['packages', 'apps', 'cli'];
    const packagePaths = roots.flatMap(root => 
      this.findPackages(path.join(__dirname, '..', root))
    );

    for (const pkgPath of packagePaths) {
      for (const dir of artifactDirs) {
        this.deleteDirectory(path.join(pkgPath, dir), dryRun);
      }
    }

    // Clean TypeScript build info
    const tsFiles = [
      'tsconfig.tsbuildinfo',
      '.tsbuildinfo'
    ];

    for (const file of tsFiles) {
      this.deleteFile(file, dryRun);
    }
  }

  private cleanDependencies(dryRun: boolean): void {
    this.log('Cleaning dependencies...');
    
    // Clean root node_modules
    this.deleteDirectory('node_modules', dryRun);

    // Clean package-level node_modules
    const roots = ['packages', 'apps', 'cli'];
    const packagePaths = roots.flatMap(root => 
      this.findPackages(path.join(__dirname, '..', root))
    );

    for (const pkgPath of packagePaths) {
      this.deleteDirectory(path.join(pkgPath, 'node_modules'), dryRun);
    }

    // Clean lock files
    const lockFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];

    for (const file of lockFiles) {
      this.deleteFile(file, dryRun);
    }
  }

  private cleanCache(dryRun: boolean): void {
    this.log('Cleaning cache files...');
    
    const cacheDirs = [
      '.cache',
      '.parcel-cache',
      '.webpack',
      '.vite',
      'node_modules/.cache'
    ];

    for (const dir of cacheDirs) {
      this.deleteDirectory(dir, dryRun);
    }

    // Clean npm cache (global)
    try {
      if (!dryRun) {
        const { execSync } = require('child_process');
        execSync('npm cache clean --force', { stdio: 'pipe' });
        this.log('Cleaned npm cache');
      } else {
        this.log('Would clean npm cache');
      }
    } catch {
      // Ignore npm cache clean errors
    }
  }

  private cleanLogs(dryRun: boolean): void {
    this.log('Cleaning log files...');
    
    const logPatterns = [
      '*.log',
      'logs',
      '.logs'
    ];

    // Simple log file cleanup
    const logFiles = [
      'npm-debug.log',
      'yarn-debug.log',
      'yarn-error.log',
      'lerna-debug.log'
    ];

    for (const file of logFiles) {
      this.deleteFile(file, dryRun);
    }

    this.deleteDirectory('logs', dryRun);
    this.deleteDirectory('.logs', dryRun);
  }

  public async clean(options: CleanOptions): Promise<void> {
    try {
      this.log('Starting cleanup process...');
      
      if (options.dryRun) {
        this.log('DRY RUN MODE - No files will be deleted');
      }

      // Reset counters
      this.deletedSize = 0;
      this.deletedCount = 0;

      if (options.all) {
        this.cleanArtifacts(options.dryRun || false);
        this.cleanDependencies(options.dryRun || false);
        this.cleanCache(options.dryRun || false);
        this.cleanLogs(options.dryRun || false);
      } else {
        if (options.artifacts) {
          this.cleanArtifacts(options.dryRun || false);
        }
        
        if (options.dependencies) {
          this.cleanDependencies(options.dryRun || false);
        }
        
        if (options.cache) {
          this.cleanCache(options.dryRun || false);
        }
        
        if (options.logs) {
          this.cleanLogs(options.dryRun || false);
        }
      }

      const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
      const action = options.dryRun ? 'Would clean' : 'Cleaned';
      this.log(`${action} ${this.deletedCount} items (${this.formatSize(this.deletedSize)}) in ${duration}s`);
      
    } catch (error) {
      this.log(`Cleanup failed: ${error}`, true);
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanOptions = {};

for (const arg of args) {
  switch (arg) {
    case '--artifacts':
    case '-a':
      options.artifacts = true;
      break;
    case '--dependencies':
    case '-d':
      options.dependencies = true;
      break;
    case '--cache':
    case '-c':
      options.cache = true;
      break;
    case '--logs':
    case '-l':
      options.logs = true;
      break;
    case '--all':
      options.all = true;
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--force':
      options.force = true;
      break;
    case '--help':
      console.log(`
Usage: npx ts-node scripts/clean.ts [options]

Options:
  -a, --artifacts     Clean build artifacts (dist, build, etc.)
  -d, --dependencies  Clean node_modules and lock files
  -c, --cache         Clean cache directories
  -l, --logs          Clean log files
  --all               Clean everything
  --dry-run           Show what would be deleted without deleting
  --force             Skip confirmation prompts
  --help              Show this help message

Examples:
  npx ts-node scripts/clean.ts --artifacts
  npx ts-node scripts/clean.ts --all --dry-run
  npx ts-node scripts/clean.ts -a -c
`);
      process.exit(0);
  }
}

// Default to cleaning artifacts if no specific option is provided
if (!options.artifacts && !options.dependencies && !options.cache && !options.logs && !options.all) {
  options.artifacts = true;
}

// Run cleanup
const cleanSystem = new CleanSystem();
cleanSystem.clean(options).catch((error: Error) => {
  console.error('Fatal cleanup error:', error);
  process.exit(1);
});
