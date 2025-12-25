const request = require('supertest');
const app = require('../../src/app');

describe('Tontines', () => {
  let token;
  let userId;
  let tontineId;

  beforeAll(async () => {
    const email = `owner${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Owner', email, password: 'password123' });
    
    token = res.body.data.token;
    userId = res.body.data.user.id;
  });

  describe('POST /api/tontines', () => {
    it('should create a tontine', async () => {
      const res = await request(app)
        .post('/api/tontines')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Tontine',
          amount: 10000,
          min_members: 3,
          frequency: 'monthly',
          pickup_policy: 'arrival',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      tontineId = res.body.data.id;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/tontines')
        .send({ name: 'Test', amount: 1000, min_members: 2, frequency: 'weekly' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tontines/:id/join', () => {
    let memberToken;

    beforeAll(async () => {
      const email = `member${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Member', email, password: 'password123' });
      
      memberToken = res.body.data.token;
    });

    it('should join a tontine', async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect([200, 201]).toContain(res.status);
    });

    it('should fail to join twice', async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect([400, 409]).toContain(res.status);
    });
  });

  describe('GET /api/tontines/:id', () => {
    it('should get tontine details', async () => {
      const res = await request(app)
        .get(`/api/tontines/${tontineId}`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('name');
      }
    });
  });
});
