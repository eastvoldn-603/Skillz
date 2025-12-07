# Puppeteer E2E Tests

## Why Puppeteer Instead of Playwright?

Playwright 1.57.0+ has issues on Windows with `chromium-headless-shell` - it defaults to using a headless shell executable that doesn't work reliably. Puppeteer is more stable on Windows and doesn't have this issue.

## Running Tests

### Option 1: Manual Server Start (Recommended)

1. **Start Backend:**
   ```bash
   npm run server
   ```

2. **Start Frontend (in another terminal):**
   ```bash
   cd client
   npm start
   ```

3. **Run Tests:**
   ```bash
   node tests/e2e-puppeteer/signup.test.js
   ```

### Option 2: Auto-Runner (Experimental)

```bash
node run-puppeteer-tests.js
```

This will attempt to start servers automatically, but manual start is more reliable.

## Test Coverage

The Puppeteer tests cover the same 10 scenarios as Playwright:

1. ✅ Successful account creation
2. ✅ Password mismatch validation
3. ✅ Password length validation
4. ✅ Invalid email validation
5. ✅ Required fields validation
6. ✅ Duplicate email handling
7. ✅ Network error handling
8. ✅ Loading state verification
9. ✅ Token storage verification
10. ✅ Optional phone field handling

## Advantages of Puppeteer

- ✅ More reliable on Windows
- ✅ No headless shell issues
- ✅ Simpler configuration
- ✅ Better error messages
- ✅ Faster browser launch

## Test Output

Tests will show:
- ✅ Green checkmarks for passed tests
- ❌ Red X for failed tests
- Summary at the end with pass/fail counts

## Troubleshooting

### "Server not available" error
- Make sure both servers are running
- Backend on port 5000
- Frontend on port 3000

### Browser launch fails
- Puppeteer downloads Chromium automatically on first run
- If it fails, run: `npx puppeteer browsers install chromium`

### Tests timeout
- Increase timeout in the test file if servers are slow to start
- Default is 60 seconds per test

