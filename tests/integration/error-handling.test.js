const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Integration: Error Handling & Edge Cases", () => {
  let ownerToken, memberToken;
  let tontineId, cycleId, roundId;

  beforeAll(async () => {
    // Create users
    const ownerRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Error Test Owner",
        email: "error@test.com",
        password: "password123",
      });
    ownerToken = ownerRes.body.data.token;

    const memberRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Error Test Member",
        email: "errormember@test.com",
        password: "password123",
      });
    memberToken = memberRes.body.data.token;

    // Create basic tontine setup
    const tontineRes = await request(app)
      .post("/api/tontines")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Error Test Tontine",
        amount: 5000,
        min_members: 2,
        frequency: "monthly",
        pickup_policy: "arrival",
      });
    tontineId = tontineRes.body.data.id;

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set("Authorization", `Bearer ${memberToken}`);
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error(err);
        resolve();
      });
    });
  });

  describe("Resource Not Found Errors", () => {
    test("Should return 404 for non-existent tontine", async () => {
      const res = await request(app)
        .get("/api/tontines/99999")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe("error");
    });

    test("Should return 404 for non-existent cycle", async () => {
      const res = await request(app)
        .get("/api/cycles/99999")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });

    test("Should return 404 for non-existent round", async () => {
      const res = await request(app)
        .get("/api/rounds/99999")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Business Logic Violations", () => {
    test("Should prevent joining closed tontine", async () => {
      // Create another user
      const newUserRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Late Joiner",
          email: "late@test.com",
          password: "password123",
        });

      // Tontine should be closed (min_members reached)
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set("Authorization", `Bearer ${newUserRes.body.data.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("closed");
    });

    test("Should prevent duplicate membership", async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect([400, 409]).toContain(res.status); // Accept both 400 and 409
      expect(res.body.message).toMatch(/Already a member|closed/);
    });

    test("Should prevent cycle creation by non-owner", async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/cycles`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          start_date: "2025-01-01",
          end_date: "2025-12-31",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Payment Edge Cases", () => {
    beforeAll(async () => {
      // Create and start cycle for payment tests
      const cycleRes = await request(app)
        .post(`/api/tontines/${tontineId}/cycles`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          start_date: "2025-01-01",
          end_date: "2025-12-31",
        });
      cycleId = cycleRes.body.data.cycle.id;
      roundId = cycleRes.body.data.cycle.rounds[0].id;

      await request(app)
        .post(`/api/cycles/${cycleId}/start`)
        .set("Authorization", `Bearer ${ownerToken}`);
    });

    test("Should prevent payment with wrong amount", async () => {
      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ amount: 1000 }); // Wrong amount

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Payment amount must be");
    });

    test("Should prevent duplicate payments", async () => {
      // First payment
      await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ amount: 5000 });

      // Duplicate payment
      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already made");
    });

    test("Should prevent payment by non-member", async () => {
      const nonMemberRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Non Member",
          email: "nonmember@test.com",
          password: "password123",
        });

      const res = await request(app)
        .post(`/api/rounds/${roundId}/payments`)
        .set("Authorization", `Bearer ${nonMemberRes.body.data.token}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("must be a member");
    });
  });

  describe("Concurrent Operations", () => {
    test("Should handle concurrent join attempts gracefully", async () => {
      // Create new tontine for this test
      const newTontineRes = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: "Concurrent Test Tontine",
          amount: 3000,
          min_members: 3,
          frequency: "monthly",
          pickup_policy: "arrival",
        });
      const newTontineId = newTontineRes.body.data.id;

      // Create multiple users
      const user1Res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Concurrent User 1",
          email: "concurrent1@test.com",
          password: "password123",
        });

      const user2Res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Concurrent User 2",
          email: "concurrent2@test.com",
          password: "password123",
        });

      // Concurrent join attempts
      const promises = [
        request(app)
          .post(`/api/tontines/${newTontineId}/join`)
          .set("Authorization", `Bearer ${user1Res.body.data.token}`),
        request(app)
          .post(`/api/tontines/${newTontineId}/join`)
          .set("Authorization", `Bearer ${user2Res.body.data.token}`)
      ];

      const results = await Promise.all(promises);
      
      // Both should succeed
      expect(results[0].status).toBe(201);
      expect(results[1].status).toBe(201);
    });
  });

  describe("Data Consistency", () => {
    test("Should maintain referential integrity", async () => {
      // Get tontine details
      const tontineRes = await request(app)
        .get(`/api/tontines/${tontineId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(tontineRes.status).toBe(200);
      expect(tontineRes.body.data.members_count).toBe(2);
      expect(tontineRes.body.data.members.length).toBe(2);
    });

    test("Should handle malformed requests gracefully", async () => {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send("invalid json");

      expect(res.status).toBe(400);
    });
  });
});