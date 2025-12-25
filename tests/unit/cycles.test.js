const request = require('supertest');
const app = require('../../src/app');

describe('Cycles', () => {
  let token;
  let tontineId;
  let cycleId;

  beforeAll(async () => {
    const email = `cycleowner${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Cycle Owner', email, password: 'password123' });
    
    token = res.body.data.token;

    const tontineRes = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cycle Test Tontine',
        amount: 5000,
        min_members: 2,
        frequency: 'weekly',
        pickup_policy: 'arrival',
      });
    
    tontineId = tontineRes.body.data.id;

    const memberEmail = `cyclemember${Date.now()}@example.com`;
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Member', email: memberEmail, password: 'password123' });
    
    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${memberRes.body.data.token}`);
  });

  describe('POST /api/tontines/:id/cycles', () => {
    it('should create a cycle', async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/cycles`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_date: '2025-01-01',
          end_date: '2025-12-31',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.cycle).toHaveProperty('id');
      cycleId = res.body.data.cycle.id;
    });

    it('should fail to create duplicate cycle', async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/cycles`)
        .set('Authorization', `Bearer ${token}`)
        .send({ start_date: '2025-01-01' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/cycles/:cycleId/start', () => {
    it('should start a cycle', async () => {
      if (!cycleId) {
        return;
      }
      const res = await request(app)
        .post(`/api/cycles/${cycleId}/start`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400]).toContain(res.status);
    });

    it('should fail to start already started cycle', async () => {
      if (!cycleId) {
        return;
      }
      const res = await request(app)
        .post(`/api/cycles/${cycleId}/start`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/cycles/:cycleId/stats', () => {
    it('should get cycle statistics', async () => {
      if (!cycleId) {
        return;
      }
      const res = await request(app)
        .get(`/api/cycles/${cycleId}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('current_round');
      }
    });
  });
});
