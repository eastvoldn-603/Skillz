const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all connections (accepted)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all accepted connections (bidirectional)
    const connections = db.prepare(`
      SELECT 
        c.id,
        c.status,
        c.created_at,
        CASE 
          WHEN c.user_id = ? THEN c.connected_user_id
          ELSE c.user_id
        END as connected_user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM connections c
      JOIN users u ON (
        CASE 
          WHEN c.user_id = ? THEN u.id = c.connected_user_id
          ELSE u.id = c.user_id
        END
      )
      WHERE (c.user_id = ? OR c.connected_user_id = ?) 
        AND c.status = 'accepted'
      ORDER BY c.created_at DESC
    `).all(userId, userId, userId, userId);

    res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send connection request
router.post('/', [
  body('connectedUserId').isInt().withMessage('Connected user ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { connectedUserId } = req.body;

    if (userId === connectedUserId) {
      return res.status(400).json({ error: 'Cannot connect to yourself' });
    }

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(connectedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if connection already exists
    const existing = db.prepare(`
      SELECT id, status FROM connections 
      WHERE (user_id = ? AND connected_user_id = ?) 
         OR (user_id = ? AND connected_user_id = ?)
    `).get(userId, connectedUserId, connectedUserId, userId);

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Connection request already pending' });
      }
    }

    // Create connection request (auto-accept for simplicity, or set to 'pending')
    // For now, auto-accept to make it simpler
    db.prepare(`
      INSERT INTO connections (user_id, connected_user_id, status) 
      VALUES (?, ?, 'accepted')
    `).run(userId, connectedUserId);

    res.status(201).json({ message: 'Connection created successfully' });
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove connection
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const connectionId = req.params.id;

    // Verify ownership
    const connection = db.prepare(`
      SELECT id FROM connections 
      WHERE id = ? AND (user_id = ? OR connected_user_id = ?)
    `).get(connectionId, userId, userId);

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    db.prepare('DELETE FROM connections WHERE id = ?').run(connectionId);
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users to connect with
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.userId;
    const searchTerm = req.query.q || '';

    if (!searchTerm.trim()) {
      return res.json([]);
    }

    // Get users matching search term (excluding self and already connected)
    const connectedUserIds = db.prepare(`
      SELECT 
        CASE 
          WHEN user_id = ? THEN connected_user_id
          ELSE user_id
        END as connected_user_id
      FROM connections
      WHERE (user_id = ? OR connected_user_id = ?) 
        AND status = 'accepted'
    `).all(userId, userId, userId).map(c => c.connected_user_id);

    const users = db.prepare(`
      SELECT id, first_name, last_name, email
      FROM users
      WHERE id != ?
        AND id NOT IN (${connectedUserIds.length > 0 ? connectedUserIds.map(() => '?').join(',') : '0'})
        AND (
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          email LIKE ?
        )
      LIMIT 20
    `).all(
      userId,
      ...(connectedUserIds.length > 0 ? connectedUserIds : []),
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`
    );

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

