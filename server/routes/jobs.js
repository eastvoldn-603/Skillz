const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const jobs = db.prepare(
      'SELECT id, title, company, description, location, salary, created_at FROM jobs ORDER BY created_at DESC'
    ).all();
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single job (public)
router.get('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = db.prepare(
      'SELECT id, title, company, description, location, salary, created_at FROM jobs WHERE id = ?'
    ).get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// All application routes require authentication
router.use(authenticateToken);

// Get user's job applications
router.get('/applications/all', async (req, res) => {
  try {
    const userId = req.user.userId;
    const applications = db.prepare(`
      SELECT 
        ja.id,
        ja.status,
        ja.notes,
        ja.applied_at,
        ja.updated_at,
        j.id as job_id,
        j.title as job_title,
        j.company as job_company,
        r.id as resume_id,
        r.title as resume_title
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN resumes r ON ja.resume_id = r.id
      WHERE ja.user_id = ?
      ORDER BY ja.applied_at DESC
    `).all(userId);

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single application
router.get('/applications/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const applicationId = req.params.id;
    const application = db.prepare(`
      SELECT 
        ja.id,
        ja.status,
        ja.notes,
        ja.applied_at,
        ja.updated_at,
        j.id as job_id,
        j.title as job_title,
        j.company as job_company,
        j.description as job_description,
        j.location as job_location,
        j.salary as job_salary,
        r.id as resume_id,
        r.title as resume_title,
        r.content as resume_content
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN resumes r ON ja.resume_id = r.id
      WHERE ja.id = ? AND ja.user_id = ?
    `).get(applicationId, userId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply to job
router.post('/:id/apply', [
  body('resumeId').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('resumeId must be an integer'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const jobId = req.params.id;
    let { resumeId, notes } = req.body;

    // Normalize resumeId: convert empty string to null
    if (resumeId === '' || resumeId === undefined) {
      resumeId = null;
    } else {
      // Convert to integer if it's a string
      resumeId = parseInt(resumeId);
      if (isNaN(resumeId)) {
        return res.status(400).json({ error: 'Invalid resume ID' });
      }
    }

    // Verify job exists
    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify resume belongs to user if provided
    if (resumeId !== null) {
      const resume = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(resumeId, userId);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }
    }

    // Check if already applied with the same resume (allow multiple applications with different resumes)
    if (resumeId !== null) {
      const existing = db.prepare('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ? AND resume_id = ?').get(userId, jobId, resumeId);
      if (existing) {
        return res.status(400).json({ error: 'Already applied to this job with this resume' });
      }
    } else {
      // If no resume specified, check if user already applied without a resume
      const existing = db.prepare('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ? AND resume_id IS NULL').get(userId, jobId);
      if (existing) {
        return res.status(400).json({ error: 'Already applied to this job without a resume' });
      }
    }

    // Create application
    const result = db.prepare(
      'INSERT INTO job_applications (user_id, job_id, resume_id, notes) VALUES (?, ?, ?, ?)'
    ).run(userId, jobId, resumeId, notes || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application
router.put('/applications/:id', [
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'withdrawn']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const applicationId = req.params.id;
    const { status, notes } = req.body;

    // Verify ownership
    const application = db.prepare('SELECT id FROM job_applications WHERE id = ? AND user_id = ?').get(applicationId, userId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(applicationId);
    db.prepare(`UPDATE job_applications SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete application
router.delete('/applications/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const applicationId = req.params.id;

    // Verify ownership
    const application = db.prepare('SELECT id FROM job_applications WHERE id = ? AND user_id = ?').get(applicationId, userId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    db.prepare('DELETE FROM job_applications WHERE id = ?').run(applicationId);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get job offers for user
router.get('/offers/all', async (req, res) => {
  try {
    const userId = req.user.userId;
    const offers = db.prepare(`
      SELECT 
        jo.id,
        jo.offer_details,
        jo.salary,
        jo.start_date,
        jo.status,
        jo.created_at,
        jo.updated_at,
        ja.id as application_id,
        j.title as job_title,
        j.company as job_company
      FROM job_offers jo
      JOIN job_applications ja ON jo.application_id = ja.id
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ?
      ORDER BY jo.created_at DESC
    `).all(userId);

    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single offer
router.get('/offers/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const offerId = req.params.id;
    const offer = db.prepare(`
      SELECT 
        jo.id,
        jo.offer_details,
        jo.salary,
        jo.start_date,
        jo.status,
        jo.created_at,
        jo.updated_at,
        ja.id as application_id,
        j.title as job_title,
        j.company as job_company,
        j.description as job_description
      FROM job_offers jo
      JOIN job_applications ja ON jo.application_id = ja.id
      JOIN jobs j ON ja.job_id = j.id
      WHERE jo.id = ? AND ja.user_id = ?
    `).get(offerId, userId);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update offer
router.put('/offers/:id', [
  body('status').optional().isIn(['pending', 'accepted', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const offerId = req.params.id;
    const { status } = req.body;

    // Verify ownership through application
    const offer = db.prepare(`
      SELECT jo.id FROM job_offers jo
      JOIN job_applications ja ON jo.application_id = ja.id
      WHERE jo.id = ? AND ja.user_id = ?
    `).get(offerId, userId);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (status) {
      db.prepare('UPDATE job_offers SET status = ? WHERE id = ?').run(status, offerId);
    }

    res.json({ message: 'Offer updated successfully' });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete offer
router.delete('/offers/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const offerId = req.params.id;

    // Verify ownership
    const offer = db.prepare(`
      SELECT jo.id FROM job_offers jo
      JOIN job_applications ja ON jo.application_id = ja.id
      WHERE jo.id = ? AND ja.user_id = ?
    `).get(offerId, userId);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    db.prepare('DELETE FROM job_offers WHERE id = ?').run(offerId);

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
