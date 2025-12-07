const puppeteer = require('puppeteer');
const http = require('http');
const https = require('https');

/**
 * E2E Tests for Multiple Users Applying to Same Job with Different Resumes
 * Tests the scenario where multiple users can apply to the same job,
 * and each user can apply with multiple resumes.
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Generate unique test email
const generateTestEmail = (prefix = 'test') => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(7)}@multi-user-test.com`;
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
const applyToJob = async (token, jobId, resumeId, notes = '') => {
  try {
    const response = await makeRequest('POST', `${API_URL}/jobs/${jobId}/apply`, {
      resumeId,
      notes
    }, token);
    return response;
  } catch (error) {
    throw new Error(`Failed to apply to job: ${error.message}`);
  }
};

// Helper to get user applications via API
const getUserApplications = async (token) => {
  try {
    const response = await makeRequest('GET', `${API_URL}/jobs/applications/all`, null, token);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    throw new Error(`Failed to get applications: ${error.message}`);
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
  log('MULTI-USER JOB APPLICATION TESTS', 'info');
  log('='.repeat(60), 'info');
  log('');

  // Test 1: Multiple users can apply to the same job
  await runTest('Multiple users can apply to the same job', async () => {
    // Get available jobs
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available. Please seed jobs first.');
    }
    const testJob = jobs[0];

    // Create first user
    const user1Data = {
      email: generateTestEmail('user1'),
      password: 'password123',
      firstName: 'User',
      lastName: 'One'
    };
    const token1 = await createUser(user1Data);

    // Create second user
    const user2Data = {
      email: generateTestEmail('user2'),
      password: 'password123',
      firstName: 'User',
      lastName: 'Two'
    };
    const token2 = await createUser(user2Data);

    // Create third user
    const user3Data = {
      email: generateTestEmail('user3'),
      password: 'password123',
      firstName: 'User',
      lastName: 'Three'
    };
    const token3 = await createUser(user3Data);

    // Create resumes for each user
    const resume1 = await createResume(token1, {
      title: 'User 1 Resume - Software Engineer',
      content: 'Experienced software engineer with 5+ years'
    });

    const resume2 = await createResume(token2, {
      title: 'User 2 Resume - Full Stack Developer',
      content: 'Full stack developer with React and Node.js experience'
    });

    const resume3 = await createResume(token3, {
      title: 'User 3 Resume - Backend Developer',
      content: 'Backend developer specializing in APIs and databases'
    });

    // All three users apply to the same job
    const application1 = await applyToJob(token1, testJob.id, resume1.id, 'User 1 application');
    const application2 = await applyToJob(token2, testJob.id, resume2.id, 'User 2 application');
    const application3 = await applyToJob(token3, testJob.id, resume3.id, 'User 3 application');

    // Verify all applications were created
    if (!application1 || !application2 || !application3) {
      throw new Error('Not all applications were created successfully');
    }

    // Verify each user can see their own application
    const user1Apps = await getUserApplications(token1);
    const user2Apps = await getUserApplications(token2);
    const user3Apps = await getUserApplications(token3);

    const user1HasApp = user1Apps.some(app => app.job_id === testJob.id);
    const user2HasApp = user2Apps.some(app => app.job_id === testJob.id);
    const user3HasApp = user3Apps.some(app => app.job_id === testJob.id);

    if (!user1HasApp || !user2HasApp || !user3HasApp) {
      throw new Error('Users cannot see their own applications');
    }

    log(`  ✓ 3 users applied to job "${testJob.title}"`, 'info');
  });

  // Test 2: Single user can apply to same job with multiple resumes
  await runTest('Single user can apply to same job with multiple resumes', async () => {
    // Get available jobs
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available. Please seed jobs first.');
    }
    const testJob = jobs[0];

    // Create user
    const userData = {
      email: generateTestEmail('multiresume'),
      password: 'password123',
      firstName: 'Multi',
      lastName: 'Resume'
    };
    const token = await createUser(userData);

    // Create multiple resumes for the same user
    const resume1 = await createResume(token, {
      title: 'Resume 1 - Software Engineer Focus',
      content: 'Software engineer with focus on backend development'
    });

    const resume2 = await createResume(token, {
      title: 'Resume 2 - Full Stack Focus',
      content: 'Full stack developer with React and Node.js'
    });

    const resume3 = await createResume(token, {
      title: 'Resume 3 - DevOps Focus',
      content: 'DevOps engineer with cloud infrastructure experience'
    });

    // Apply to the same job with all three resumes
    const application1 = await applyToJob(token, testJob.id, resume1.id, 'Application with resume 1');
    const application2 = await applyToJob(token, testJob.id, resume2.id, 'Application with resume 2');
    const application3 = await applyToJob(token, testJob.id, resume3.id, 'Application with resume 3');

    // Verify all applications were created
    if (!application1 || !application2 || !application3) {
      throw new Error('Not all applications with different resumes were created');
    }

    // Verify user can see all their applications
    const userApps = await getUserApplications(token);
    const jobApplications = userApps.filter(app => app.job_id === testJob.id);

    if (jobApplications.length !== 3) {
      throw new Error(`Expected 3 applications for the same job, got ${jobApplications.length}`);
    }

    // Verify each application has a different resume
    const resumeIds = jobApplications.map(app => app.resume_id).filter(id => id !== null);
    const uniqueResumeIds = [...new Set(resumeIds)];
    if (uniqueResumeIds.length !== 3) {
      throw new Error('Not all applications have different resumes');
    }

    log(`  ✓ User applied to job "${testJob.title}" with 3 different resumes`, 'info');
  });

  // Test 3: Multiple users, each with multiple resumes, applying to same job
  await runTest('Multiple users with multiple resumes applying to same job', async () => {
    // Get available jobs
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available. Please seed jobs first.');
    }
    const testJob = jobs[0];

    // Create two users
    const user1Data = {
      email: generateTestEmail('user1multi'),
      password: 'password123',
      firstName: 'User',
      lastName: 'OneMulti'
    };
    const token1 = await createUser(user1Data);

    const user2Data = {
      email: generateTestEmail('user2multi'),
      password: 'password123',
      firstName: 'User',
      lastName: 'TwoMulti'
    };
    const token2 = await createUser(user2Data);

    // User 1 creates 2 resumes
    const user1Resume1 = await createResume(token1, {
      title: 'User 1 - Resume A',
      content: 'Resume A content'
    });
    const user1Resume2 = await createResume(token1, {
      title: 'User 1 - Resume B',
      content: 'Resume B content'
    });

    // User 2 creates 2 resumes
    const user2Resume1 = await createResume(token2, {
      title: 'User 2 - Resume A',
      content: 'Resume A content'
    });
    const user2Resume2 = await createResume(token2, {
      title: 'User 2 - Resume B',
      content: 'Resume B content'
    });

    // User 1 applies with both resumes
    await applyToJob(token1, testJob.id, user1Resume1.id, 'User 1 - Application 1');
    await applyToJob(token1, testJob.id, user1Resume2.id, 'User 1 - Application 2');

    // User 2 applies with both resumes
    await applyToJob(token2, testJob.id, user2Resume1.id, 'User 2 - Application 1');
    await applyToJob(token2, testJob.id, user2Resume2.id, 'User 2 - Application 2');

    // Verify both users can see their applications
    const user1Apps = await getUserApplications(token1);
    const user2Apps = await getUserApplications(token2);

    const user1JobApps = user1Apps.filter(app => app.job_id === testJob.id);
    const user2JobApps = user2Apps.filter(app => app.job_id === testJob.id);

    if (user1JobApps.length !== 2) {
      throw new Error(`User 1 should have 2 applications, got ${user1JobApps.length}`);
    }
    if (user2JobApps.length !== 2) {
      throw new Error(`User 2 should have 2 applications, got ${user2JobApps.length}`);
    }

    // Verify each user's applications have different resumes
    const user1ResumeIds = user1JobApps.map(app => app.resume_id).filter(id => id !== null);
    const user2ResumeIds = user2JobApps.map(app => app.resume_id).filter(id => id !== null);

    if (new Set(user1ResumeIds).size !== 2) {
      throw new Error('User 1 applications should have different resumes');
    }
    if (new Set(user2ResumeIds).size !== 2) {
      throw new Error('User 2 applications should have different resumes');
    }

    log(`  ✓ 2 users applied to job "${testJob.title}" with 2 resumes each (4 total applications)`, 'info');
  });

  // Test 4: Verify applications are independent (users cannot see each other's applications)
  await runTest('Users cannot see other users\' applications', async () => {
    // Get available jobs
    const jobs = await getJobs();
    if (jobs.length === 0) {
      throw new Error('No jobs available. Please seed jobs first.');
    }
    const testJob = jobs[0];

    // Create two users
    const user1Data = {
      email: generateTestEmail('user1private'),
      password: 'password123',
      firstName: 'Private',
      lastName: 'User1'
    };
    const token1 = await createUser(user1Data);

    const user2Data = {
      email: generateTestEmail('user2private'),
      password: 'password123',
      firstName: 'Private',
      lastName: 'User2'
    };
    const token2 = await createUser(user2Data);

    // Create resumes
    const resume1 = await createResume(token1, {
      title: 'User 1 Private Resume',
      content: 'Private content'
    });
    const resume2 = await createResume(token2, {
      title: 'User 2 Private Resume',
      content: 'Private content'
    });

    // Both users apply
    await applyToJob(token1, testJob.id, resume1.id);
    await applyToJob(token2, testJob.id, resume2.id);

    // Each user should only see their own application
    const user1Apps = await getUserApplications(token1);
    const user2Apps = await getUserApplications(token2);

    const user1JobApps = user1Apps.filter(app => app.job_id === testJob.id);
    const user2JobApps = user2Apps.filter(app => app.job_id === testJob.id);

    // Each should have exactly 1 application
    if (user1JobApps.length !== 1) {
      throw new Error(`User 1 should see 1 application, got ${user1JobApps.length}`);
    }
    if (user2JobApps.length !== 1) {
      throw new Error(`User 2 should see 1 application, got ${user2JobApps.length}`);
    }

    // Verify they cannot see each other's resume
    if (user1JobApps[0].resume_id === user2JobApps[0].resume_id) {
      throw new Error('Users should not share resume IDs');
    }

    log('  ✓ Users can only see their own applications', 'info');
  });

  // Test 5: Apply to multiple different jobs with same resume
  await runTest('User can apply to multiple jobs with the same resume', async () => {
    // Get available jobs (need at least 2)
    const jobs = await getJobs();
    if (jobs.length < 2) {
      throw new Error('Need at least 2 jobs available. Please seed more jobs.');
    }
    const testJob1 = jobs[0];
    const testJob2 = jobs[1];

    // Create user
    const userData = {
      email: generateTestEmail('multijob'),
      password: 'password123',
      firstName: 'Multi',
      lastName: 'Job'
    };
    const token = await createUser(userData);

    // Create one resume
    const resume = await createResume(token, {
      title: 'Universal Resume',
      content: 'This resume can be used for multiple job applications'
    });

    // Apply to multiple jobs with the same resume
    await applyToJob(token, testJob1.id, resume.id, 'Application to job 1');
    await applyToJob(token, testJob2.id, resume.id, 'Application to job 2');

    // Verify user can see both applications
    const userApps = await getUserApplications(token);
    const job1Apps = userApps.filter(app => app.job_id === testJob1.id);
    const job2Apps = userApps.filter(app => app.job_id === testJob2.id);

    if (job1Apps.length !== 1 || job2Apps.length !== 1) {
      throw new Error('User should have one application per job');
    }

    // Both should use the same resume
    if (job1Apps[0].resume_id !== resume.id || job2Apps[0].resume_id !== resume.id) {
      throw new Error('Both applications should use the same resume');
    }

    log(`  ✓ User applied to 2 different jobs with the same resume`, 'info');
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

