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

module.exports = router;
