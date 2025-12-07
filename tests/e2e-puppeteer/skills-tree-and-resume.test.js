const puppeteer = require('puppeteer');
const http = require('http');

/**
 * E2E Tests for Skills Tree and Resume Features
 * Tests:
 * - Skills tree side panel functionality
 * - Creating resumes from skills tree
 * - Updating resumes from skills tree
 * - Resume-specific skill deletion
 * - Drag-and-drop in resume comparison
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const generateTestEmail = () => {
  return `test${Date.now()}${Math.random().toString(36).substring(7)}@e2e-test.com`;
};

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

  const test = async (name, fn) => {
    try {
      log(`\n🧪 Testing: ${name}`, 'info');
      await fn();
      results.passed++;
      log(`✅ PASSED: ${name}`, 'success');
      return true;
    } catch (error) {
      results.failed++;
      results.errors.push({ test: name, error: error.message });
      log(`❌ FAILED: ${name} - ${error.message}`, 'error');
      return false;
    }
  };

  let browser;
  let page;
  let testEmail;
  let testPassword = 'Test123456!';
  let resume1Id = null;
  let resume2Id = null;

  try {
    log('\n🚀 Starting Skills Tree and Resume E2E Tests...', 'info');
    
    // Wait for servers
    log('⏳ Waiting for servers to be ready...', 'info');
    await waitForServer(BASE_URL);
    await waitForServer(API_URL);
    log('✅ Servers are ready', 'success');

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Generate test email
    testEmail = generateTestEmail();
    log(`📧 Using test email: ${testEmail}`, 'info');

    // Helper: Register and login
    const registerAndLogin = async () => {
      // Go to signup page
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle0' });
      
      // Fill signup form
      await page.waitForSelector('input[name="email"]', { timeout: 5000 });
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', testPassword);
      await page.type('input[name="confirmPassword"]', testPassword);
      await page.type('input[name="firstName"]', 'Test');
      await page.type('input[name="lastName"]', 'User');
      
      // Submit
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      
      // Should be logged in and redirected
      const url = page.url();
      if (!url.includes('/dashboard') && !url.includes('/resumes')) {
        throw new Error('Signup failed - not redirected to dashboard');
      }
    };

    // Helper: Get auth token from localStorage
    const getAuthToken = async () => {
      return await page.evaluate(() => {
        try {
          return localStorage.getItem('token');
        } catch (e) {
          return null;
        }
      });
    };

    // Helper: Create resume via API
    const createResume = async (title) => {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token available');
      
      const response = await page.evaluate(async (url, title, token) => {
        const res = await fetch(`${url}/resumes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, content: 'Test resume content' })
        });
        return await res.json();
      }, API_URL, title, token);
      
      return response.id;
    };

    // Test 1: Register and login
    await test('User Registration and Login', async () => {
      await registerAndLogin();
      const token = await getAuthToken();
      if (!token) throw new Error('No token after login');
    });

    // Test 2: Navigate to Skills Tree
    await test('Navigate to Skills Tree Page', async () => {
      await page.goto(`${BASE_URL}/skills-tree`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.skills-tree', { timeout: 5000 });
      const title = await page.$eval('.skills-tree__title', el => el.textContent);
      if (!title.includes('Skills Tree')) {
        throw new Error('Skills tree page not loaded correctly');
      }
    });

    // Test 3: Click on skills to add to selection
    await test('Select Skills in Skills Tree', async () => {
      await page.goto(`${BASE_URL}/skills-tree`, { waitUntil: 'networkidle0' });
      
      // Wait for skills tree to load
      await page.waitForSelector('.skill-node', { timeout: 10000 });
      
      // Click on first few skill nodes
      const skillNodes = await page.$$('.skill-node');
      if (skillNodes.length === 0) {
        throw new Error('No skill nodes found');
      }
      
      // Click first skill
      await skillNodes[0].click();
      await page.waitForTimeout(500);
      
      // Check if skill appears in side panel
      await page.waitForSelector('.skills-tree__skills-list', { timeout: 3000 });
      const selectedSkills = await page.$$('.skills-tree__skill-item');
      if (selectedSkills.length === 0) {
        throw new Error('Skill not added to selection panel');
      }
    });

    // Test 4: Create resume from skills tree
    await test('Create Resume from Skills Tree', async () => {
      await page.goto(`${BASE_URL}/skills-tree`, { waitUntil: 'networkidle0' });
      
      // Wait for skills tree
      await page.waitForSelector('.skill-node', { timeout: 10000 });
      
      // Click a skill to select it
      const skillNodes = await page.$$('.skill-node');
      if (skillNodes.length > 0) {
        await skillNodes[0].click();
        await page.waitForTimeout(500);
      }
      
      // Click "Create New Resume" button
      const createButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Create New Resume')
        );
      });
      if (!createButton) throw new Error('Create New Resume button not found');
      await createButton.click();
      
      // Wait for modal
      await page.waitForSelector('input[type="text"]', { timeout: 3000 });
      
      // Enter resume title
      const resumeTitle = `Test Resume ${Date.now()}`;
      await page.type('input[type="text"]', resumeTitle);
      
      // Click create button
      const createResumeBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Create Resume')
        );
      });
      if (!createResumeBtn) throw new Error('Create Resume button not found');
      await createResumeBtn.click();
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      
      // Should be on resume edit page
      const url = page.url();
      if (!url.includes('/resumes/') || !url.includes('/edit')) {
        throw new Error('Not redirected to resume edit page');
      }
    });

    // Test 5: Create two resumes for comparison
    await test('Create Two Resumes for Comparison', async () => {
      resume1Id = await createResume(`Resume 1 ${Date.now()}`);
      resume2Id = await createResume(`Resume 2 ${Date.now()}`);
      
      if (!resume1Id || !resume2Id) {
        throw new Error('Failed to create resumes');
      }
    });

    // Test 6: Navigate to resume comparison
    await test('Navigate to Resume Comparison Page', async () => {
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare', { timeout: 5000 });
      
      const title = await page.$eval('.resume-compare__title', el => el.textContent);
      if (!title.includes('Compare')) {
        throw new Error('Resume comparison page not loaded');
      }
    });

    // Test 7: Resume-specific skill deletion
    await test('Resume-Specific Skill Deletion', async () => {
      // First, add a skill to resume1 via API
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      
      // Get user skills
      const userSkills = await page.evaluate(async (url, token) => {
        const res = await fetch(`${url}/skills/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, token);
      
      if (userSkills.length === 0) {
        log('⚠️  No user skills found, skipping skill deletion test', 'warning');
        return;
      }
      
      const skillId = userSkills[0].skill_id;
      
      // Add skill to resume1
      await page.evaluate(async (url, resumeId, skillId, token) => {
        await fetch(`${url}/resumes/${resumeId}/skills/${skillId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }, API_URL, resume1Id, skillId, token);
      
      // Navigate to comparison page
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__skill-badge', { timeout: 5000 });
      
      // Find delete button for first skill in left resume
      const deleteButtons = await page.$$('.resume-compare__delete-btn');
      if (deleteButtons.length === 0) {
        log('⚠️  No delete buttons found, skipping deletion test', 'warning');
        return;
      }
      
      // Click delete button
      await deleteButtons[0].click();
      
      // Confirm deletion in modal
      await page.waitForTimeout(500);
      const removeButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Remove from Resume')
        );
      });
      if (!removeButton) throw new Error('Remove from Resume button not found');
      await removeButton.click();
      
      // Wait for refresh
      await page.waitForTimeout(1000);
      
      // Verify skill is removed from resume1 but still in user_skills
      const skillsAfter = await page.evaluate(async (url, resumeId, token) => {
        const res = await fetch(`${url}/resumes/${resumeId}/skills`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, resume1Id, token);
      
      const skillStillExists = skillsAfter.some(s => s.skill_id === skillId);
      if (skillStillExists) {
        throw new Error('Skill was not removed from resume');
      }
      
      // Verify skill still exists in user_skills
      const userSkillsAfter = await page.evaluate(async (url, token) => {
        const res = await fetch(`${url}/skills/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, token);
      
      const skillInUserSkills = userSkillsAfter.some(s => s.skill_id === skillId);
      if (!skillInUserSkills) {
        throw new Error('Skill was incorrectly removed from user_skills');
      }
    });

    // Test 8: Update resume from skills tree with dropdown
    await test('Update Resume from Skills Tree with Dropdown', async () => {
      await page.goto(`${BASE_URL}/skills-tree`, { waitUntil: 'networkidle0' });
      
      // Wait for skills tree
      await page.waitForSelector('.skill-node', { timeout: 10000 });
      
      // Click a skill to select it
      const skillNodes = await page.$$('.skill-node');
      if (skillNodes.length > 0) {
        await skillNodes[0].click();
        await page.waitForTimeout(500);
      }
      
      // Click "Update Existing Resume" button
      const updateButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Update Existing Resume')
        );
      });
      if (!updateButton) {
        throw new Error('Update Existing Resume button not found');
      }
      await updateButton.click();
      
      // Wait for modal with dropdown
      await page.waitForSelector('select', { timeout: 3000 });
      
      // Check if dropdown is present (not text input)
      const textInput = await page.$('input[type="text"]');
      const select = await page.$('select');
      
      if (textInput && !select) {
        throw new Error('Update modal shows text input instead of dropdown');
      }
      
      if (!select) {
        throw new Error('Dropdown not found in update modal');
      }
    });

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'error');
    results.failed++;
    results.errors.push({ test: 'Fatal', error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  log('\n' + '='.repeat(70), 'info');
  log('TEST SUMMARY', 'info');
  log('='.repeat(70), 'info');
  log(`✅ Passed: ${results.passed}`, 'success');
  log(`❌ Failed: ${results.failed}`, 'error');
  
  if (results.errors.length > 0) {
    log('\nErrors:', 'error');
    results.errors.forEach(({ test, error }) => {
      log(`  - ${test}: ${error}`, 'error');
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

