const puppeteer = require('puppeteer');
const http = require('http');
const https = require('https');

/**
 * E2E Tests for Resume and Job Navigation from Applications Page
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Generate unique test email
const generateTestEmail = (prefix = 'test') => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(7)}@resume-nav-test.com`;
};

// Wait for server to be ready
const waitForServer = (url, timeout = 60000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve();
        } else {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Server timeout'));
          } else {
            setTimeout(check, 1000);
          }
        }
      }).on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Server not available'));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
};

// Helper to make HTTP requests
const makeRequest = (method, url, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Helper to create user via API
const createUser = async (userData) => {
  try {
    const response = await makeRequest('POST', `${API_URL}/auth/register`, userData);
    return response.token;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

// Helper to create resume via API
const createResume = async (token, resumeData) => {
  try {
    const response = await makeRequest('POST', `${API_URL}/resumes`, resumeData, token);
    return response;
  } catch (error) {
    throw new Error(`Failed to create resume: ${error.message}`);
  }
};

// Helper to get jobs via API
const getJobs = async () => {
  try {
    const response = await makeRequest('GET', `${API_URL}/jobs`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    throw new Error(`Failed to get jobs: ${error.message}`);
  }
};

// Helper to apply to job via API
const applyToJob = async (token, jobId, resumeId = null, notes = '') => {
  try {
    const payload = { notes };
    // Only include resumeId if it's not null
    if (resumeId !== null) {
      payload.resumeId = resumeId;
    }
    const response = await makeRequest('POST', `${API_URL}/jobs/${jobId}/apply`, payload, token);
    return response;
  } catch (error) {
    throw new Error(`Failed to apply to job: ${error.message}`);
  }
};

// Test runner
const runTests = async () => {
  const results = { passed: 0, failed: 0, errors: [] };

  const log = (message, type = 'info') => {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type] || ''}${message}${colors.reset}`);
  };

  let browser;

  const setup = async () => {
    log('Waiting for servers to start...', 'info');
    try {
      await waitForServer(`${BASE_URL}`);
      await waitForServer(`${API_URL.replace('/api', '')}/api/health`);
      log('Servers are ready!', 'success');
    } catch (error) {
      log(`Servers may not be ready: ${error.message}`, 'warning');
      throw error;
    }

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu'
      ],
      timeout: 30000
    });
  };

  const cleanup = async () => {
    if (browser) {
      await browser.close();
    }
  };

  const runTest = async (testName, testFn) => {
    try {
      await testFn();
      results.passed++;
      log(`✅ ${testName}`, 'success');
    } catch (error) {
      results.failed++;
      results.errors.push({ test: testName, error: error.message });
      log(`❌ ${testName}: ${error.message}`, 'error');
    }
  };

  await setup();

  log('\n' + '='.repeat(60), 'info');
  log('RESUME AND JOB NAVIGATION FROM APPLICATIONS TESTS', 'info');
  log('='.repeat(60), 'info');
  log('');

  // Test 1: Resume link appears in applications table
  await runTest('Resume link appears in applications table', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('nav'),
      password: 'password123',
      firstName: 'Nav',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Create resume
    const resume = await createResume(token, {
      title: 'Test Resume for Navigation',
      content: 'This is a test resume'
    });

    // Get a job and apply
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available');
    }
    await applyToJob(token, jobs[0].id, resume.id, 'Test application');

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.applications__table, table', { timeout: 10000 });

    // Check if resume link exists
    const resumeLink = await page.$(`a[href="/resumes/${resume.id}/edit"]`);
    if (!resumeLink) {
      throw new Error('Resume link not found in applications table');
    }

    // Verify link text
    const linkText = await page.evaluate(el => el.textContent, resumeLink);
    if (!linkText.includes('Test Resume for Navigation')) {
      throw new Error(`Expected resume title in link, got: ${linkText}`);
    }

    await page.close();
  });

  // Test 2: Clicking resume link navigates to resume edit page
  await runTest('Clicking resume link navigates to resume edit page', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('click'),
      password: 'password123',
      firstName: 'Click',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Create resume
    const resume = await createResume(token, {
      title: 'Clickable Resume',
      content: 'This resume should be clickable'
    });

    // Get a job and apply
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available');
    }
    await applyToJob(token, jobs[0].id, resume.id);

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector(`a[href="/resumes/${resume.id}/edit"]`, { timeout: 10000 });

    // Click the resume link
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click(`a[href="/resumes/${resume.id}/edit"]`)
    ]);

    // Verify we're on the resume edit page
    if (!page.url().includes(`/resumes/${resume.id}/edit`)) {
      throw new Error(`Expected to navigate to /resumes/${resume.id}/edit, got ${page.url()}`);
    }

    // Verify resume content is loaded
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    const titleValue = await page.$eval('input[name="title"]', el => el.value);
    if (titleValue !== 'Clickable Resume') {
      throw new Error(`Expected resume title "Clickable Resume", got "${titleValue}"`);
    }

    await page.close();
  });

  // Test 3: Applications without resume show N/A (not clickable)
  await runTest('Applications without resume show N/A (not clickable)', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('noresume'),
      password: 'password123',
      firstName: 'NoResume',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Get a job and apply WITHOUT a resume
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available');
    }
    await applyToJob(token, jobs[0].id, null, 'Application without resume');

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.applications__table, table', { timeout: 10000 });

    // Check that N/A is displayed (not a link)
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.includes('N/A')) {
      throw new Error('Expected "N/A" to be displayed for application without resume');
    }

    // Verify there's no link for this application
    const allLinks = await page.$$('a[href*="/resumes/"]');
    const hasResumeLink = await Promise.all(allLinks.map(async link => {
      const href = await page.evaluate(el => el.getAttribute('href'), link);
      return href && href.includes('/resumes/');
    }));
    
    // Should not have any resume links (since we applied without a resume)
    // Actually, there might be links from other applications, so we check the specific cell
    const tableCells = await page.$$('.applications__table td, table td');
    let foundNA = false;
    for (const cell of tableCells) {
      const cellText = await page.evaluate(el => el.textContent.trim(), cell);
      if (cellText === 'N/A') {
        foundNA = true;
        // Verify it's not a link
        const linkInCell = await cell.$('a');
        if (linkInCell) {
          throw new Error('N/A should not be a clickable link');
        }
        break;
      }
    }
    
    if (!foundNA) {
      throw new Error('Could not find "N/A" in applications table');
    }

    await page.close();
  });

  // Test 4: Multiple applications show multiple resume links
  await runTest('Multiple applications show multiple resume links', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('multi'),
      password: 'password123',
      firstName: 'Multi',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Create multiple resumes
    const resume1 = await createResume(token, {
      title: 'Resume One',
      content: 'First resume'
    });
    const resume2 = await createResume(token, {
      title: 'Resume Two',
      content: 'Second resume'
    });

    // Get jobs and apply with different resumes
    const jobs = await getJobs();
    if (jobs.length < 2) {
      throw new Error('Need at least 2 jobs available');
    }
    await applyToJob(token, jobs[0].id, resume1.id);
    await applyToJob(token, jobs[1].id, resume2.id);

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.applications__table, table', { timeout: 10000 });

    // Check for both resume links
    const link1 = await page.$(`a[href="/resumes/${resume1.id}/edit"]`);
    const link2 = await page.$(`a[href="/resumes/${resume2.id}/edit"]`);

    if (!link1) {
      throw new Error('Resume 1 link not found');
    }
    if (!link2) {
      throw new Error('Resume 2 link not found');
    }

    // Verify link texts
    const link1Text = await page.evaluate(el => el.textContent, link1);
    const link2Text = await page.evaluate(el => el.textContent, link2);

    if (!link1Text.includes('Resume One')) {
      throw new Error(`Expected "Resume One" in first link, got: ${link1Text}`);
    }
    if (!link2Text.includes('Resume Two')) {
      throw new Error(`Expected "Resume Two" in second link, got: ${link2Text}`);
    }

    await page.close();
  });

  // Test 5: Job title link navigates to job detail page
  await runTest('Job title link navigates to job detail page', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('joblink'),
      password: 'password123',
      firstName: 'JobLink',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Create resume
    const resume = await createResume(token, {
      title: 'Resume for Job Link Test',
      content: 'Test resume content'
    });

    // Get a job and apply
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available');
    }
    const testJob = jobs[0];
    await applyToJob(token, testJob.id, resume.id, 'Test application');

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.applications__table, table', { timeout: 10000 });

    // Find job title link
    const jobLink = await page.$(`a[href="/jobs/${testJob.id}"]`);
    if (!jobLink) {
      // Try finding by text content
      const allLinks = await page.$$('a');
      let found = false;
      for (const link of allLinks) {
        const href = await page.evaluate(el => el.getAttribute('href'), link);
        if (href && href.includes(`/jobs/${testJob.id}`)) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error(`Job link to /jobs/${testJob.id} not found in applications table`);
      }
    }

    // Click the job link
    const linkToClick = jobLink || await page.$(`a[href*="/jobs/${testJob.id}"]`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      linkToClick.click()
    ]);

    // Verify we're on the job detail page
    if (!page.url().includes(`/jobs/${testJob.id}`)) {
      throw new Error(`Expected to navigate to /jobs/${testJob.id}, got ${page.url()}`);
    }

    // Verify job details are loaded
    await page.waitForSelector('.job-detail, .job-detail__title', { timeout: 10000 });
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.includes(testJob.title)) {
      throw new Error(`Expected job title "${testJob.title}" on job detail page`);
    }

    await page.close();
  });

  // Test 6: Both job and resume links work in same application row
  await runTest('Both job and resume links work in same application row', async () => {
    const page = await browser.newPage();
    
    // Create user and login
    const userData = {
      email: generateTestEmail('bothlinks'),
      password: 'password123',
      firstName: 'BothLinks',
      lastName: 'Test'
    };
    const token = await createUser(userData);

    // Create resume
    const resume = await createResume(token, {
      title: 'Resume for Both Links Test',
      content: 'Test resume'
    });

    // Get a job and apply
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available');
    }
    const testJob = jobs[0];
    await applyToJob(token, testJob.id, resume.id);

    // Login via browser
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', userData.email);
    await page.type('input[type="password"], input[name="password"]', userData.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Navigate to applications page
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.applications__table, table', { timeout: 10000 });

    // Verify both links exist
    const jobLink = await page.$(`a[href="/jobs/${testJob.id}"]`);
    const resumeLink = await page.$(`a[href="/resumes/${resume.id}/edit"]`);

    if (!jobLink) {
      throw new Error('Job link not found');
    }
    if (!resumeLink) {
      throw new Error('Resume link not found');
    }

    // Test job link
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      jobLink.click()
    ]);

    if (!page.url().includes(`/jobs/${testJob.id}`)) {
      throw new Error('Job link did not navigate correctly');
    }

    // Go back to applications
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForSelector(`a[href="/resumes/${resume.id}/edit"]`, { timeout: 10000 });

    // Test resume link
    const resumeLink2 = await page.$(`a[href="/resumes/${resume.id}/edit"]`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      resumeLink2.click()
    ]);

    if (!page.url().includes(`/resumes/${resume.id}/edit`)) {
      throw new Error('Resume link did not navigate correctly');
    }

    await page.close();
  });

  // Cleanup
  await cleanup();

  // Print results
  log('\n' + '='.repeat(60), 'info');
  log('TEST RESULTS SUMMARY', 'info');
  log('='.repeat(60), 'info');
  log(`\n✅ Passed: ${results.passed}`, 'success');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');

  if (results.errors.length > 0) {
    log('\nErrors:', 'error');
    results.errors.forEach(err => {
      log(`  - ${err.test}: ${err.error}`, 'error');
    });
  }

  log('\n' + '='.repeat(60), 'info');

  process.exit(results.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

