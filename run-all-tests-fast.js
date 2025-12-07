/**
 * Fast E2E Test Runner - Optimized for speed with shorter timeouts
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
    const req = http.get(url, () => {
      log(`✅ ${name} is running`, 'green');
      resolve(true);
    });
    req.on('error', () => {
      log(`❌ ${name} is NOT running`, 'red');
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      log(`⏱️  ${name} timeout`, 'yellow');
      resolve(false);
    });
  });
};

// Run a test command with timeout
const runTest = (name, command, args = [], timeout = 60000) => {
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
  log('FAST E2E TEST RUNNER (Optimized)', 'cyan');
  log('='.repeat(70), 'cyan');

  // Check servers
  log('\n📡 Checking servers...', 'cyan');
  const backendOk = await checkServer('http://localhost:5000/api/auth/register', 'Backend');
  const frontendOk = await checkServer('http://localhost:3000', 'Frontend');

  if (!backendOk || !frontendOk) {
    log('\n⚠️  Servers not running. Please start backend and frontend first.', 'yellow');
    log('   Backend: npm run dev (in root directory)', 'white');
    log('   Frontend: npm start (in client directory)', 'white');
    process.exit(1);
  }

  const results = {
    unit: null,
    e2eSignup: null,
    e2eMultiUser: null,
    e2eResumeNav: null,
    e2eSkillsTree: null,
    e2eResumeComparison: null
  };

  // 1. Unit tests (fast)
  results.unit = await runTest('Unit Tests', 'npm', ['test', '--', '--passWithNoTests'], 30000);

  // 2. E2E Tests with shorter timeouts
  if (backendOk && frontendOk) {
    results.e2eSignup = await runTest('E2E Signup Tests', 'node', ['tests/e2e-puppeteer/signup.test.js'], 60000);
    results.e2eMultiUser = await runTest('E2E Multi-User Tests', 'node', ['tests/e2e-puppeteer/multi-user-job-application.test.js'], 60000);
    results.e2eResumeNav = await runTest('E2E Resume Navigation Tests', 'node', ['tests/e2e-puppeteer/resume-navigation.test.js'], 60000);
    results.e2eSkillsTree = await runTest('E2E Skills Tree Tests', 'node', ['tests/e2e-puppeteer/skills-tree-and-resume.test.js'], 90000);
    results.e2eResumeComparison = await runTest('E2E Resume Comparison Tests', 'node', ['tests/e2e-puppeteer/resume-comparison-drag-drop.test.js'], 90000);
  }

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');

  const allPassed = results.unit.success && 
    (results.e2eSignup?.success !== false) &&
    (results.e2eMultiUser?.success !== false) &&
    (results.e2eResumeNav?.success !== false) &&
    (results.e2eSkillsTree?.success !== false) &&
    (results.e2eResumeComparison?.success !== false);

  log(`\nUnit Tests: ${results.unit.success ? '✅ PASSED' : '❌ FAILED'}`, results.unit.success ? 'green' : 'red');
  
  if (results.e2eSignup) {
    log(`E2E Signup: ${results.e2eSignup.success ? '✅ PASSED' : results.e2eSignup.timeout ? '⏱️  TIMEOUT' : '❌ FAILED'}`, 
      results.e2eSignup.success ? 'green' : results.e2eSignup.timeout ? 'yellow' : 'red');
  }
  
  if (results.e2eMultiUser) {
    log(`E2E Multi-User: ${results.e2eMultiUser.success ? '✅ PASSED' : results.e2eMultiUser.timeout ? '⏱️  TIMEOUT' : '❌ FAILED'}`, 
      results.e2eMultiUser.success ? 'green' : results.e2eMultiUser.timeout ? 'yellow' : 'red');
  }
  
  if (results.e2eResumeNav) {
    log(`E2E Resume Nav: ${results.e2eResumeNav.success ? '✅ PASSED' : results.e2eResumeNav.timeout ? '⏱️  TIMEOUT' : '❌ FAILED'}`, 
      results.e2eResumeNav.success ? 'green' : results.e2eResumeNav.timeout ? 'yellow' : 'red');
  }
  
  if (results.e2eSkillsTree) {
    log(`E2E Skills Tree: ${results.e2eSkillsTree.success ? '✅ PASSED' : results.e2eSkillsTree.timeout ? '⏱️  TIMEOUT' : '❌ FAILED'}`, 
      results.e2eSkillsTree.success ? 'green' : results.e2eSkillsTree.timeout ? 'yellow' : 'red');
  }
  
  if (results.e2eResumeComparison) {
    log(`E2E Resume Comparison: ${results.e2eResumeComparison.success ? '✅ PASSED' : results.e2eResumeComparison.timeout ? '⏱️  TIMEOUT' : '❌ FAILED'}`, 
      results.e2eResumeComparison.success ? 'green' : results.e2eResumeComparison.timeout ? 'yellow' : 'red');
  }

  log('\n' + '='.repeat(70), 'cyan');
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED!', 'green');
    process.exit(0);
  } else {
    log('⚠️  SOME TESTS FAILED OR TIMED OUT', 'red');
    log('\n💡 Tips:', 'cyan');
    log('  • If tests timeout, try running them individually', 'white');
    log('  • Ensure backend and frontend are running', 'white');
    log('  • Check browser console for errors', 'white');
    process.exit(1);
  }
})();

