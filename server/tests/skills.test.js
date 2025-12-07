const request = require('supertest');
const { db, connect } = require('../config/database');
const app = require('../index');

describe('Skills API', () => {
  let authToken;
  let userId;
  let testUser;

  beforeAll(async () => {
    // Ensure database is connected
    await new Promise((resolve, reject) => {
      connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Wait a bit for routes to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create a test user
    const email = `test_skills_${Date.now()}@test.com`;
    const password = 'Test123!@#';
    
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User'
      });

    expect(registerRes.status).toBe(201);
    userId = registerRes.body.userId;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
    testUser = { email, password, userId };
  });

  afterAll(async () => {
    // Cleanup test user
    if (userId) {
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    }
  });

  describe('GET /api/skills', () => {
    it('should get all skills', async () => {
      const res = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter skills by category', async () => {
      const res = await request(app)
        .get('/api/skills?category_id=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter skills by type', async () => {
      const res = await request(app)
        .get('/api/skills?skill_type=hard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/skills/tree', () => {
    it('should get skill tree structure', async () => {
      const res = await request(app)
        .get('/api/skills/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/skills/user/tree', () => {
    it('should get user skill tree with progress', async () => {
      const res = await request(app)
        .get('/api/skills/user/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/skills/user/jobs', () => {
    it('should add job experience', async () => {
      const res = await request(app)
        .post('/api/skills/user/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company: 'Test Company',
          position: 'Test Position',
          description: 'Test description',
          start_date: '2020-01-01',
          end_date: '2021-01-01'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
    });

    it('should require company and position', async () => {
      const res = await request(app)
        .post('/api/skills/user/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company: '',
          position: ''
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/skills/user/:skillId', () => {
    it('should update user skill', async () => {
      // First get a skill
      const skillsRes = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      if (skillsRes.body.length > 0) {
        const skillId = skillsRes.body[0].id;

        const res = await request(app)
          .post(`/api/skills/user/${skillId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            level: 5,
            experience_points: 500
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
      }
    });
  });

  describe('POST /api/skills/user/jobs/:jobId/unlock-skills', () => {
    it('should unlock skills for a job', async () => {
      // First create a job
      const jobRes = await request(app)
        .post('/api/skills/user/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company: 'Unlock Test Company',
          position: 'Unlock Test Position'
        });

      expect(jobRes.status).toBe(201);
      const jobId = jobRes.body.id;

      // Get skills
      const skillsRes = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      if (skillsRes.body.length > 0) {
        const skillIds = [skillsRes.body[0].id];

        const res = await request(app)
          .post(`/api/skills/user/jobs/${jobId}/unlock-skills`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            skill_ids: skillIds,
            levels: [1],
            experience_points: [100]
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('unlocked');
      }
    });
  });

  describe('DELETE /api/skills/user/:skillId', () => {
    it('should delete user skill', async () => {
      // First create a skill
      const skillsRes = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      if (skillsRes.body.length > 0) {
        const skillId = skillsRes.body[0].id;

        // Add the skill first
        await request(app)
          .post(`/api/skills/user/${skillId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ level: 1, experience_points: 100 });

        // Then delete it
        const res = await request(app)
          .delete(`/api/skills/user/${skillId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
      }
    });
  });

  describe('DELETE /api/skills/user/jobs/:jobId', () => {
    it('should delete job experience', async () => {
      // First create a job
      const jobRes = await request(app)
        .post('/api/skills/user/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company: 'Delete Test Company',
          position: 'Delete Test Position'
        });

      if (jobRes.status === 201) {
        const jobId = jobRes.body.id;

        // Then delete it
        const res = await request(app)
          .delete(`/api/skills/user/jobs/${jobId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
      }
    });
  });
});

