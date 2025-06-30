#!/usr/bin/env pwsh
# Build script for 2D Universal Stickman Lab

Write-Host "Building TypeScript to JavaScript..." -ForegroundColor Green

# Compile TypeScript
npx tsc

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "Compiled files are in the 'dist/' directory" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To test the application:" -ForegroundColor Yellow
    Write-Host "  1. Navigate to apps/authoring-ui/" -ForegroundColor White
    Write-Host "  2. Start a local server (e.g., 'python -m http.server 8000')" -ForegroundColor White
    Write-Host "  3. Open http://localhost:8000 in your browser" -ForegroundColor White
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
