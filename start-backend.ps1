# Skillz - Start Backend Server Only
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server (SQLite)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any existing Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "🚀 Starting on http://localhost:5000" -ForegroundColor Green
Write-Host "📦 Database: SQLite (skillz.db)" -ForegroundColor Green
Write-Host ""

npm run server
