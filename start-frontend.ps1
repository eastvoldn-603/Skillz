# Skillz - Start Frontend Server Only
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Server (React)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to client directory
Set-Location client

Write-Host "🚀 Starting on http://localhost:3000" -ForegroundColor Green
Write-Host "🔗 Backend API: http://localhost:5000" -ForegroundColor Gray
Write-Host "⏳ Compiling... This may take 30-60 seconds" -ForegroundColor Yellow
Write-Host ""

npm start
