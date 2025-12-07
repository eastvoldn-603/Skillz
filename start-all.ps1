# Skillz - Start All Servers Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Skillz - Starting All Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any existing Node processes
Write-Host "🛑 Stopping existing servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Cleaned up" -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "🚀 Starting Backend Server (SQLite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\preci\Desktop\Projects\Skillz'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Skillz Backend Server (SQLite)' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting on http://localhost:5000' -ForegroundColor Green; Write-Host 'Database: SQLite (skillz.db)' -ForegroundColor Green; Write-Host ''; npm run server" -WindowStyle Normal
Write-Host "✅ Backend server starting in new window" -ForegroundColor Green
Write-Host ""

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend Server
Write-Host "🚀 Starting Frontend Server (React)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\preci\Desktop\Projects\Skillz\client'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Skillz Frontend Server (React)' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting on http://localhost:3000' -ForegroundColor Green; Write-Host 'Backend API: http://localhost:5000' -ForegroundColor Gray; Write-Host ''; Write-Host '⏳ Compiling... This may take 30-60 seconds' -ForegroundColor Yellow; Write-Host ''; npm start" -WindowStyle Normal
Write-Host "✅ Frontend server starting in new window" -ForegroundColor Green
Write-Host ""

# Wait and verify
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🔍 Verifying servers..." -ForegroundColor Cyan
$backendOk = $false
$frontendOk = $false

for ($i = 1; $i -le 15; $i++) {
    # Check backend
    if (-not $backendOk) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2
            Write-Host "✅ Backend: RUNNING (http://localhost:5000)" -ForegroundColor Green
            $backendOk = $true
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    # Check frontend
    if (-not $frontendOk) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            Write-Host "✅ Frontend: RUNNING (http://localhost:3000)" -ForegroundColor Green
            $frontendOk = $true
        } catch {
            # Frontend takes longer to compile
        }
    }
    
    if ($backendOk -and $frontendOk) {
        break
    }
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host ""

if ($backendOk -and $frontendOk) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  🎉 BOTH SERVERS ARE READY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Your browser should open automatically" -ForegroundColor Yellow
    Write-Host "💡 If not, open: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 To stop servers: Close the PowerShell windows" -ForegroundColor Gray
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ⚠️  SERVERS STARTING..." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    if (-not $backendOk) {
        Write-Host "⏳ Backend still starting... check backend window" -ForegroundColor Yellow
        Write-Host "   Look for: 'Server running on port 5000'" -ForegroundColor Gray
    }
    if (-not $frontendOk) {
        Write-Host "⏳ Frontend still compiling... check frontend window" -ForegroundColor Yellow
        Write-Host "   Look for: 'Compiled successfully!'" -ForegroundColor Gray
        Write-Host "   React can take 30-60 seconds to compile" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 Once both show ready, open: http://localhost:3000" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

