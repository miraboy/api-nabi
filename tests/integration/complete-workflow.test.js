const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Integration: Complete Tontine Workflow", () => {
  let ownerToken, member1Token, member2Token;
  let tontineId, cycleId;
  let rounds = [];

  beforeAll(async () => {
    // Create users
    const ownerRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Alice Owner",
        email: "alice@integration.com",
        password: "password123",
      });
    ownerToken = ownerRes.body.data.token;

    const member1Res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Bob Member",
        email: "bob@integration.com",
        password: "password123",
      });
    member1Token = member1Res.body.data.token;

    const member2Res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Charlie Member",
        email: "charlie@integration.com",
        password: "password123",
      });
    member2Token = member2Res.body.data.token;
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error(err);
        resolve();
      });
    });
  });

  describe("1. Tontine Creation and Setup", () => {
    test("Should create a tontine", async () => {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: "Integration Test Tontine",
          amount: 10000,
          min_members: 3,
          frequency: "monthly",
          pickup_policy: "arrival",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      tontineId = res.body.data.id;
    });

    test("Should allow members to join", async () => {
      const res1 = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set("Authorization", `Bearer ${member1Token}`);
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/tontines/${tontineId}/join`)
        .set("Authorization", `Bearer ${member2Token}`);
      expect(res2.status).toBe(201);
      expect(res2.body.data.status).toBe("closed");
    });
  });

  describe("2. Cycle Management", () => {
    test("Should create a cycle", async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/cycles`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          start_date: "2025-01-01",
          end_date: "2025-12-31",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.cycle).toHaveProperty("id");
      cycleId = res.body.data.cycle.id;
      rounds = res.body.data.cycle.rounds;
    });

    test("Should start the cycle", async () => {
      const res = await request(app)
        .post(`/api/cycles/${cycleId}/start`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cycle.status).toBe("active");
    });
  });

  describe("3. Complete All Rounds", () => {
    test("Should complete all rounds sequentially", async () => {
      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        
        // All members make payments
        const payment1 = await request(app)
          .post(`/api/rounds/${round.id}/payments`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ amount: 10000 });
        expect(payment1.status).toBe(201);

        const payment2 = await request(app)
          .post(`/api/rounds/${round.id}/payments`)
          .set("Authorization", `Bearer ${member1Token}`)
          .send({ amount: 10000 });
        expect(payment2.status).toBe(201);

        const payment3 = await request(app)
          .post(`/api/rounds/${round.id}/payments`)
          .set("Authorization", `Bearer ${member2Token}`)
          .send({ amount: 10000 });
        expect(payment3.status).toBe(201);

        // Close the round
        const closeRes = await request(app)
          .post(`/api/rounds/${round.id}/close`)
          .set("Authorization", `Bearer ${ownerToken}`);
        expect(closeRes.status).toBe(200);
      }
    });

    test("Should verify cycle is completed", async () => {
      const res = await request(app)
        .get(`/api/cycles/${cycleId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
    });
  });

  describe("4. Member Leave After Completion", () => {
    test("Should allow member to leave after all rounds completed", async () => {
      const res = await request(app)
        .post(`/api/tontines/${tontineId}/leave`)
        .set("Authorization", `Bearer ${member1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    test("Should verify member is no longer in tontine", async () => {
      const res = await request(app)
        .get("/api/tontines/my")
        .set("Authorization", `Bearer ${member1Token}`);

      expect(res.status).toBe(200);
      const isStillMember = res.body.data.member.some(t => t.id === tontineId);
      expect(isStillMember).toBe(false);
    });
  });

  describe("5. Data Integrity Checks", () => {
    test("Should have correct payment records", async () => {
      const res = await request(app)
        .get("/api/users/me/payments")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBe(3); // 3 rounds
    });

    test("Should have correct tontine statistics", async () => {
      const res = await request(app)
        .get(`/api/tontines/${tontineId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.members_count).toBe(2); // Owner + 1 remaining member
    });
  });
});