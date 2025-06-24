/**
 * Development workflow script with concurrent package building.
 * Features:
 * - Concurrent package building
 * - Development server configuration
 * - Selective package development
 * - Basic file watching using Node.js fs.watch
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface DevProcess {
  name: string;
  process: ChildProcess;
}

class DevSystem {
  private processes: DevProcess[] = [];
  private startTime: number = performance.now();

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

  private startDevServer(packagePath: string): void {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    const pkgName = pkgJson.name;

    if (pkgJson.scripts?.dev) {
      this.log(`Starting dev server for ${pkgName}...`);
      const childProcess = spawn('npm', ['run', 'dev'], {
        cwd: packagePath,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      this.processes.push({ name: pkgName, process: childProcess });

      childProcess.on('error', (error: Error) => {
        this.log(`Dev server error in ${pkgName}: ${error.message}`, true);
      });

      childProcess.on('exit', (code: number | null) => {
        if (code !== null && code !== 0) {
          this.log(`Dev server for ${pkgName} exited with code ${code}`, true);
        }
      });
    }
  }

  private setupWatcher(packagePath: string): void {
    const pkgName = path.basename(packagePath);
    this.log(`Setting up file watcher for ${pkgName}...`);

    try {
      // Watch the src directory if it exists
      const srcPath = path.join(packagePath, 'src');
      if (fs.existsSync(srcPath)) {
        fs.watch(srcPath, { recursive: true }, (eventType: string, filename: string | null) => {
          if (filename) {
            this.log(`File ${eventType}: ${filename} in ${pkgName}`);
          }
        });
      }
    } catch (error) {
      this.log(`Watcher setup error in ${pkgName}: ${error}`, true);
    }
  }

  public async dev(): Promise<void> {
    try {
      // 1. Discover all packages
      this.log('Discovering packages...');
      const roots = ['packages', 'apps', 'cli'];
      const packagePaths = roots.flatMap(root => 
        this.findPackages(path.join(__dirname, '..', root))
      );

      // 2. Start dev servers and watchers
      for (const pkgPath of packagePaths) {
        this.startDevServer(pkgPath);
        this.setupWatcher(pkgPath);
      }

      // 3. Handle process termination
      const cleanup = () => {
        this.log('Shutting down dev servers...');
        this.processes.forEach(({ name, process: childProcess }) => {
          this.log(`Stopping ${name}...`);
          childProcess.kill();
        });
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      this.log('Development environment ready! Press Ctrl+C to stop.');
      
      // Keep the process alive
      await new Promise(() => {});
    } catch (error) {
      this.log(`Development environment setup failed: ${error}`, true);
      process.exit(1);
    }
  }
}

// Run development environment
const devSystem = new DevSystem();
devSystem.dev().catch((error: Error) => {
  console.error('Fatal development error:', error);
  process.exit(1);
});
