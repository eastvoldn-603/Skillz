# E2E Test Coverage

## Overview
Comprehensive end-to-end tests covering all requirements from `SoftwareRequirements.txt`.

## Test Files

### 1. `tests/e2e-puppeteer/signup.test.js`
**Focus**: User signup/registration flow
- ✅ Successful account creation
- ✅ Password validation (mismatch, length, etc.)
- ✅ Email validation
- ✅ Duplicate email handling
- ✅ Network error handling
- ✅ Loading states
- ✅ Token storage

### 2. `tests/e2e-puppeteer/full-application.test.js`
**Focus**: Complete application functionality

## Test Coverage by Requirement

### 1. User Account Management (7 tests)
- ✅ **1.1** - Create account
- ✅ **1.2** - Login to system
- ✅ **1.3** - View profile information
- ✅ **1.4** - Edit profile information
- ✅ **1.5** - Logout of system
- ✅ **1.6** - Change password
- ✅ **1.7** - Reset password (forgot password)

### 2. Resume Management (5 tests)
- ✅ **2.1** - Create a new resume
- ✅ **2.2** - View resumes
- ✅ **2.3** - Edit resume
- ✅ **2.4** - Delete resume
- ✅ **2.5** - Create multiple resumes

### 3. Job Application Management (8 tests)
- ✅ **3.1** - View available jobs
- ✅ **3.2** - Apply to a job
- ✅ **3.3** - View job applications
- ✅ **3.4** - Edit job application
- ✅ **3.5** - Delete job application
- ✅ **3.6** - View job offers
- ✅ **3.7** - Edit job offer
- ✅ **3.8** - Delete job offer

### 4. Page Navigation (6 tests)
- ✅ **4.1** - Login page accessible
- ✅ **4.2** - Signup page accessible
- ✅ **4.3** - Forgot password page accessible
- ✅ **4.4** - Change password page accessible (authenticated)
- ✅ **4.5** - Delete account page accessible (authenticated)
- ✅ **4.6** - Logout button in navbar (all pages)

### 5. Account Deletion (1 test)
- ✅ **5.1** - Delete account

## Running Tests

### Run Signup Tests Only
```bash
npm run test:e2e
# or
node tests/e2e-puppeteer/signup.test.js
```

### Run Full Application Tests
```bash
npm run test:e2e:full
# or
node tests/e2e-puppeteer/full-application.test.js
```

### Run All Unit Tests
```bash
npm test
```

## Prerequisites

1. **Backend server** must be running on `http://localhost:5000`
2. **Frontend server** must be running on `http://localhost:3000`
3. **Database** (SQLite) must be initialized

### Starting Servers

```bash
# Start both servers
npm run dev

# Or separately:
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

## Test Structure

Each test:
1. Sets up browser and page
2. Navigates to the required page
3. Performs actions (click, type, submit)
4. Verifies expected outcomes
5. Cleans up resources

## Test Results

Tests output:
- ✅ Passed tests (green)
- ❌ Failed tests (red) with error messages
- ⚠️ Warnings (yellow)
- ℹ️ Info messages (cyan)

Final summary shows:
- Total passed
- Total failed
- List of errors (if any)

## Notes

- Tests use unique email addresses (timestamp-based) to avoid conflicts
- Tests clean up after themselves (delete test data when possible)
- Some tests may skip if prerequisites aren't met (e.g., no jobs to apply to)
- Account deletion test runs last (destroys test user)

## Troubleshooting

### Tests fail with "Server not available"
- Ensure backend is running: `npm run server`
- Ensure frontend is running: `npm run client`
- Check ports: Backend (5000), Frontend (3000)

### Tests fail with "Element not found"
- Page may be loading slowly - tests have timeouts
- Check browser console for JavaScript errors
- Verify frontend is compiled and running

### localStorage access errors
- Tests handle localStorage access with try-catch
- If persistent, check browser security settings

### Database errors
- Ensure SQLite database is initialized
- Check database file permissions
- Verify `.env` configuration

