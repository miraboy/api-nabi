const request = require('supertest');
const app = require('../../src/app');

describe('Rounds', () => {
  let ownerToken;
  let memberToken;
  let roundId;
  let cycleId;

  beforeAll(async () => {
    const ownerEmail = `roundowner${Date.now()}@example.com`;
    const ownerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Round Owner', email: ownerEmail, password: 'password123' });
    
    ownerToken = ownerRes.body.data.token;

    const memberEmail = `roundmember${Date.now()}@example.com`;
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Round Member', email: memberEmail, password: 'password123' });
    
    memberToken = memberRes.body.data.token;

    const tontineRes = await request(app)
      .post('/api/tontines')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Round Test Tontine',
        amount: 2000,
        min_members: 2,
        frequency: 'weekly',
        pickup_policy: 'arrival',
      });
    
    const tontineId = tontineRes.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set('Authorization', `Bearer ${memberToken}`);

    const cycleRes = await request(app)
      .post(`/api/tontines/${tontineId}/cycles`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ start_date: '2025-01-01' });

    cycleId = cycleRes.body.data.cycle.id;
    roundId = cycleRes.body.data.cycle.rounds[0].id;

    await request(app)
      .post(`/api/cycles/${cycleId}/start`)
      .set('Authorization', `Bearer ${ownerToken}`);
  });

  describe('GET /api/rounds/:roundId', () => {
    it('should get round details', async () => {
      const res = await request(app)
        .get(`/api/rounds/${roundId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.round).toHaveProperty('id');
      expect(res.body.data.round).toHaveProperty('status');
    });
  });

  describe('POST /api/rounds/:roundId/close', () => {
    it('should fail to close without payments', async () => {
      const res = await request(app)
        .post(`/api/rounds/${roundId}/close`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
    });

    it('should fail for non-owner', async () => {
      const res = await request(app)
        .post(`/api/rounds/${roundId}/close`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
