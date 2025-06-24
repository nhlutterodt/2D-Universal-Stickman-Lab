# Enhanced development script using TypeScript dev system
Write-Host "[dev] Starting enhanced development environment..." -ForegroundColor Green

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[dev] Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if TypeScript is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "[dev] Error: npx is not available" -ForegroundColor Red
    exit 1
}

try {
    # Run the TypeScript development system
    npx ts-node scripts/dev.ts
    Write-Host "[dev] Development environment stopped!" -ForegroundColor Yellow
} catch {
    Write-Host "[dev] Development environment failed: $_" -ForegroundColor Red
    exit 1
}
