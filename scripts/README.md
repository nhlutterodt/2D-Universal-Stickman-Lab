# Build Scripts Documentation

This directory contains enhanced build and utility scripts for the 2D Universal Stickman Lab monorepo. All scripts are implemented in TypeScript for better maintainability and cross-platform compatibility.

## Overview

The build system has been completely redesigned with the following improvements:

- **Cross-platform compatibility** - All scripts work on Windows, macOS, and Linux
- **TypeScript implementation** - Better type safety and maintainability
- **Parallel processing** - Faster builds and tests through concurrent execution
- **Comprehensive error handling** - Detailed error reporting and recovery
- **Dependency management** - Automatic dependency graph resolution
- **Security validation** - Built-in CSP and security checks

## Scripts

### Core Build Scripts

#### `build.ts` / `build.ps1`
Enhanced build pipeline with dependency resolution and parallel building.

```bash
# TypeScript version
npx ts-node scripts/build.ts

# PowerShell version (Windows)
.\scripts\build.ps1
```

**Features:**
- Automatic package discovery and dependency resolution
- Parallel building where possible
- Build artifact validation
- Comprehensive error handling and logging
- Performance timing

#### `dev.ts` / `dev.ps1`
Development environment with concurrent package building and file watching.

```bash
# TypeScript version
npx ts-node scripts/dev.ts

# PowerShell version (Windows)
.\scripts\dev.ps1
```

**Features:**
- Concurrent development servers
- File watching with automatic rebuilds
- Process management and cleanup
- Development-specific optimizations

#### `test.ts` / `test.ps1`
Enhanced testing framework with parallel execution and coverage reporting.

```bash
# TypeScript version
npx ts-node scripts/test.ts [options]

# PowerShell version (Windows)
.\scripts\test.ps1 [options]
```

**Options:**
- `--watch` - Run tests in watch mode
- `--coverage` - Generate coverage reports
- `--package <name>` - Test specific package only
- `--sequential` - Run tests sequentially instead of parallel

**Examples:**
```bash
npx ts-node scripts/test.ts --coverage
npx ts-node scripts/test.ts --package @lab/core
npx ts-node scripts/test.ts --watch
```

#### `release.ts` / `release.ps1`
Automated release management with version bumping and validation.

```bash
# TypeScript version
npx ts-node scripts/release.ts [options]

# PowerShell version (Windows)
.\scripts\release.ps1 [options]
```

**Options:**
- `--patch` - Bump patch version (default)
- `--minor` - Bump minor version
- `--major` - Bump major version
- `--dry-run` - Preview changes without applying them
- `--skip-tests` - Skip running tests
- `--skip-build` - Skip running build

**Examples:**
```bash
npx ts-node scripts/release.ts --minor
npx ts-node scripts/release.ts --dry-run
```

### Utility Scripts

#### `list-packages.ts`
Enhanced package discovery and workspace analysis.

```bash
npx ts-node scripts/list-packages.ts [options]
```

**Options:**
- `-v, --verbose` - Show detailed package information
- `-h, --health` - Show package health status
- `-g, --graph` - Show dependency graph
- `-j, --json` - Output as JSON

**Examples:**
```bash
npx ts-node scripts/list-packages.ts --verbose --health
npx ts-node scripts/list-packages.ts --graph
```

#### `clean.ts`
Comprehensive cleanup utility for build artifacts and dependencies.

```bash
npx ts-node scripts/clean.ts [options]
```

**Options:**
- `-a, --artifacts` - Clean build artifacts (dist, build, etc.)
- `-d, --dependencies` - Clean node_modules and lock files
- `-c, --cache` - Clean cache directories
- `-l, --logs` - Clean log files
- `--all` - Clean everything
- `--dry-run` - Show what would be deleted without deleting

**Examples:**
```bash
npx ts-node scripts/clean.ts --artifacts
npx ts-node scripts/clean.ts --all --dry-run
```

#### `workspace.ts`
Workspace management utility for monorepo operations.

```bash
npx ts-node scripts/workspace.ts <command> [options]
```

**Commands:**
- `install` - Install dependencies for all packages
- `link` - Link internal dependencies
- `validate` - Validate workspace configuration
- `update` - Update dependencies
- `info` - Show workspace information

**Options:**
- `-p, --package <name>` - Target specific package
- `--force` - Force operation
- `--dry-run` - Show what would be done

**Examples:**
```bash
npx ts-node scripts/workspace.ts install
npx ts-node scripts/workspace.ts validate
npx ts-node scripts/workspace.ts link --dry-run
```

