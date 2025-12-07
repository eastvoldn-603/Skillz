module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Exclude Puppeteer E2E tests and client/node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/',
    '/tests/e2e-puppeteer/'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/index.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};

