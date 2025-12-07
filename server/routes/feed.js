const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get feed (posts from connected users)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all accepted connections (bidirectional)
    const connections = db.prepare(`
      SELECT 
        CASE 
          WHEN user_id = ? THEN connected_user_id
          ELSE user_id
        END as connected_user_id
      FROM connections
      WHERE (user_id = ? OR connected_user_id = ?) 
        AND status = 'accepted'
    `).all(userId, userId, userId);

    const connectedUserIds = connections.map(c => c.connected_user_id);
    
    // If no connections, return empty array
    if (connectedUserIds.length === 0) {
      return res.json([]);
    }

    // Get posts from connected users, ordered by most recent
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.updated_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id IN (${connectedUserIds.map(() => '?').join(',')})
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(...connectedUserIds);

    res.json(posts);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new post
router.post('/', [
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 1000 }).withMessage('Content must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { content } = req.body;

    const result = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)').run(userId, content);
    
    // Get the created post with user info
    const post = db.prepare(`
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.updated_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete own post
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;

    // Verify ownership
    const post = db.prepare('SELECT id FROM posts WHERE id = ? AND user_id = ?').get(postId, userId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