#### `verify-csp.ts`
Enhanced CSP verification and security validation tool.

```bash
npx ts-node scripts/verify-csp.ts [options] [files...]
```

**Options:**
- `--fix` - Automatically fix CSP issues where possible
- `--strict` - Use strict CSP validation rules
- `-r, --recursive` - Recursively search directories for HTML files

**Examples:**
```bash
npx ts-node scripts/verify-csp.ts apps/authoring-ui/index.html
npx ts-node scripts/verify-csp.ts --fix --recursive apps/
```

## Configuration Files

#### `csp-meta.html`
Template CSP meta tag for injection into HTML files.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'">
```

## Usage Patterns

### Development Workflow

1. **Start development environment:**
   ```bash
   npx ts-node scripts/dev.ts
   ```

2. **Run tests in watch mode:**
   ```bash
   npx ts-node scripts/test.ts --watch
   ```

3. **Validate workspace:**
   ```bash
   npx ts-node scripts/workspace.ts validate
   ```

### Build and Release Workflow

1. **Clean previous builds:**
   ```bash
   npx ts-node scripts/clean.ts --artifacts
   ```

2. **Run full build:**
   ```bash
   npx ts-node scripts/build.ts
   ```

3. **Run tests with coverage:**
   ```bash
   npx ts-node scripts/test.ts --coverage
   ```

4. **Validate security:**
   ```bash
   npx ts-node scripts/verify-csp.ts --recursive apps/
   ```

5. **Release (dry run first):**
   ```bash
   npx ts-node scripts/release.ts --minor --dry-run
   npx ts-node scripts/release.ts --minor
   ```

### Maintenance Workflow

1. **Update dependencies:**
   ```bash
   npx ts-node scripts/workspace.ts update
   ```

2. **Clean everything:**
   ```bash
   npx ts-node scripts/clean.ts --all
   ```

3. **Reinstall dependencies:**
   ```bash
   npx ts-node scripts/workspace.ts install
   ```

4. **Validate workspace health:**
   ```bash
   npx ts-node scripts/list-packages.ts --health
   ```

## Error Handling

All scripts include comprehensive error handling:

- **Graceful failures** - Scripts exit with appropriate error codes
- **Detailed logging** - Timestamped logs with clear error messages
- **Rollback capabilities** - Automatic rollback on critical failures (release script)
- **Validation checks** - Pre-flight checks before destructive operations

## Performance Features

- **Parallel execution** - Build and test operations run in parallel where possible
- **Dependency caching** - Intelligent caching to avoid redundant operations
- **Incremental builds** - Only rebuild changed packages
- **Progress reporting** - Real-time progress updates with timing information

## Security Features

- **CSP validation** - Automatic Content Security Policy validation
- **Security headers** - Validation and injection of security headers
- **Dependency scanning** - Basic dependency vulnerability checks
- **Safe operations** - Dry-run modes for destructive operations

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors:**
   ```bash
   npm install -g typescript ts-node
   ```

2. **Permission errors on Windows:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Missing dependencies:**
   ```bash
   npx ts-node scripts/workspace.ts install
   ```

4. **Build failures:**
   ```bash
   npx ts-node scripts/clean.ts --artifacts
   npx ts-node scripts/build.ts
   ```

### Debug Mode

Add `DEBUG=1` environment variable for verbose logging:

```bash
DEBUG=1 npx ts-node scripts/build.ts
```

## Migration from Old Scripts

The old skeleton scripts have been replaced with enhanced TypeScript versions:

- `build.ps1` - Now calls `build.ts` with proper error handling
- `dev.ps1` - Now calls `dev.ts` with enhanced features
- `test.ps1` - Now calls `test.ts` with parallel execution
- `release.ps1` - Now calls `release.ts` with validation
- `list-packages.js` - Replaced with `list-packages.ts` with health checks

All PowerShell scripts are maintained for Windows compatibility but delegate to the TypeScript implementations.

## Contributing

When adding new scripts:

1. Implement in TypeScript for cross-platform compatibility
2. Add comprehensive error handling and logging
3. Include help text and examples
4. Add corresponding PowerShell wrapper if needed
5. Update this documentation

## Dependencies

The scripts require:

- Node.js 16+
- TypeScript / ts-node
- Git (for release operations)
- npm or pnpm (for package management)

Optional dependencies:
- JSDOM (for CSP validation)
- conventional-changelog (for release notes)
