const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Pagination", () => {
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

    // Create multiple tontines for pagination test
    for (let i = 1; i <= 15; i++) {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: `Tontine ${i}`,
          amount: 10000,
          min_members: 2,
          frequency: "monthly",
          pickup_policy: "arrival",
        });
      
      if (i === 1) {
        tontineId = res.body.data.id;
      }
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

  describe("Tontines Pagination", () => {
    test("Should return paginated tontines with default params", async () => {
      const res = await request(app)
        .get("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.current_page).toBe(1);
      expect(res.body.data.pagination.per_page).toBe(10);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
    });

    test("Should return paginated tontines with custom params", async () => {
      const res = await request(app)
        .get("/api/tontines?page=2&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(2);
      expect(res.body.data.pagination.per_page).toBe(5);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    test("Should handle invalid pagination params gracefully", async () => {
      const res = await request(app)
        .get("/api/tontines?page=-1&limit=1000")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(1); // Should default to 1
      expect(res.body.data.pagination.per_page).toBe(100); // Should cap at 100
    });
  });

  describe("Payments Pagination", () => {
    test("Should return paginated user payments", async () => {
      const res = await request(app)
        .get("/api/users/me/payments?page=1&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.current_page).toBe(1);
      expect(res.body.data.pagination.per_page).toBe(5);
    });
  });
});