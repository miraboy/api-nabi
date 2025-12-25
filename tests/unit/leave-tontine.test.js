const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Leave Tontine", () => {
  let ownerToken, memberToken, tontineId;

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

    // Create member
    const memberRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Member",
        email: "member@test.com",
        password: "password123",
      });
    memberToken = memberRes.body.data.token;

    // Create tontine
    const tontineRes = await request(app)
      .post("/api/tontines")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        name: "Test Tontine",
        amount: 10000,
        min_members: 2,
        frequency: "monthly",
        pickup_policy: "arrival",
      });
    tontineId = tontineRes.body.data.id;

    // Member joins tontine
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

  test("Should not allow member to leave tontine without completed cycles", async () => {
    const res = await request(app)
      .post(`/api/tontines/${tontineId}/leave`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain("without any completed cycles");
  });

  test("Should not allow owner to leave tontine", async () => {
    const res = await request(app)
      .post(`/api/tontines/${tontineId}/leave`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain("owner cannot leave");
  });

  test("Should not allow non-member to leave tontine", async () => {
    // Create another user
    const nonMemberRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "NonMember",
        email: "nonmember@test.com",
        password: "password123",
      });

    const res = await request(app)
      .post(`/api/tontines/${tontineId}/leave`)
      .set("Authorization", `Bearer ${nonMemberRes.body.data.token}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain("not a member");
  });

  test("Should return 404 for non-existent tontine", async () => {
    const res = await request(app)
      .post("/api/tontines/999/leave")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});