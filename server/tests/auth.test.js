const request = require('supertest');
const app = require('../index');
const db = require('../config/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Setup test database if needed
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Cleanup - close database connection
    if (db.db) {
      db.db.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});

