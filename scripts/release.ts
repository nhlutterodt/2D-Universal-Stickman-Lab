/**
 * Enhanced release management system with automated validation and rollback.
 * Features:
 * - Automated version bumping with semantic versioning
 * - Changelog generation
 * - Artifact validation
 * - Rollback capability
 * - Multi-platform support
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface ReleaseOptions {
  type: 'patch' | 'minor' | 'major';
  dryRun?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
}

class ReleaseSystem {
  private startTime: number = performance.now();
  private originalVersion: string = '';

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

  private getCurrentVersion(): string {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  }

  private validateWorkingDirectory(): void {
    this.log('Validating working directory...');
    
    // Check if we're in a git repository
    try {
      this.execCommand('git rev-parse --git-dir');
    } catch {
      throw new Error('Not in a git repository');
    }

    // Check for uncommitted changes
    const status = this.execCommand('git status --porcelain');
    if (status.length > 0) {
      throw new Error('Working directory has uncommitted changes. Please commit or stash them first.');
    }

    // Check if we're on main/master branch
    const currentBranch = this.execCommand('git rev-parse --abbrev-ref HEAD');
    if (!['main', 'master'].includes(currentBranch)) {
      this.log(`Warning: Not on main/master branch (current: ${currentBranch})`, true);
    }
  }

  private runTests(): void {
    this.log('Running tests...');
    try {
      this.execCommand('npx ts-node scripts/test.ts');
    } catch (error) {
      throw new Error(`Tests failed: ${error}`);
    }
  }

  private runBuild(): void {
    this.log('Running build...');
    try {
      this.execCommand('npx ts-node scripts/build.ts');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  private bumpVersion(type: string): string {
    this.log(`Bumping version (${type})...`);
    const output = this.execCommand(`npm version ${type} --no-git-tag-version`);
    const newVersion = output.replace('v', '');
    this.log(`Version bumped to ${newVersion}`);
    return newVersion;
  }

  private generateChangelog(): void {
    this.log('Generating changelog...');
    try {
      // Try to use conventional-changelog if available
      this.execCommand('npx conventional-changelog -p angular -i CHANGELOG.md -s');
    } catch {
      // Fallback to simple git log
      this.log('conventional-changelog not available, using git log fallback');
      const gitLog = this.execCommand('git log --oneline --since="1 month ago"');
      const changelogEntry = `\n## [${this.getCurrentVersion()}] - ${new Date().toISOString().split('T')[0]}\n\n${gitLog}\n`;
      
      let changelog = '';
      if (fs.existsSync('CHANGELOG.md')) {
        changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
      }
      
      fs.writeFileSync('CHANGELOG.md', changelogEntry + changelog);
    }
  }

  private validateArtifacts(): void {
    this.log('Validating build artifacts...');
    
    // Check if dist directory exists and has content
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist');
      if (distFiles.length === 0) {
        throw new Error('dist directory is empty');
      }
      this.log(`Found ${distFiles.length} files in dist/`);
    }

    // Validate package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!packageJson.name || !packageJson.version) {
        throw new Error('Invalid package.json');
      }
    } catch {
      throw new Error('package.json validation failed');
    }
  }

  private commitAndTag(version: string): void {
    this.log('Committing changes and creating tag...');
    
    // Add files to git
    this.execCommand('git add CHANGELOG.md package.json package-lock.json');
    
    // Commit changes
    this.execCommand(`git commit -m "chore(release): bump version to ${version}"`);
    
    // Create tag
    this.execCommand(`git tag v${version}`);
    
    this.log(`Created tag v${version}`);
  }

  private pushChanges(): void {
    this.log('Pushing changes to remote...');
    this.execCommand('git push --follow-tags');
  }

  private rollback(): void {
    this.log('Rolling back changes...', true);
    try {
      // Reset to original version
      if (this.originalVersion) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = this.originalVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
      }
      
      // Reset git changes
      this.execCommand('git reset --hard HEAD~1');
      this.execCommand('git tag -d $(git tag -l | tail -1)');
      
      this.log('Rollback completed');
    } catch (error) {
      this.log(`Rollback failed: ${error}`, true);
    }
  }

  public async release(options: ReleaseOptions): Promise<void> {
    this.originalVersion = this.getCurrentVersion();
    
    try {
      this.log(`Starting release process (${options.type})...`);
      
      if (options.dryRun) {
        this.log('DRY RUN MODE - No changes will be made');
      }

      // 1. Validate environment
      this.validateWorkingDirectory();

      // 2. Run tests (unless skipped)
      if (!options.skipTests) {
        this.runTests();
      }

      // 3. Run build (unless skipped)
      if (!options.skipBuild) {
        this.runBuild();
      }

      // 4. Validate artifacts
      this.validateArtifacts();

      if (options.dryRun) {
        this.log('Dry run completed successfully - no changes made');
        return;
      }

      // 5. Bump version
      const newVersion = this.bumpVersion(options.type);

      // 6. Generate changelog
      this.generateChangelog();

      // 7. Commit and tag
      this.commitAndTag(newVersion);

      // 8. Push changes
      this.pushChanges();

      const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Release ${newVersion} completed successfully in ${duration}s`);
      
      // 9. Post-release actions
      this.log('Consider running post-release actions:');
      this.log('  - Publish to npm: npm publish');
      this.log('  - Deploy documentation: npm run deploy:docs');
      this.log('  - Create GitHub release: gh release create');

    } catch (error) {
      this.log(`Release failed: ${error}`, true);
      if (!options.dryRun) {
        this.rollback();
      }
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: ReleaseOptions = {
  type: 'patch' // default
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--patch':
      options.type = 'patch';
      break;
    case '--minor':
      options.type = 'minor';
      break;
    case '--major':
      options.type = 'major';
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--skip-tests':
      options.skipTests = true;
      break;
    case '--skip-build':
      options.skipBuild = true;
      break;
    case '--help':
      console.log(`
Usage: npx ts-node scripts/release.ts [options]

Options:
  --patch       Bump patch version (default)
  --minor       Bump minor version
  --major       Bump major version
  --dry-run     Run without making changes
  --skip-tests  Skip running tests
  --skip-build  Skip running build
  --help        Show this help message
`);
      process.exit(0);
  }
}

// Run release
const releaseSystem = new ReleaseSystem();
releaseSystem.release(options).catch((error: Error) => {
  console.error('Fatal release error:', error);
  process.exit(1);
});
