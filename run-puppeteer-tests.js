const { spawn } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000/api';

// Wait for server to be ready
const waitForServer = (url, timeout = 120000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Server not available: ${url}`));
        } else {
          setTimeout(check, 2000);
        }
      });
    };
    check();
  });
};

// Start servers
const startServers = () => {
  return new Promise((resolve) => {
    console.log('🚀 Starting servers...');
    
    const backend = spawn('npm', ['run', 'server'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'pipe'
    });

    const frontend = spawn('npm', ['start'], {
      cwd: require('path').join(process.cwd(), 'client'),
      shell: true,
      stdio: 'pipe'
    });

    let backendReady = false;
    let frontendReady = false;

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on port 5000')) {
        backendReady = true;
        console.log('✅ Backend server ready');
        checkReady();
      }
    });

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Compiled successfully') || output.includes('webpack compiled')) {
        frontendReady = true;
        console.log('✅ Frontend server ready');
        checkReady();
      }
    });

    const checkReady = () => {
      if (backendReady && frontendReady) {
        setTimeout(() => resolve({ backend, frontend }), 5000);
      }
    };

    // Timeout after 2 minutes
    setTimeout(() => {
      if (!backendReady || !frontendReady) {
        console.log('⏳ Servers taking longer than expected, proceeding anyway...');
        resolve({ backend, frontend });
      }
    }, 120000);
  });
};

// Run tests
const runTests = async () => {
  try {
    // Wait for servers
    console.log('⏳ Waiting for servers to be ready...');
    try {
      await Promise.all([
        waitForServer(`${API_URL.replace('/api', '')}/api/health`),
        waitForServer(BASE_URL)
      ]);
      console.log('✅ Servers are ready!');
    } catch (error) {
      console.log('⚠️  Servers may not be ready, starting them...');
      const servers = await startServers();
      
      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Run the test file
    console.log('\n🧪 Running Puppeteer tests...');
    console.log('='.repeat(60));
    
    require('./tests/e2e-puppeteer/signup.test.js');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
};

runTests();

