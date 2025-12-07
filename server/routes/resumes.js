const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all resumes for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const resumes = db.prepare(
      'SELECT id, title, content, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId);

    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single resume
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = req.params.id;

    const resume = db.prepare(
      'SELECT id, title, content, created_at, updated_at FROM resumes WHERE id = ? AND user_id = ?'
    ).get(resumeId, userId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create resume
router.post('/', [
  body('title').trim().notEmpty(),
  body('content').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { title, content } = req.body;

    const result = db.prepare(
      'INSERT INTO resumes (user_id, title, content) VALUES (?, ?, ?)'
    ).run(userId, title, content || '');

    res.status(201).json({
      id: result.lastInsertRowid,
      title,
      content: content || '',
      message: 'Resume created successfully'
    });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update resume
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('content').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const resumeId = req.params.id;
    const { title, content } = req.body;

    // Verify ownership
    const existing = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(resumeId);
    db.prepare(`UPDATE resumes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Resume updated successfully' });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete resume
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = req.params.id;

    // Verify ownership
    const existing = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    db.prepare('DELETE FROM resumes WHERE id = ?').run(resumeId);

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skills for a specific resume
router.get('/:id/skills', async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = req.params.id;

    // Verify ownership
    const resume = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get skills associated with this resume
    const resumeSkills = db.prepare(`
      SELECT 
        rs.skill_id,
        us.level as user_level,
        us.experience_points as user_experience,
        s.name as skill_name,
        s.description,
        s.skill_type,
        s.max_level,
        s.icon,
        c.name as category_name,
        c.color as category_color
      FROM resume_skills rs
      JOIN user_skills us ON rs.skill_id = us.skill_id AND us.user_id = ?
      JOIN skills s ON rs.skill_id = s.id
      LEFT JOIN skill_categories c ON s.category_id = c.id
      WHERE rs.resume_id = ?
      ORDER BY s.name
    `).all(userId, resumeId);

    res.json(resumeSkills);
  } catch (error) {
    console.error('Get resume skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add skill to resume
router.post('/:id/skills/:skillId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = req.params.id;
    const skillId = req.params.skillId;

    // Verify ownership
    const resume = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Verify user has this skill
    const userSkill = db.prepare('SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
    if (!userSkill) {
      return res.status(404).json({ error: 'Skill not found in your skills' });
    }

    // Add skill to resume (ignore if already exists due to UNIQUE constraint)
    try {
      db.prepare('INSERT INTO resume_skills (resume_id, skill_id) VALUES (?, ?)').run(resumeId, skillId);
      res.json({ message: 'Skill added to resume successfully' });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Skill already in resume' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Add skill to resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove skill from resume
router.delete('/:id/skills/:skillId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = req.params.id;
    const skillId = req.params.skillId;

    // Verify ownership
    const resume = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Remove skill from resume
    const result = db.prepare('DELETE FROM resume_skills WHERE resume_id = ? AND skill_id = ?').run(resumeId, skillId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Skill not found in resume' });
    }

    res.json({ message: 'Skill removed from resume successfully' });
  } catch (error) {
    console.error('Remove skill from resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
