const request = require("supertest");
const app = require("../../src/app");

describe("Security Middlewares", () => {
  describe("CORS", () => {
    test("Should include CORS headers", async () => {
      const res = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:3001");

      expect(res.headers["access-control-allow-origin"]).toBeDefined();
    });

    test("Should handle preflight requests", async () => {
      const res = await request(app)
        .options("/api/health")
        .set("Origin", "http://localhost:3001")
        .set("Access-Control-Request-Method", "GET");

      expect(res.status).toBe(204);
    });
  });

  describe("Request Logging", () => {
    test("Should process requests normally with logging middleware", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });
  });

  describe("Rate Limiting", () => {
    test("Should allow requests in test environment", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      // Rate limiting est désactivé en mode test
    });
  });
});