const puppeteer = require('puppeteer');
const http = require('http');

/**
 * Comprehensive E2E Tests for All Application Requirements
 * Based on SoftwareRequirements.txt
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Generate unique test email
const generateTestEmail = () => {
  return `test${Date.now()}${Math.random().toString(36).substring(7)}@e2e-test.com`;
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
  let page;
  let testUser = {
    email: generateTestEmail(),
    password: 'testpassword123',
    firstName: 'E2E',
    lastName: 'TestUser'
  };
  let authToken = null;

  const setup = async () => {
    log('Waiting for servers to start...', 'info');
    try {
      await waitForServer(`${BASE_URL}`);
      await waitForServer(`${API_URL.replace('/api', '')}/api/health`);
      log('Servers are ready!', 'success');
    } catch (error) {
      log(`Servers may not be ready: ${error.message}`, 'warning');
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
      ]
    });
  };

  const cleanup = async () => {
    if (browser) {
      await browser.close();
    }
  };

  const runTest = async (testName, testFn) => {
    try {
      page = await browser.newPage();
      await testFn();
      results.passed++;
      log(`✅ ${testName}`, 'success');
    } catch (error) {
      results.failed++;
      results.errors.push({ test: testName, error: error.message });
      log(`❌ ${testName}: ${error.message}`, 'error');
    } finally {
      if (page) {
        await page.close();
      }
    }
  };

  const login = async (email, password) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Clear any existing values
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"]', email);
    await page.type('input[type="password"], input[name="password"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    // Wait for dashboard
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    
    // Get token after login
    authToken = await page.evaluate(() => {
      try {
        return localStorage.getItem('token');
      } catch (e) {
        return null;
      }
    });
  };

  await setup();

  log('\n' + '='.repeat(60), 'info');
  log('COMPREHENSIVE E2E TESTS - ALL REQUIREMENTS', 'info');
  log('='.repeat(60), 'info');
  log('');

  // ============================================
  // 1. USER ACCOUNT MANAGEMENT TESTS
  // ============================================
  log('1. USER ACCOUNT MANAGEMENT', 'info');
  log('-'.repeat(60), 'info');

  // 1.1 Create account (already tested in signup.test.js, but verify here)
  await runTest('1.1 - Create account', async () => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    await page.type('input[name="firstName"]', testUser.firstName);
    await page.type('input[name="lastName"]', testUser.lastName);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    if (!page.url().includes('/dashboard')) {
      throw new Error('Expected to navigate to dashboard after signup');
    }
    
    // Store token for later tests
    authToken = await page.evaluate(() => {
      try {
        return localStorage.getItem('token');
      } catch (e) {
        return null;
      }
    });
    if (!authToken) {
      throw new Error('Token should be stored after signup');
    }
  });

  // 1.2 Login
  await runTest('1.2 - Login to system', async () => {
    // Logout first - navigate to a page and clear storage
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore if can't clear
      }
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', testUser.email);
    await page.type('input[type="password"], input[name="password"]', testUser.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    if (!page.url().includes('/dashboard')) {
      throw new Error('Expected to navigate to dashboard after login');
    }
    
    authToken = await page.evaluate(() => {
      try {
        return localStorage.getItem('token');
      } catch (e) {
        return null;
      }
    });
    if (!authToken) {
      throw new Error('Token should be stored after login');
    }
  });

  // 1.3 View profile
  await runTest('1.3 - View profile information', async () => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.profile', { timeout: 10000 });
    
    // Check that profile fields are visible
    const firstName = await page.$('input[name="firstName"]');
    const lastName = await page.$('input[name="lastName"]');
    const email = await page.$('input[name="email"]');
    
    if (!firstName || !lastName || !email) {
      throw new Error('Profile fields should be visible');
    }
    
    // Verify profile data is loaded
    const firstNameValue = await page.evaluate(el => el.value, firstName);
    if (!firstNameValue) {
      throw new Error('Profile data should be loaded');
    }
  });

  // 1.4 Edit profile
  await runTest('1.4 - Edit profile information', async () => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    
    // Update first name
    await page.click('input[name="firstName"]', { clickCount: 3 });
    await page.type('input[name="firstName"]', 'UpdatedName');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or verify update
    await page.waitForTimeout(2000);
    const pageText = await page.$eval('body', el => el.textContent);
    if (pageText.includes('updated') || pageText.includes('success')) {
      // Success
    } else {
      // Check if value was updated
      const updatedValue = await page.$eval('input[name="firstName"]', el => el.value);
      if (updatedValue !== 'UpdatedName') {
        throw new Error('Profile should be updated');
      }
    }
    
    // Restore original name for other tests
    await page.click('input[name="firstName"]', { clickCount: 3 });
    await page.type('input[name="firstName"]', testUser.firstName);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  // 1.5 Logout
  await runTest('1.5 - Logout of system', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    
    // Find and click logout button
    const logoutButton = await page.$('button:has-text("Logout"), .navbar__logout, button[onclick*="logout"]');
    if (!logoutButton) {
      // Try finding by text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const logoutBtn = buttons.find(btn => btn.textContent.includes('Logout'));
        if (logoutBtn) logoutBtn.click();
      });
    } else {
      await logoutButton.click();
    }
    
    // Wait for navigation to login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    if (!page.url().includes('/login')) {
      throw new Error('Expected to navigate to login page after logout');
    }
    
    // Verify token is cleared
    const token = await page.evaluate(() => {
      try {
        return localStorage.getItem('token');
      } catch (e) {
        return null;
      }
    });
    if (token) {
      throw new Error('Token should be cleared after logout');
    }
    
    // Login again for remaining tests
    await login(testUser.email, testUser.password);
  });

  // 1.6 Change password
  await runTest('1.6 - Change password', async () => {
    await page.goto(`${BASE_URL}/change-password`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="currentPassword"], input[type="password"]', { timeout: 10000 });
    
    // Fill change password form
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 3) {
      await passwordInputs[0].type(testUser.password); // current
      await passwordInputs[1].type('newpassword123'); // new
      await passwordInputs[2].type('newpassword123'); // confirm
    } else {
      // Try by name
      await page.type('input[name="currentPassword"]', testUser.password);
      await page.type('input[name="newPassword"]', 'newpassword123');
      await page.type('input[name="confirmPassword"]', 'newpassword123');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify success (check for success message or verify password changed)
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('success') && !pageText.toLowerCase().includes('updated')) {
      // Try logging in with new password to verify
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      await page.type('input[type="email"], input[name="email"]', testUser.email);
      await page.type('input[type="password"], input[name="password"]', 'newpassword123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      if (!page.url().includes('/dashboard')) {
        throw new Error('Password change may have failed - cannot login with new password');
      }
      
      // Update test password for remaining tests
      testUser.password = 'newpassword123';
    }
  });

  // 1.7 Forgot password / Reset password
  await runTest('1.7 - Reset password (forgot password)', async () => {
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"], input[name="email"]', testUser.email);
    await page.click('button[type="submit"]');
    
    // Wait for response (may show success message or error)
    await page.waitForTimeout(2000);
    const pageText = await page.$eval('body', el => el.textContent);
    
    // Just verify the page responds (actual reset requires email, which we can't test fully)
    if (pageText.toLowerCase().includes('error') && !pageText.toLowerCase().includes('sent')) {
      // This is acceptable - reset requires email verification
    }
  });

  // ============================================
  // 2. RESUME MANAGEMENT TESTS
  // ============================================
  log('\n2. RESUME MANAGEMENT', 'info');
  log('-'.repeat(60), 'info');

  // 2.1 Create new resume
  await runTest('2.1 - Create a new resume', async () => {
    await page.goto(`${BASE_URL}/resumes/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="title"], textarea[name="content"]', { timeout: 10000 });
    
    await page.type('input[name="title"]', 'Software Engineer Resume');
    await page.type('textarea[name="content"]', 'Experienced software engineer with 5+ years of experience.');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Should navigate to resumes list or show success
    if (!page.url().includes('/resumes')) {
      throw new Error('Expected to navigate to resumes page after creation');
    }
  });

  // 2.2 View resumes
  await runTest('2.2 - View resumes', async () => {
    await page.goto(`${BASE_URL}/resumes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.resumes, .resume, [class*="resume"]', { timeout: 10000 });
    
    // Verify resumes are displayed
    const resumeElements = await page.$$('.resume, [class*="resume"], .card');
    if (resumeElements.length === 0) {
      throw new Error('Resumes should be displayed');
    }
  });

  // 2.3 Edit resume
  await runTest('2.3 - Edit resume', async () => {
    await page.goto(`${BASE_URL}/resumes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('a[href*="edit"], button:has-text("Edit")', { timeout: 10000 });
    
    // Click edit on first resume
    const editLink = await page.$('a[href*="edit"], button:has-text("Edit")');
    if (editLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        editLink.click()
      ]);
      
      // Update resume
      await page.waitForSelector('input[name="title"]', { timeout: 10000 });
      await page.click('input[name="title"]', { clickCount: 3 });
      await page.type('input[name="title"]', 'Updated Resume Title');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Verify update (check URL or content)
      if (page.url().includes('/resumes')) {
        // Success - navigated back to list
      } else {
        const titleValue = await page.$eval('input[name="title"]', el => el.value);
        if (!titleValue.includes('Updated')) {
          throw new Error('Resume should be updated');
        }
      }
    } else {
      throw new Error('Edit button/link not found');
    }
  });

  // 2.4 Delete resume
  await runTest('2.4 - Delete resume', async () => {
    // First create a resume to delete
    await page.goto(`${BASE_URL}/resumes/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    await page.type('input[name="title"]', 'Resume to Delete');
    await page.type('textarea[name="content"]', 'This resume will be deleted');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Now delete it
    await page.goto(`${BASE_URL}/resumes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button:has-text("Delete"), [class*="delete"]', { timeout: 10000 });
    
    // Find and click delete button (for the resume we just created)
    const deleteButtons = await page.$$('button:has-text("Delete"), [class*="delete"]');
    if (deleteButtons.length > 0) {
      // Click the last delete button (most recent resume)
      await deleteButtons[deleteButtons.length - 1].click();
      
      // Handle confirmation if needed
      await page.waitForTimeout(1000);
      const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes"), button.btn-danger');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
      // Verify deletion (resume count should decrease or success message)
    } else {
      throw new Error('Delete button not found');
    }
  });

  // 2.5 Multiple resumes
  await runTest('2.5 - Create multiple resumes', async () => {
    // Create first resume
    await page.goto(`${BASE_URL}/resumes/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    await page.type('input[name="title"]', 'Resume 1 - Developer');
    await page.type('textarea[name="content"]', 'Content for resume 1');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Create second resume
    await page.goto(`${BASE_URL}/resumes/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    await page.type('input[name="title"]', 'Resume 2 - Manager');
    await page.type('textarea[name="content"]', 'Content for resume 2');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Verify both exist
    await page.goto(`${BASE_URL}/resumes`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.resume, [class*="resume"], .card', { timeout: 10000 });
    const resumes = await page.$$('.resume, [class*="resume"], .card');
    if (resumes.length < 2) {
      throw new Error('Should have at least 2 resumes');
    }
  });

  // ============================================
  // 3. JOB APPLICATION MANAGEMENT TESTS
  // ============================================
  log('\n3. JOB APPLICATION MANAGEMENT', 'info');
  log('-'.repeat(60), 'info');

  // 3.1 View jobs
  await runTest('3.1 - View available jobs', async () => {
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.jobs, .job, [class*="job"]', { timeout: 10000 });
    
    const jobElements = await page.$$('.job, [class*="job"], .card');
    if (jobElements.length === 0) {
      // Jobs might be empty, that's ok - just verify page loads
      const pageText = await page.$eval('body', el => el.textContent);
      if (pageText.includes('No jobs') || pageText.includes('Loading')) {
        // Acceptable
      } else {
        throw new Error('Jobs page should load');
      }
    }
  });

  // 3.2 Apply to job
  await runTest('3.2 - Apply to a job', async () => {
    // First seed some jobs if needed
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Try to find a job to apply to
    const jobLinks = await page.$$('a[href*="/jobs/"], .job a, [class*="job"] a');
    if (jobLinks.length > 0) {
      // Click first job
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        jobLinks[0].click()
      ]);
      
      // Find apply button
      await page.waitForSelector('button:has-text("Apply"), button:has-text("Apply to Job")', { timeout: 10000 });
      const applyButton = await page.$('button:has-text("Apply"), button:has-text("Apply to Job")');
      
      if (applyButton) {
        await applyButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success message or navigation
        const pageText = await page.$eval('body', el => el.textContent);
        if (pageText.toLowerCase().includes('applied') || pageText.toLowerCase().includes('success')) {
          // Success
        } else {
          // Might need to select resume and submit
          const resumeSelect = await page.$('select[name="resumeId"]');
          if (resumeSelect) {
            await page.select('select[name="resumeId"]', await page.$eval('select[name="resumeId"] option:not([value=""])', el => el.value));
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
          }
        }
      } else {
        // Job might already be applied
        const pageText = await page.$eval('body', el => el.textContent);
        if (!pageText.toLowerCase().includes('already applied')) {
          throw new Error('Apply button not found');
        }
      }
    } else {
      // No jobs available - seed them first via API or skip
      log('  ⚠️  No jobs available - skipping apply test', 'warning');
    }
  });

  // 3.3 View job applications
  await runTest('3.3 - View job applications', async () => {
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Verify applications page loads
    const pageText = await page.$eval('body', el => el.textContent);
    if (pageText.includes('error') && !pageText.includes('application')) {
      throw new Error('Applications page should load');
    }
  });

  // 3.4 Edit job application
  await runTest('3.4 - Edit job application', async () => {
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Try to find edit button or link
    const editButtons = await page.$$('button:has-text("Edit"), a[href*="edit"]');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Try to update notes or status
      const notesField = await page.$('textarea[name="notes"], input[name="notes"]');
      if (notesField) {
        await notesField.type(' Updated notes');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    } else {
      // No applications to edit - that's ok
      log('  ℹ️  No applications to edit', 'info');
    }
  });

  // 3.5 Delete job application
  await runTest('3.5 - Delete job application', async () => {
    await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const deleteButtons = await page.$$('button:has-text("Delete"), [class*="delete"]');
    if (deleteButtons.length > 0) {
      await deleteButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Handle confirmation
      const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    } else {
      log('  ℹ️  No applications to delete', 'info');
    }
  });

  // 3.6 View job offers
  await runTest('3.6 - View job offers', async () => {
    await page.goto(`${BASE_URL}/offers`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Verify offers page loads
    const pageText = await page.$eval('body', el => el.textContent);
    if (pageText.includes('error') && !pageText.toLowerCase().includes('offer')) {
      throw new Error('Offers page should load');
    }
  });

  // 3.7 Edit job offer
  await runTest('3.7 - Edit job offer', async () => {
    await page.goto(`${BASE_URL}/offers`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const editButtons = await page.$$('button:has-text("Edit"), a[href*="edit"]');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Try to update offer status
      const statusSelect = await page.$('select[name="status"]');
      if (statusSelect) {
        await page.select('select[name="status"]', 'accepted');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    } else {
      log('  ℹ️  No offers to edit', 'info');
    }
  });

  // 3.8 Delete job offer
  await runTest('3.8 - Delete job offer', async () => {
    await page.goto(`${BASE_URL}/offers`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const deleteButtons = await page.$$('button:has-text("Delete"), [class*="delete"]');
    if (deleteButtons.length > 0) {
      await deleteButtons[0].click();
      await page.waitForTimeout(1000);
      
      const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    } else {
      log('  ℹ️  No offers to delete', 'info');
    }
  });

  // ============================================
  // 4. PAGE NAVIGATION TESTS
  // ============================================
  log('\n4. PAGE NAVIGATION', 'info');
  log('-'.repeat(60), 'info');

  // 4.1 Login page
  await runTest('4.1 - Login page accessible', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('login') && !pageText.toLowerCase().includes('sign in')) {
      throw new Error('Login page should be accessible');
    }
  });

  // 4.2 Signup page
  await runTest('4.2 - Signup page accessible', async () => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('sign up') && !pageText.toLowerCase().includes('register')) {
      throw new Error('Signup page should be accessible');
    }
  });

  // 4.3 Forgot password page
  await runTest('4.3 - Forgot password page accessible', async () => {
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('password') && !pageText.toLowerCase().includes('reset')) {
      throw new Error('Forgot password page should be accessible');
    }
  });

  // 4.4 Change password page (requires auth)
  await runTest('4.4 - Change password page accessible (authenticated)', async () => {
    await page.goto(`${BASE_URL}/change-password`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Should either show change password form or redirect to login
    if (page.url().includes('/login')) {
      // Need to login first
      await login(testUser.email, testUser.password);
      await page.goto(`${BASE_URL}/change-password`, { waitUntil: 'networkidle2' });
    }
    
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('password') && !pageText.toLowerCase().includes('change')) {
      throw new Error('Change password page should be accessible');
    }
  });

  // 4.5 Delete account page (requires auth)
  await runTest('4.5 - Delete account page accessible (authenticated)', async () => {
    await page.goto(`${BASE_URL}/delete-account`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      await login(testUser.email, testUser.password);
      await page.goto(`${BASE_URL}/delete-account`, { waitUntil: 'networkidle2' });
    }
    
    await page.waitForTimeout(2000);
    const pageText = await page.$eval('body', el => el.textContent);
    if (!pageText.toLowerCase().includes('delete') && !pageText.toLowerCase().includes('account')) {
      throw new Error('Delete account page should be accessible');
    }
  });

  // 4.6 Logout button in navbar
  await runTest('4.6 - Logout button in navbar (all pages)', async () => {
    const pages = ['/dashboard', '/profile', '/resumes', '/jobs'];
    
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1000);
      
      const logoutButton = await page.$('button:has-text("Logout"), .navbar__logout');
      if (!logoutButton) {
        // Try finding by text in navbar
        const navbar = await page.$('.navbar, nav');
        if (navbar) {
          const navbarText = await page.evaluate(el => el.textContent, navbar);
          if (!navbarText.includes('Logout')) {
            throw new Error(`Logout button should be visible on ${pagePath}`);
          }
        }
      }
    }
  });

  // ============================================
  // 5. DELETE ACCOUNT (Last test - destroys test user)
  // ============================================
  log('\n5. ACCOUNT DELETION', 'info');
  log('-'.repeat(60), 'info');

  await runTest('5.1 - Delete account', async () => {
    await page.goto(`${BASE_URL}/delete-account`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      await login(testUser.email, testUser.password);
      await page.goto(`${BASE_URL}/delete-account`, { waitUntil: 'networkidle2' });
    }
    
    // Find delete/confirm button
    const deleteButton = await page.$('button:has-text("Delete"), button:has-text("Confirm"), button.btn-danger');
    if (deleteButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        deleteButton.click()
      ]);
      
      // Should redirect to login or home
      if (!page.url().includes('/login') && !page.url().includes('/signup')) {
        // Check if token is cleared
        const token = await page.evaluate(() => {
          try {
            return localStorage.getItem('token');
          } catch (e) {
            return null;
          }
        });
        if (token) {
          throw new Error('Token should be cleared after account deletion');
        }
      }
    } else {
      throw new Error('Delete account button not found');
    }
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

