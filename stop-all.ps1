# Skillz - Stop All Servers
Write-Host "🛑 Stopping all Skillz servers..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "✅ All servers stopped" -ForegroundColor Green

