# Multi-User Job Application Tests

## Overview
Tests verify that multiple users can apply to the same job, and each user can apply with multiple resumes.

## Test Coverage

### ✅ Test 1: Multiple users can apply to the same job
- Creates 3 different users
- Each user creates 1 resume
- All 3 users apply to the same job
- Verifies all applications are created successfully
- Verifies each user can see their own application

### ✅ Test 2: Single user can apply to same job with multiple resumes
- Creates 1 user
- User creates 3 different resumes
- User applies to the same job with all 3 resumes
- Verifies all 3 applications are created
- Verifies each application uses a different resume

### ✅ Test 3: Multiple users with multiple resumes applying to same job
- Creates 2 users
- Each user creates 2 resumes
- Each user applies to the same job with both resumes
- Verifies each user has 2 applications
- Verifies applications use different resumes

### ✅ Test 4: Users cannot see other users' applications
- Creates 2 users
- Both users apply to the same job
- Verifies each user can only see their own application
- Verifies privacy/isolation between users

### ✅ Test 5: User can apply to multiple jobs with the same resume
- Creates 1 user
- User creates 1 resume
- User applies to 2 different jobs with the same resume
- Verifies both applications are created
- Verifies both use the same resume

## Running Tests

```bash
npm run test:e2e:multi-user
# or
node tests/e2e-puppeteer/multi-user-job-application.test.js
```

## Prerequisites

- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000` (optional - tests use API directly)
- At least 2 jobs seeded in database

## Seed Jobs

To seed 10 temporary jobs for testing:

```bash
npm run seed:jobs
```

**Note**: These are temporary jobs for testing. They will not be used in production.

## Test Results

All 5 tests passing ✅

## Implementation Details

### Backend Changes
- Modified `server/routes/jobs.js` to allow multiple applications to the same job
- Changed duplicate check from `(user_id, job_id)` to `(user_id, job_id, resume_id)`
- Users can now apply to the same job multiple times with different resumes

### Test Implementation
- Uses Node.js `http` module for API calls (no external dependencies)
- Creates unique test users for each test
- Cleans up after tests (test data remains but uses unique emails)
- Tests both API functionality and data isolation

## Test Data

Tests use unique email addresses:
- Format: `{prefix}{timestamp}{random}@multi-user-test.com`
- Ensures no conflicts between test runs
- Each test creates fresh users and resumes

