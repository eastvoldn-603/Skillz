const request = require('supertest');
const app = require('../index');

describe('Resumes API', () => {
  let authToken;

  beforeAll(async () => {
    // Register and login to get token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'resume@test.com',
        password: 'password123',
        firstName: 'Resume',
        lastName: 'Test'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'resume@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('POST /api/resumes', () => {
    it('should create a new resume', async () => {
      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Software Engineer Resume',
          content: 'Resume content here'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Software Engineer Resume');
    });
  });

  describe('GET /api/resumes', () => {
    it('should get all resumes for user', async () => {
      const response = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

