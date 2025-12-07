const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all skill categories
router.get('/categories', async (req, res) => {
  try {
    const categories = db.prepare(
      'SELECT * FROM skill_categories ORDER BY name'
    ).all();

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all skills
router.get('/', async (req, res) => {
  try {
    const { category_id, skill_type } = req.query;
    let query = 'SELECT s.*, c.name as category_name, c.color as category_color FROM skills s LEFT JOIN skill_categories c ON s.category_id = c.id WHERE 1=1';
    const params = [];

    if (category_id) {
      query += ' AND s.category_id = ?';
      params.push(category_id);
    }
    if (skill_type) {
      query += ' AND s.skill_type = ?';
      params.push(skill_type);
    }

    query += ' ORDER BY s.name';

    const skills = db.prepare(query).all(...params);
    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skill tree structure
router.get('/tree', async (req, res) => {
  try {
    // Get all skills with their tree node information
    const treeNodes = db.prepare(`
      SELECT 
        stn.id as node_id,
        stn.skill_id,
        stn.parent_skill_id,
        stn.position_x,
        stn.position_y,
        stn.tier,
        stn.unlock_requirement,
        s.name as skill_name,
        s.description,
        s.skill_type,
        s.max_level,
        s.icon,
        c.name as category_name,
        c.color as category_color
      FROM skill_tree_nodes stn
      JOIN skills s ON stn.skill_id = s.id
      LEFT JOIN skill_categories c ON s.category_id = c.id
      ORDER BY stn.tier, stn.position_y, stn.position_x
    `).all();

    res.json(treeNodes);
  } catch (error) {
    console.error('Get skill tree error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's skills
router.get('/user', async (req, res) => {
  try {
    const userId = req.user.userId;

    const userSkills = db.prepare(`
      SELECT 
        us.*,
        s.name as skill_name,
        s.description,
        s.skill_type,
        s.max_level,
        s.icon,
        c.name as category_name,
        c.color as category_color
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      LEFT JOIN skill_categories c ON s.category_id = c.id
      WHERE us.user_id = ?
      ORDER BY us.last_updated DESC
    `).all(userId);

    res.json(userSkills);
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's skill tree with progress
router.get('/user/tree', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get tree structure
    const treeNodes = db.prepare(`
      SELECT 
        stn.id as node_id,
        stn.skill_id,
        stn.parent_skill_id,
        stn.position_x,
        stn.position_y,
        stn.tier,
        stn.unlock_requirement,
        s.name as skill_name,
        s.description,
        s.skill_type,
        s.max_level,
        s.icon,
        c.name as category_name,
        c.color as category_color,
        COALESCE(us.level, 0) as user_level,
        COALESCE(us.experience_points, 0) as user_experience,
        CASE WHEN us.unlocked_at IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
      FROM skill_tree_nodes stn
      JOIN skills s ON stn.skill_id = s.id
      LEFT JOIN skill_categories c ON s.category_id = c.id
      LEFT JOIN user_skills us ON us.skill_id = s.id AND us.user_id = ?
      ORDER BY stn.tier, stn.position_y, stn.position_x
    `).all(userId);

    res.json(treeNodes);
  } catch (error) {
    console.error('Get user skill tree error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's job experiences (must come before /user/:skillId to avoid route conflicts)
router.get('/user/jobs', async (req, res) => {
  try {
    const userId = req.user.userId;

    const jobs = db.prepare(`
      SELECT * FROM job_experiences
      WHERE user_id = ?
      ORDER BY start_date DESC
    `).all(userId);

    res.json(jobs);
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add job experience (must come before /user/:skillId to avoid route conflicts)
router.post('/user/jobs', [
  body('company').trim().notEmpty(),
  body('position').trim().notEmpty(),
  body('description').optional(),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('skills_gained').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { company, position, description, start_date, end_date, skills_gained } = req.body;

    const result = db.prepare(`
      INSERT INTO job_experiences (user_id, company, position, description, start_date, end_date, skills_gained)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, company, position, description || null, start_date || null, end_date || null, skills_gained || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Job experience added successfully'
    });
  } catch (error) {
    console.error('Add job experience error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlock skills based on job experience
router.post('/user/jobs/:jobId/unlock-skills', [
  body('skill_ids').isArray().notEmpty(),
  body('skill_ids.*').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const jobId = req.params.jobId;
    const { skill_ids, levels, experience_points } = req.body;

    // Verify job belongs to user
    const job = db.prepare('SELECT id FROM job_experiences WHERE id = ? AND user_id = ?').get(jobId, userId);
    if (!job) {
      return res.status(404).json({ error: 'Job experience not found' });
    }

    const unlocked = [];

    for (let i = 0; i < skill_ids.length; i++) {
      const skillId = skill_ids[i];
      const level = levels && levels[i] ? Math.min(levels[i], 10) : 1;
      const exp = experience_points && experience_points[i] ? experience_points[i] : 100;

      // Verify skill exists
      const skill = db.prepare('SELECT id FROM skills WHERE id = ?').get(skillId);
      if (!skill) continue;

      // Add to user_skills if not exists, or update if exists
      const existing = db.prepare('SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
      
      if (existing) {
        // Update level and experience
        db.prepare(`
          UPDATE user_skills 
          SET level = MAX(level, ?), 
              experience_points = experience_points + ?,
              last_updated = CURRENT_TIMESTAMP
          WHERE user_id = ? AND skill_id = ?
        `).run(level, exp, userId, skillId);
      } else {
        // Create new
        db.prepare(`
          INSERT INTO user_skills (user_id, skill_id, level, experience_points, unlocked_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(userId, skillId, level, exp);
      }

      // Record in skill_unlocks
      db.prepare(`
        INSERT INTO skill_unlocks (job_experience_id, skill_id, level_granted, experience_points_granted)
        VALUES (?, ?, ?, ?)
      `).run(jobId, skillId, level, exp);

      unlocked.push({ skill_id: skillId, level, experience_points: exp });
    }

    res.json({
      message: 'Skills unlocked successfully',
      unlocked
    });
  } catch (error) {
    console.error('Unlock skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user skill (level up, add experience) - must come after /user/jobs routes
router.post('/user/:skillId', [
  body('level').optional().isInt({ min: 0 }),
  body('experience_points').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const skillId = req.params.skillId;
    const { level, experience_points } = req.body;

    // Verify skill exists
    const skill = db.prepare('SELECT max_level FROM skills WHERE id = ?').get(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Check if user already has this skill
    const existing = db.prepare('SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId);

    if (existing) {
      // Update existing
      const updates = [];
      const values = [];

      if (level !== undefined) {
        const finalLevel = Math.min(level, skill.max_level);
        updates.push('level = ?');
        values.push(finalLevel);
      }
      if (experience_points !== undefined) {
        updates.push('experience_points = ?');
        values.push(experience_points);
      }

      if (updates.length > 0) {
        updates.push('last_updated = CURRENT_TIMESTAMP');
        values.push(userId, skillId);
        db.prepare(`UPDATE user_skills SET ${updates.join(', ')} WHERE user_id = ? AND skill_id = ?`).run(...values);
      }
    } else {
      // Create new
      const finalLevel = level !== undefined ? Math.min(level, skill.max_level) : 0;
      const finalExp = experience_points || 0;
      
      db.prepare(`
        INSERT INTO user_skills (user_id, skill_id, level, experience_points, unlocked_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(userId, skillId, finalLevel, finalExp);
    }

    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update user skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user skill
router.delete('/user/:skillId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const skillId = req.params.skillId;

    // Verify skill belongs to user
    const existing = db.prepare('SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
    if (!existing) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    db.prepare('DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?').run(userId, skillId);

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete user skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete job experience
router.delete('/user/jobs/:jobId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    // Verify job belongs to user
    const existing = db.prepare('SELECT * FROM job_experiences WHERE id = ? AND user_id = ?').get(jobId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Job experience not found' });
    }

    db.prepare('DELETE FROM job_experiences WHERE id = ?').run(jobId);

    res.json({ message: 'Job experience deleted successfully' });
  } catch (error) {
    console.error('Delete job experience error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

