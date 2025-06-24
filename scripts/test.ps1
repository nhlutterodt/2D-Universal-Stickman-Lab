# Enhanced test script using TypeScript test system
param(
    [switch]$Watch,
    [switch]$Coverage,
    [string]$Package,
    [switch]$Sequential
)

Write-Host "[test] Starting enhanced test runner..." -ForegroundColor Green

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[test] Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if TypeScript is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "[test] Error: npx is not available" -ForegroundColor Red
    exit 1
}

# Build command arguments
$args = @()
if ($Watch) { $args += "--watch" }
if ($Coverage) { $args += "--coverage" }
if ($Package) { $args += "--package", $Package }
if ($Sequential) { $args += "--sequential" }

try {
    # Run the TypeScript test system with arguments
    npx ts-node scripts/test.ts $args
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[test] All tests completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[test] Some tests failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "[test] Test execution failed: $_" -ForegroundColor Red
    exit 1
}
