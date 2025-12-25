const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/utils/db");

describe("Integration: Authentication & Security", () => {
  let userToken;
  let tontineId;

  afterAll(async () => {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error(err);
        resolve();
      });
    });
  });

  describe("Authentication Flow", () => {
    test("Should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@security.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toHaveProperty("id");
      userToken = res.body.data.token;
    });

    test("Should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@security.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
    });

    test("Should fail login with wrong credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@security.com",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("Authorization & Access Control", () => {
    test("Should require authentication for protected routes", async () => {
      const res = await request(app).get("/api/tontines");
      expect(res.status).toBe(401);
    });

    test("Should allow access with valid token", async () => {
      const res = await request(app)
        .get("/api/tontines")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    test("Should create tontine with valid token", async () => {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Security Test Tontine",
          amount: 5000,
          min_members: 2,
          frequency: "monthly",
          pickup_policy: "arrival",
        });

      expect(res.status).toBe(201);
      tontineId = res.body.data.id;
    });

    test("Should prevent unauthorized tontine modification", async () => {
      // Create another user
      const otherUserRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Other User",
          email: "other@security.com",
          password: "password123",
        });

      // Try to modify tontine with different user
      const res = await request(app)
        .put(`/api/tontines/${tontineId}`)
        .set("Authorization", `Bearer ${otherUserRes.body.data.token}`)
        .send({ name: "Hacked Tontine" });

      expect(res.status).toBe(403);
    });
  });

  describe("Input Validation", () => {
    test("Should validate required fields", async () => {
      const res = await request(app)
        .post("/api/tontines")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Invalid Tontine",
          // Missing required fields
        });

      expect(res.status).toBe(400);
    });

    test("Should validate email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Invalid Email User",
          email: "invalid-email",
          password: "password123",
        });

      expect(res.status).toBe(400);
    });

    test("Should validate password length", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Weak Password User",
          email: "weak@security.com",
          password: "123",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("CORS & Headers", () => {
    test("Should include CORS headers", async () => {
      const res = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:3001");

      expect(res.headers["access-control-allow-origin"]).toBeDefined();
    });

    test("Should handle preflight requests", async () => {
      const res = await request(app)
        .options("/api/tontines")
        .set("Origin", "http://localhost:3001")
        .set("Access-Control-Request-Method", "POST");

      expect(res.status).toBe(204);
    });
  });
});