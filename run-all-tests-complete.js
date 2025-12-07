/**
 * Comprehensive Test Runner - Runs all tests and provides summary
 */

const { spawn } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
};

// Check if server is running
const checkServer = (url, name) => {
  return new Promise((resolve) => {
    http.get(url, () => {
      log(`✅ ${name} is running`, 'green');
      resolve(true);
    }).on('error', () => {
      log(`❌ ${name} is NOT running`, 'red');
      resolve(false);
    });
  });
};

// Run a test command
const runTest = (name, command, args = [], timeout = 120000) => {
  return new Promise((resolve) => {
    log(`\n🧪 Running ${name}...`, 'cyan');
    const startTime = Date.now();
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      log(`⏱️  ${name} timed out after ${timeout/1000}s`, 'yellow');
      resolve({ success: false, timeout: true });
    }, timeout);

    child.on('exit', (code) => {
      clearTimeout(timeoutId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        log(`✅ ${name} passed (${duration}s)`, 'green');
        resolve({ success: true, duration });
      } else {
        log(`❌ ${name} failed (exit code: ${code}, ${duration}s)`, 'red');
        resolve({ success: false, code, duration });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      log(`❌ ${name} error: ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });
  });
};

// Main test runner
(async () => {
  log('\n' + '='.repeat(70), 'cyan');
  log('COMPREHENSIVE TEST SUITE RUNNER', 'cyan');
  log('='.repeat(70), 'cyan');

  // Check servers
  log('\n📡 Checking servers...', 'cyan');
  const backendOk = await checkServer('http://localhost:5000/api/health', 'Backend');
  const frontendOk = await checkServer('http://localhost:3000', 'Frontend');

  const results = {
    unit: null,
    e2eSignup: null,
    e2eMultiUser: null,
    e2eResumeNav: null,
    e2eSkillsTree: null,
    e2eResumeComparison: null
  };

  // 1. Unit tests
  results.unit = await runTest('Unit Tests', 'npm', ['test', '--', '--passWithNoTests'], 60000);

  // 2. E2E Signup tests (if servers running)
  if (backendOk && frontendOk) {
    results.e2eSignup = await runTest('E2E Signup Tests', 'node', ['tests/e2e-puppeteer/signup.test.js'], 120000);
  } else {
    log('\n⏭️  Skipping E2E Signup Tests (servers not running)', 'yellow');
    results.e2eSignup = { success: false, skipped: true };
  }

  // 3. E2E Multi-User tests (if servers running)
  if (backendOk && frontendOk) {
    results.e2eMultiUser = await runTest('E2E Multi-User Job Application Tests', 'node', ['tests/e2e-puppeteer/multi-user-job-application.test.js'], 120000);
  } else {
    log('\n⏭️  Skipping E2E Multi-User Tests (servers not running)', 'yellow');
    results.e2eMultiUser = { success: false, skipped: true };
  }

  // 4. E2E Resume Navigation tests (if servers running)
  if (backendOk && frontendOk) {
    results.e2eResumeNav = await runTest('E2E Resume Navigation Tests', 'node', ['tests/e2e-puppeteer/resume-navigation.test.js'], 120000);
  } else {
    log('\n⏭️  Skipping E2E Resume Navigation Tests (servers not running)', 'yellow');
    results.e2eResumeNav = { success: false, skipped: true };
  }

  // 5. E2E Skills Tree and Resume tests (if servers running)
  if (backendOk && frontendOk) {
    results.e2eSkillsTree = await runTest('E2E Skills Tree and Resume Tests', 'node', ['tests/e2e-puppeteer/skills-tree-and-resume.test.js'], 120000);
  } else {
    log('\n⏭️  Skipping E2E Skills Tree Tests (servers not running)', 'yellow');
    results.e2eSkillsTree = { success: false, skipped: true };
  }

  // 6. E2E Resume Comparison Drag-and-Drop tests (if servers running)
  if (backendOk && frontendOk) {
    results.e2eResumeComparison = await runTest('E2E Resume Comparison Drag-and-Drop Tests', 'node', ['tests/e2e-puppeteer/resume-comparison-drag-drop.test.js'], 120000);
  } else {
    log('\n⏭️  Skipping E2E Resume Comparison Tests (servers not running)', 'yellow');
    results.e2eResumeComparison = { success: false, skipped: true };
  }

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');

  const allPassed = results.unit.success && 
    (results.e2eSignup.skipped || results.e2eSignup.success) &&
    (results.e2eMultiUser.skipped || results.e2eMultiUser.success) &&
    (results.e2eResumeNav.skipped || results.e2eResumeNav.success) &&
    (results.e2eSkillsTree.skipped || results.e2eSkillsTree.success) &&
    (results.e2eResumeComparison.skipped || results.e2eResumeComparison.success);

  log(`\nUnit Tests: ${results.unit.success ? '✅ PASSED' : '❌ FAILED'}`, results.unit.success ? 'green' : 'red');
  
  if (results.e2eSignup.skipped) {
    log(`E2E Signup: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Signup: ${results.e2eSignup.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eSignup.success ? 'green' : 'red');
  }
  
  if (results.e2eMultiUser.skipped) {
    log(`E2E Multi-User: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Multi-User: ${results.e2eMultiUser.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eMultiUser.success ? 'green' : 'red');
  }
  
  if (results.e2eResumeNav.skipped) {
    log(`E2E Resume Nav: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Resume Nav: ${results.e2eResumeNav.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eResumeNav.success ? 'green' : 'red');
  }
  
  if (results.e2eSkillsTree.skipped) {
    log(`E2E Skills Tree: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Skills Tree: ${results.e2eSkillsTree.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eSkillsTree.success ? 'green' : 'red');
  }
  
  if (results.e2eResumeComparison.skipped) {
    log(`E2E Resume Comparison: ⏭️  SKIPPED (servers not running)`, 'yellow');
  } else {
    log(`E2E Resume Comparison: ${results.e2eResumeComparison.success ? '✅ PASSED' : '❌ FAILED'}`, results.e2eResumeComparison.success ? 'green' : 'red');
  }

  log('\n' + '='.repeat(70), 'cyan');
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED!', 'green');
    process.exit(0);
  } else {
    log('⚠️  SOME TESTS FAILED', 'red');
    process.exit(1);
  }
})();

