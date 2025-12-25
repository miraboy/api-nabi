const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Leave Tontine - Complete Scenario", () => {
  let ownerToken, memberToken, member2Token, tontineId, cycleId;

  beforeAll(async () => {
    // Create owner
    const ownerRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Owner",
        email: "owner@test.com",
        password: "password123",
      });
    ownerToken = ownerRes.body.data.token;

    // Create member 1
    const memberRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Member1",
        email: "member1@test.com",
        password: "password123",
      });
    memberToken = memberRes.body.data.token;

    // Create member 2
    const member2Res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Member2",
        email: "member2@test.com",
        password: "password123",
      });
    member2Token = member2Res.body.data.token;

    // Create tontine
    const tontineRes = await request(app)
      .post("/api/tontines")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Test Tontine",
        amount: 10000,
        min_members: 3,
        frequency: "monthly",
        pickup_policy: "arrival",
      });
    tontineId = tontineRes.body.data.id;

    // Members join tontine
    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set("Authorization", `Bearer ${memberToken}`);

    await request(app)
      .post(`/api/tontines/${tontineId}/join`)
      .set("Authorization", `Bearer ${member2Token}`);

    // Create cycle
    const cycleRes = await request(app)
      .post(`/api/tontines/${tontineId}/cycles`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        start_date: "2025-01-01",
        end_date: "2025-12-31",
      });
    cycleId = cycleRes.body.data.cycle.id;

    // Start cycle
    await request(app)
      .post(`/api/cycles/${cycleId}/start`)
      .set("Authorization", `Bearer ${ownerToken}`);

    // Get cycle details to get rounds
    const cycleDetails = await request(app)
      .get(`/api/cycles/${cycleId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    const rounds = cycleDetails.body.data.rounds;

    // Complete all rounds
    for (const round of rounds) {
      // All members make payments
      await request(app)
        .post(`/api/rounds/${round.id}/payments`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ amount: 10000 });

      await request(app)
        .post(`/api/rounds/${round.id}/payments`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ amount: 10000 });

      await request(app)
        .post(`/api/rounds/${round.id}/payments`)
        .set("Authorization", `Bearer ${member2Token}`)
        .send({ amount: 10000 });

      // Close round
      await request(app)
        .post(`/api/rounds/${round.id}/close`)
        .set("Authorization", `Bearer ${ownerToken}`);
    }
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error(err);
        resolve();
      });
    });
  });

  test("Should allow member to leave tontine after all rounds are completed", async () => {
    const res = await request(app)
      .post(`/api/tontines/${tontineId}/leave`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("Successfully left the tontine");
    expect(res.body.data.tontine_id).toBe(tontineId);
  });

  test("Should verify member is no longer in tontine", async () => {
    // Try to get user's tontines - should not include the left tontine
    const res = await request(app)
      .get("/api/tontines/my")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    const memberTontines = res.body.data.member;
    const isStillMember = memberTontines.some(t => t.id === tontineId);
    expect(isStillMember).toBe(false);
  });

  test("Should not allow member to leave tontine twice", async () => {
    const res = await request(app)
      .post(`/api/tontines/${tontineId}/leave`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain("not a member");
  });
});