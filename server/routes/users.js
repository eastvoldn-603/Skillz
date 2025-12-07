const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = db.prepare(
      'SELECT id, email, first_name, last_name, phone, created_at, updated_at FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { firstName, lastName, phone, email } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      // Check if email is already taken
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user account
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
