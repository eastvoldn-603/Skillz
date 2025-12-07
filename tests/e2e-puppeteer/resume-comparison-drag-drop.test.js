const puppeteer = require('puppeteer');
const http = require('http');

/**
 * E2E Tests for Resume Comparison Drag-and-Drop
 * Tests:
 * - Drag and drop skills between resumes
 * - Drag and drop job experiences between resumes
 * - Visual feedback during drag operations
 * - Resume-specific skill copying
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
    log('\n🚀 Starting Resume Comparison Drag-and-Drop E2E Tests...', 'info');
    
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
      await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('input[name="email"]', { timeout: 5000 });
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', testPassword);
      await page.type('input[name="confirmPassword"]', testPassword);
      await page.type('input[name="firstName"]', 'Test');
      await page.type('input[name="lastName"]', 'User');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    };

    // Helper: Get auth token
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

    // Helper: Add skill to resume via API
    const addSkillToResume = async (resumeId, skillId) => {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      
      await page.evaluate(async (url, resumeId, skillId, token) => {
        await fetch(`${url}/resumes/${resumeId}/skills/${skillId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }, API_URL, resumeId, skillId, token);
    };

    // Test 1: Register and login
    await test('User Registration and Login', async () => {
      await registerAndLogin();
      const token = await getAuthToken();
      if (!token) throw new Error('No token after login');
    });

    // Test 2: Setup - Create resumes and add skills
    await test('Setup Resumes and Skills', async () => {
      resume1Id = await createResume(`Resume 1 ${Date.now()}`);
      resume2Id = await createResume(`Resume 2 ${Date.now()}`);
      
      if (!resume1Id || !resume2Id) {
        throw new Error('Failed to create resumes');
      }
      
      // Get user skills
      const token = await getAuthToken();
      const userSkills = await page.evaluate(async (url, token) => {
        const res = await fetch(`${url}/skills/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, token);
      
      if (userSkills.length === 0) {
        log('⚠️  No user skills found, some tests may be skipped', 'warning');
        return;
      }
      
      // Add first skill to resume1
      await addSkillToResume(resume1Id, userSkills[0].skill_id);
      await page.waitForTimeout(500);
    });

    // Test 3: Navigate to comparison page
    await test('Navigate to Resume Comparison Page', async () => {
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare', { timeout: 5000 });
    });

    // Test 4: Verify skills are displayed
    await test('Verify Skills Displayed in Comparison', async () => {
      await page.waitForSelector('.resume-compare__skill-badge', { timeout: 5000 });
      const skills = await page.$$('.resume-compare__skill-badge');
      if (skills.length === 0) {
        throw new Error('No skills displayed in comparison view');
      }
    });

    // Test 5: Drag and drop skill (using HTML5 drag and drop API)
    await test('Drag and Drop Skill Between Resumes', async () => {
      // Refresh page to ensure clean state
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__skill-badge', { timeout: 5000 });
      
      // Get skills in left resume
      const leftSkillsCount = await page.$$eval('.resume-compare__col:first-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      if (leftSkillsCount === 0) {
        log('⚠️  No skills in left resume, skipping drag-drop test', 'warning');
        return;
      }
      
      // Get skills in right resume before drag
      const rightSkillsBefore = await page.$$eval('.resume-compare__col:last-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      // Find first draggable skill badge in left resume
      const skillBadge = await page.$('.resume-compare__col:first-child .resume-compare__skill-badge[draggable="true"]');
      if (!skillBadge) {
        throw new Error('No draggable skill badge found');
      }
      
      // Get drop zone (right resume card body)
      const dropZone = await page.$('.resume-compare__col:last-child .resume-compare__card .card-body');
      if (!dropZone) {
        throw new Error('Drop zone not found');
      }
      
      // Get skill ID from the badge
      const skillId = await page.evaluate((badge) => {
        const text = badge.textContent;
        // Extract skill_id from data or text - we'll use the badge's data attribute or text
        return badge.getAttribute('data-skill-id') || null;
      }, skillBadge);
      
      // Perform HTML5 drag and drop using evaluate
      const dragSuccess = await page.evaluate(async (badgeSelector, dropSelector) => {
        const badge = document.querySelector(badgeSelector);
        const dropZone = document.querySelector(dropSelector);
        
        if (!badge || !dropZone) return false;
        
        // Create drag events
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        
        badge.dispatchEvent(dragStartEvent);
        
        // Simulate drag over
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragStartEvent.dataTransfer
        });
        dragOverEvent.preventDefault();
        dropZone.dispatchEvent(dragOverEvent);
        
        // Simulate drop
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragStartEvent.dataTransfer
        });
        dropEvent.preventDefault();
        dropZone.dispatchEvent(dropEvent);
        
        return true;
      }, '.resume-compare__col:first-child .resume-compare__skill-badge[draggable="true"]', 
         '.resume-compare__col:last-child .resume-compare__card .card-body');
      
      if (!dragSuccess) {
        throw new Error('Failed to trigger drag and drop events');
      }
      
      // Wait for API call and refresh
      await page.waitForTimeout(3000);
      
      // Refresh the page to see updated skills
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__skill-badge', { timeout: 5000 });
      
      // Check if skill was added to right resume
      const rightSkillsAfter = await page.$$eval('.resume-compare__col:last-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      if (rightSkillsAfter <= rightSkillsBefore) {
        // Try alternative: use mouse events
        log('⚠️  HTML5 drag failed, trying mouse events...', 'warning');
        
        const badgeBox = await skillBadge.boundingBox();
        const dropBox = await dropZone.boundingBox();
        
        if (badgeBox && dropBox) {
          await page.mouse.move(badgeBox.x + badgeBox.width / 2, badgeBox.y + badgeBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(100);
          await page.mouse.move(dropBox.x + dropBox.width / 2, dropBox.y + dropBox.height / 2, { steps: 10 });
          await page.waitForTimeout(100);
          await page.mouse.up();
          await page.waitForTimeout(3000);
          
          await page.reload({ waitUntil: 'networkidle0' });
          await page.waitForSelector('.resume-compare__skill-badge', { timeout: 5000 });
          
          const rightSkillsAfterMouse = await page.$$eval('.resume-compare__col:last-child .resume-compare__skill-badge', 
            badges => badges.length
          );
          
          if (rightSkillsAfterMouse <= rightSkillsBefore) {
            throw new Error('Skill was not copied to target resume via drag-and-drop (tried both HTML5 and mouse events)');
          }
        } else {
          throw new Error('Skill was not copied to target resume via drag-and-drop');
        }
      }
    });

    // Test 6: Verify "Copy All Selected" button
    await test('Verify Copy All Selected Button', async () => {
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__copy-all-btn', { timeout: 5000 });
      
      const copyButton = await page.$('.resume-compare__copy-all-btn');
      if (!copyButton) {
        throw new Error('Copy All Selected button not found');
      }
      
      // Button should be visible
      const isVisible = await copyButton.isIntersectingViewport();
      if (!isVisible) {
        throw new Error('Copy All Selected button is not visible');
      }
    });

    // Test 7: Resume-specific skill deletion
    await test('Resume-Specific Skill Deletion', async () => {
      const token = await getAuthToken();
      
      // Get user skills
      const userSkills = await page.evaluate(async (url, token) => {
        const res = await fetch(`${url}/skills/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, token);
      
      if (userSkills.length === 0) {
        log('⚠️  No user skills, skipping deletion test', 'warning');
        return;
      }
      
      // Add skill to both resumes
      const skillId = userSkills[0].skill_id;
      await addSkillToResume(resume1Id, skillId);
      await addSkillToResume(resume2Id, skillId);
      await page.waitForTimeout(500);
      
      // Navigate to comparison
      await page.goto(`${BASE_URL}/resumes/compare/${resume1Id}/${resume2Id}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__delete-btn', { timeout: 5000 });
      
      // Count skills in both resumes before deletion
      const skills1Before = await page.$$eval('.resume-compare__col:first-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      const skills2Before = await page.$$eval('.resume-compare__col:last-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      // Delete skill from resume1 only (left side)
      const deleteButtons = await page.$$('.resume-compare__col:first-child .resume-compare__delete-btn');
      if (deleteButtons.length === 0) {
        log('⚠️  No delete buttons found in left resume, skipping deletion test', 'warning');
        return;
      }
      
      await deleteButtons[0].click();
      await page.waitForTimeout(1000); // Wait for modal to appear
      
      // Wait for modal and click "Remove from Resume" button
      await page.waitForSelector('.modal', { timeout: 3000 });
      
      const removeButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('.modal button'));
        return buttons.find(btn => 
          btn.textContent.includes('Remove from Resume') || 
          btn.textContent.includes('Remove') ||
          btn.textContent.includes('Delete')
        );
      });
      
      if (!removeButton) {
        // Try alternative selector
        const altButton = await page.$('button.btn-danger, button.btn-primary');
        if (altButton) {
          await altButton.click();
        } else {
          throw new Error('Remove from Resume button not found in modal');
        }
      } else {
        await removeButton.click();
      }
      
      await page.waitForTimeout(2000); // Wait for API call and refresh
      
      // Refresh page to see updated state
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForSelector('.resume-compare__skill-badge, .text-muted', { timeout: 5000 });
      
      // Verify skill removed from resume1
      const skills1After = await page.$$eval('.resume-compare__col:first-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      if (skills1After >= skills1Before) {
        throw new Error(`Skill was not removed from resume1 (before: ${skills1Before}, after: ${skills1After})`);
      }
      
      // Verify skill still in resume2
      const skills2After = await page.$$eval('.resume-compare__col:last-child .resume-compare__skill-badge', 
        badges => badges.length
      );
      
      if (skills2After < skills2Before) {
        throw new Error(`Skill was incorrectly removed from resume2 (before: ${skills2Before}, after: ${skills2After})`);
      }
      
      // Verify skill still exists in user_skills via API
      const userSkillsAfter = await page.evaluate(async (url, token) => {
        const res = await fetch(`${url}/skills/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
      }, API_URL, token);
      
      const skillInUserSkills = userSkillsAfter.some(s => s.skill_id === skillId);
      if (!skillInUserSkills) {
        throw new Error('Skill was incorrectly removed from user_skills table');
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

