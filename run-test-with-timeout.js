const { spawn } = require('child_process');
const path = require('path');

const testFile = process.argv[2] || 'tests/e2e-puppeteer/signup.test.js';
const timeout = 120000; // 2 minutes

console.log(`Running ${testFile} with ${timeout/1000}s timeout...`);

const child = spawn('node', [testFile], {
  stdio: 'inherit',
  shell: true
});

const timeoutId = setTimeout(() => {
  console.log('\n  Test timeout - killing process');
  child.kill('SIGTERM');
  process.exit(1);
}, timeout);

child.on('exit', (code) => {
  clearTimeout(timeoutId);
  process.exit(code || 0);
});

child.on('error', (err) => {
  clearTimeout(timeoutId);
  console.error('Test error:', err);
  process.exit(1);
});
