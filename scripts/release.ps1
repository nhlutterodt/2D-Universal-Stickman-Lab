# Enhanced release script using TypeScript release system
param(
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Type = 'patch',
    [switch]$DryRun,
    [switch]$SkipTests,
    [switch]$SkipBuild
)

Write-Host "[release] Starting enhanced release process..." -ForegroundColor Green

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[release] Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if TypeScript is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "[release] Error: npx is not available" -ForegroundColor Red
    exit 1
}

# Check if Git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[release] Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Build command arguments
$args = @("--$Type")
if ($DryRun) { $args += "--dry-run" }
if ($SkipTests) { $args += "--skip-tests" }
if ($SkipBuild) { $args += "--skip-build" }

try {
    # Run the TypeScript release system with arguments
    npx ts-node scripts/release.ts $args
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[release] Release completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[release] Release failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "[release] Release execution failed: $_" -ForegroundColor Red
    exit 1
}
