# Enhanced build script using TypeScript build system
Write-Host "[build] Starting enhanced build pipeline..." -ForegroundColor Green

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[build] Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if TypeScript is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "[build] Error: npx is not available" -ForegroundColor Red
    exit 1
}

try {
    # Run the TypeScript build system
    npx ts-node scripts/build.ts
    Write-Host "[build] Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "[build] Build failed: $_" -ForegroundColor Red
    exit 1
}
