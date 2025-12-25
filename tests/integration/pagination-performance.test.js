const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Integration: Pagination & Performance", () => {
  let ownerToken;
  let tontineIds = [];

  beforeAll(async () => {
    // Create owner
    const ownerRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Pagination Owner",
        email: "pagination@test.com",
        password: "password123",
      });
    ownerToken = ownerRes.body.data.token;

    // Create multiple tontines for pagination testing
    for (let i = 1; i <= 25; i++) {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: `Tontine ${i}`,
          amount: 1000 * i,
          min_members: 2,
          frequency: "monthly",
          pickup_policy: "arrival",
        });
      
      if (res.status === 201) {
        tontineIds.push(res.body.data.id);
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

  describe("Pagination Functionality", () => {
    test("Should return first page with default limit", async () => {
      const res = await request(app)
        .get("/api/tontines")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(1);
      expect(res.body.data.pagination.per_page).toBe(10);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
    });

    test("Should return specific page with custom limit", async () => {
      const res = await request(app)
        .get("/api/tontines?page=2&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(2);
      expect(res.body.data.pagination.per_page).toBe(5);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    test("Should handle invalid pagination parameters", async () => {
      const res = await request(app)
        .get("/api/tontines?page=-1&limit=1000")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(1);
      expect(res.body.data.pagination.per_page).toBe(100);
    });

    test("Should provide correct pagination metadata", async () => {
      const res = await request(app)
        .get("/api/tontines?page=1&limit=10")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toHaveProperty("total_items");
      expect(res.body.data.pagination).toHaveProperty("total_pages");
      expect(res.body.data.pagination).toHaveProperty("has_next");
      expect(res.body.data.pagination).toHaveProperty("has_prev");
      expect(res.body.data.pagination.total_items).toBeGreaterThan(0);
    });
  });

  describe("Performance Tests", () => {
    test("Should handle large dataset pagination efficiently", async () => {
      const startTime = Date.now();
      
      const res = await request(app)
        .get("/api/tontines?page=1&limit=50")
        .set("Authorization", `Bearer ${ownerToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(res.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test("Should maintain consistent response structure across pages", async () => {
      const page1 = await request(app)
        .get("/api/tontines?page=1&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      const page2 = await request(app)
        .get("/api/tontines?page=2&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      
      // Same structure
      expect(page1.body.data).toHaveProperty("data");
      expect(page1.body.data).toHaveProperty("pagination");
      expect(page2.body.data).toHaveProperty("data");
      expect(page2.body.data).toHaveProperty("pagination");

      // Different data
      if (page1.body.data.data.length > 0 && page2.body.data.data.length > 0) {
        expect(page1.body.data.data[0].id).not.toBe(page2.body.data.data[0].id);
      }
    });
  });

  describe("Filtering with Pagination", () => {
    test("Should filter and paginate simultaneously", async () => {
      const res = await request(app)
        .get("/api/tontines?status=open&page=1&limit=5")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.per_page).toBe(5);
      
      // All returned tontines should have 'open' status
      res.body.data.data.forEach(tontine => {
        expect(tontine.status).toBe("open");
      });
    });
  });

  describe("Edge Cases", () => {
    test("Should handle empty results gracefully", async () => {
      const res = await request(app)
        .get("/api/tontines?status=nonexistent&page=1&limit=10")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toEqual([]);
      expect(res.body.data.pagination.total_items).toBe(0);
      expect(res.body.data.pagination.total_pages).toBe(0);
    });

    test("Should handle page beyond available data", async () => {
      const res = await request(app)
        .get("/api/tontines?page=999&limit=10")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toEqual([]);
    });
  });
});