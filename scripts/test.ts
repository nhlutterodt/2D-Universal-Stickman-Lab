/**
 * Enhanced testing framework with parallel execution and coverage reporting.
 * Features:
 * - Parallel test execution across packages
 * - Test coverage reporting
 * - Selective testing capability
 * - Watch mode for TDD
 * - Test result aggregation
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface TestResult {
  package: string;
  success: boolean;
  duration: number;
  output?: string;
}

interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  package?: string;
  parallel?: boolean;
}

class TestSystem {
  private startTime: number = performance.now();
  private results: TestResult[] = [];

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

  private async runTestForPackage(packagePath: string, options: TestOptions): Promise<TestResult> {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    const pkgName = pkgJson.name;
    const startTime = performance.now();

    return new Promise((resolve) => {
      if (!pkgJson.scripts?.test) {
        this.log(`No test script found for ${pkgName}, skipping...`);
        resolve({
          package: pkgName,
          success: true,
          duration: 0,
          output: 'No tests configured'
        });
        return;
      }

      this.log(`Running tests for ${pkgName}...`);
      
      const testCommand = options.coverage ? 'test:coverage' : 'test';
      const command = pkgJson.scripts[testCommand] ? testCommand : 'test';
      
      const childProcess = spawn('npm', ['run', command], {
        cwd: packagePath,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      let output = '';
      
      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.on('error', (error: Error) => {
        this.log(`Test error in ${pkgName}: ${error.message}`, true);
        resolve({
          package: pkgName,
          success: false,
          duration: performance.now() - startTime,
          output: error.message
        });
      });

      childProcess.on('exit', (code: number | null) => {
        const duration = performance.now() - startTime;
        const success = code === 0;
        
        if (success) {
          this.log(`Tests passed for ${pkgName} (${(duration / 1000).toFixed(2)}s)`);
        } else {
          this.log(`Tests failed for ${pkgName} (${(duration / 1000).toFixed(2)}s)`, true);
        }

        resolve({
          package: pkgName,
          success,
          duration,
          output
        });
      });
    });
  }

  private printSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total packages: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (failedTests > 0) {
      console.log('\nFailed packages:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.package}`);
          if (r.output) {
            console.log(`    ${r.output.split('\n')[0]}`);
          }
        });
    }
    
    console.log('='.repeat(50));
  }

  public async test(options: TestOptions = {}): Promise<void> {
    try {
      // 1. Discover packages
      this.log('Discovering packages...');
      const roots = ['packages', 'apps', 'cli'];
      let packagePaths = roots.flatMap(root => 
        this.findPackages(path.join(__dirname, '..', root))
      );

      // 2. Filter by specific package if requested
      if (options.package) {
        packagePaths = packagePaths.filter(pkgPath => {
          const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
          return pkgJson.name === options.package || path.basename(pkgPath) === options.package;
        });
        
        if (packagePaths.length === 0) {
          this.log(`Package '${options.package}' not found`, true);
          process.exit(1);
        }
      }

      // 3. Run tests
      if (options.parallel !== false && packagePaths.length > 1) {
        this.log('Running tests in parallel...');
        const testPromises = packagePaths.map(pkgPath => 
          this.runTestForPackage(pkgPath, options)
        );
        this.results = await Promise.all(testPromises);
      } else {
        this.log('Running tests sequentially...');
        for (const pkgPath of packagePaths) {
          const result = await this.runTestForPackage(pkgPath, options);
          this.results.push(result);
        }
      }

      // 4. Print summary
      this.printSummary();

      // 5. Exit with appropriate code
      const hasFailures = this.results.some(r => !r.success);
      if (hasFailures) {
        process.exit(1);
      }

      this.log('All tests completed successfully!');
    } catch (error) {
      this.log(`Test execution failed: ${error}`, true);
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: TestOptions = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--watch':
      options.watch = true;
      break;
    case '--coverage':
      options.coverage = true;
      break;
    case '--package':
      options.package = args[++i];
      break;
    case '--sequential':
      options.parallel = false;
      break;
  }
}

// Run tests
const testSystem = new TestSystem();
testSystem.test(options).catch((error: Error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
