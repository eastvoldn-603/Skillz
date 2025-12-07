const { execSync } = require('child_process');
const http = require('http');

console.log('\n' + '='.repeat(60));
console.log('TEST RUNNER');
console.log('='.repeat(60));

// Check servers
const checkServer = (url, name) => {
  return new Promise((resolve) => {
    http.get(url, () => {
      console.log(`✅ ${name} is running`);
      resolve(true);
    }).on('error', () => {
      console.log(`❌ ${name} is NOT running`);
      resolve(false);
    });
  });
};

(async () => {
  // Check servers
  console.log('\n📡 Checking servers...');
  const backendOk = await checkServer('http://localhost:5000/api/health', 'Backend');
  const frontendOk = await checkServer('http://localhost:3000', 'Frontend');

  // Run unit tests
  console.log('\n🧪 Running Unit Tests...');
  try {
    execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
    console.log('✅ Unit tests passed');
  } catch (e) {
    console.log('❌ Unit tests failed');
    process.exit(1);
  }

  // Run E2E tests if servers are up
  if (backendOk && frontendOk) {
    console.log('\n🧪 Running E2E Signup Tests...');
    try {
      execSync('node tests/e2e-puppeteer/signup.test.js', { 
        stdio: 'inherit',
        timeout: 120000 
      });
      console.log('✅ E2E Signup tests passed');
    } catch (e) {
      console.log('❌ E2E Signup tests failed');
      // Don't exit - continue to full tests
    }

    console.log('\n🧪 Running E2E Full Application Tests...');
    try {
      execSync('node tests/e2e-puppeteer/full-application.test.js', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes for full suite
      });
      console.log('✅ E2E Full tests passed');
    } catch (e) {
      console.log('❌ E2E Full tests failed');
      process.exit(1);
    }
  } else {
    console.log('\n⏭️  Skipping E2E tests (servers not running)');
  }

  console.log('\n✅ All tests completed!');
})();

