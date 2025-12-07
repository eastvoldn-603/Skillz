# Quick Start Guide

## Start Both Servers

### Option 1: Use the Script (Easiest)
```powershell
.\start-all.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd C:\Users\preci\Desktop\Projects\Skillz
npm run server
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\preci\Desktop\Projects\Skillz\client
npm start
```

## Test Signup

Once both servers are running:

1. **Quick Test (Command Line):**
   ```powershell
   node test-signup-simple.js
   ```

2. **Full Diagnostic Test:**
   ```powershell
   node test-signup.js
   ```

3. **Browser Test:**
   - Open http://localhost:3000
   - Click "Sign Up"
   - Fill in the form
   - Submit

## Stop Servers

```powershell
.\stop-all.ps1
```

Or close the PowerShell windows.

## Troubleshooting

- **"ERR_CONNECTION_REFUSED"**: Backend not running. Start it with `npm run server`
- **"Network Error"**: Check that backend is on port 5000
- **Frontend won't load**: Wait for "Compiled successfully!" message (30-60 seconds)

