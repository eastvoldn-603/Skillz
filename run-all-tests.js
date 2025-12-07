/**
 * Test Runner - Runs all tests and reports results
 */

const { spawn } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color]}${msg}${colors.reset}`);
};

// Check if server is running
const checkServer = (url, name) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      log(`✅ ${name} is running`, 'green');
      resolve(true);
    }).on('error', () => {
      log(`❌ ${name} is NOT running`, 'red');
      resolve(false);
    });
  });
};

// Run a test command
const runTest = (name, command, args = []) => {
  return new Promise((resolve) => {
    log(`\n🧪 Running ${name}...`, 'cyan');
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    let output = '';
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        log(`✅ ${name} passed`, 'green');
        resolve({ success: true, output });
      } else {
        log(`❌ ${name} failed (exit code: ${code})`, 'red');
        resolve({ success: false, code, output });
      }
    });

    child.on('error', (err) => {
      log(`❌ ${name} error: ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });
  });
};

// Main test runner
(async () => {
  log('\n' + '='.repeat(60), 'cyan');
  log('COMPREHENSIVE TEST RUNNER', 'cyan');
  log('='.repeat(60), 'cyan');

  // Check servers
  log('\n📡 Checking servers...', 'cyan');
  const backendRunning = await checkServer('http://localhost:5000/api/health', 'Backend');
  const frontendRunning = await checkServer('http://localhost:3000', 'Frontend');

  if (!backendRunning || !frontendRunning) {
    log('\n⚠️  Warning: Some servers are not running. E2E tests may fail.', 'yellow');
    log('   Start servers with: npm run dev', 'yellow');
  }

  const results = {
    unit: null,
    e2eSignup: null,
    e2eFull: null
  };

  // 1. Unit tests
  results.unit = await runTest('Unit Tests', 'npm', ['test', '--', '--passWithNoTests']);

  // 2. E2E Signup tests (if servers running)
  if (backendRunning && frontendRunning) {
    results.e2eSignup = await runTest('E2E Signup Tests', 'node', ['tests/e2e-puppeteer/signup.test.js']);
  } else {
    log('\n⏭️  Skipping E2E Signup Tests (servers not running)', 'yellow');
    results.e2eSignup = { success: false, skipped: true };
  }

  // 3. E2E Full tests (if servers running)
  if (backendRunning && frontendRunning) {
    results.e2eFull = await runTest('E2E Full Application Tests', 'node', ['tests/e2e-puppeteer/full-application.test.js']);
  } else {
    log('\n⏭️  Skipping E2E Full Tests (servers not running)', 'yellow');
    results.e2eFull = { success: false, skipped: true };
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const allPassed = results.unit.success && 
    (results.e2eSignup.skipped || results.e2eSignup.success) &&
    (results.e2eFull.skipped || results.e2eFull.success);

  log(`\nUnit Tests: ${results.unit.success ? '✅ PASSED' : '❌ FAILED'}`, results.unit.success ? 'green' : 'red');
  
  if (results.e2eSignup.skipped) {
    log(`E2E Signup: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Signup: ${results.e2eSignup.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eSignup.success ? 'green' : 'red');
  }
  
  if (results.e2eFull.skipped) {
    log(`E2E Full: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Full: ${results.e2eFull.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eFull.success ? 'green' : 'red');
  }

  log('\n' + '='.repeat(60), 'cyan');
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED!', 'green');
    process.exit(0);
  } else {
    log('⚠️  SOME TESTS FAILED', 'red');
    process.exit(1);
  }
})();

