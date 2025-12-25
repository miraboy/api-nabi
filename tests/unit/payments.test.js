const request = require('supertest');
const app = require('../../src/app');

describe('Payments', () => {
  let token;
  let roundId;
  let tontineAmount;

  beforeAll(async () => {
    const email = `paymentowner${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Payment Owner', email, password: 'password123' });
    
    token = res.body.data.token;

    const tontineRes = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Payment Test Tontine',
        amount: 3000,
        min_members: 2,
        frequency: 'monthly',
        pickup_policy: 'arrival',
      });
    
    const tontineId = tontineRes.body.data.id;
    tontineAmount = 3000;

    const memberEmail = `paymentmember${Date.now()}@example.com`;
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Member', email: memberEmail, password: 'password123' });
    
    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${memberRes.body.data.token}`);

    const cycleRes = await request(app)
      .post(`/api/tontines/${tontineId}/cycles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ start_date: '2025-01-01' });

    const cycleId = cycleRes.body.data.cycle.id;

    await request(app)
      .post(`/api/cycles/${cycleId}/start`)
      .set('Authorization', `Bearer ${token}`);

    roundId = cycleRes.body.data.cycle.rounds[0].id;
  });

  describe('POST /api/rounds/:roundId/payments', () => {
    it('should create a payment', async () => {
      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: tontineAmount });

      expect(res.status).toBe(201);
      expect(res.body.data.payment).toHaveProperty('id');
    });

    it('should fail with duplicate payment', async () => {
      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: tontineAmount });

      expect(res.status).toBe(409);
    });

    it('should fail with wrong amount', async () => {
      const memberEmail = `wrongamount${Date.now()}@example.com`;
      const memberRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Wrong Amount', email: memberEmail, password: 'password123' });

      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set('Authorization', `Bearer ${memberRes.body.data.token}`)
        .send({ amount: 1000 });

      expect([400, 403]).toContain(res.status);
    });
  });

  describe('GET /api/rounds/:roundId/payments', () => {
    it('should list payments for a round', async () => {
      const res = await request(app)
        .get(`/api/rounds/${roundId}/payments`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  describe('GET /api/users/me/payments', () => {
    it('should list user payments', async () => {
      const res = await request(app)
        .get('/api/users/me/payments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });
});
