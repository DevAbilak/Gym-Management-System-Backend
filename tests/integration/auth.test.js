const request = require("supertest");
const app = require("../../src/app");
const { createTestUser } = require("../helpers/auth");

describe("Auth API", () => {
  let testUser;

  describe("POST /api/v1/auth/register", () => {
    it("should register a new member successfully", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "SecurePass123!",
        first_name: "Test",
        last_name: "User",
        phone: "+251912345678",
        role: "member",
        date_of_birth: "1996-01-01",
        gender: "male",
        fitness_goal: "muscle_building",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "+251911111111",
      });

      expect(res.status).toBe(201);
      const user = res.body.data?.user;
      expect(user).toBeDefined();
      expect(user).toHaveProperty("id");
      expect(user.email).toBe("test@example.com");
    });

    it("should reject duplicate email", async () => {
      // First registration
      await request(app).post("/api/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "SecurePass123!",
        first_name: "Test",
        last_name: "User",
        role: "member",
        date_of_birth: "1996-01-01",
        gender: "male",
        fitness_goal: "muscle_building",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "+251911111111",
      });

      // Second registration with same email
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "SecurePass123!",
        first_name: "Test",
        last_name: "User",
        role: "member",
        date_of_birth: "1996-01-01",
        gender: "male",
        fitness_goal: "muscle_building",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "+251911111111",
      });

      expect(res.status).toBe(409);
      const errorMsg = res.body.error;
      const hasDuplicate = errorMsg.includes("Email already registered");
      expect(hasDuplicate).toBe(true);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "not-an-email",
        password: "SecurePass123!",
        first_name: "Test",
        last_name: "User",
        role: "member",
        date_of_birth: "1996-01-01",
        gender: "male",
        fitness_goal: "muscle_building",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "+251911111111",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeAll(async () => {
      testUser = await createTestUser();
    });

    it("should login successfully and return tokens", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.user.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      const tokens = res.body.data;
      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
    });

    it("should reject invalid password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.user.email,
        password: "WrongPassword123!",
      });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "SecurePass123!",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken;

    beforeAll(async () => {
      const user = await createTestUser();
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: user.user.email,
        password: user.password,
      });
      refreshToken = (loginRes.body.data || loginRes.body).refreshToken;
    });

    it("should refresh access token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      const tokens = res.body.data;
      expect(tokens).toHaveProperty("accessToken");
    });

    it("should reject invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/logout", () => {
    let accessToken;

    beforeAll(async () => {
      const user = await createTestUser();
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: user.user.email,
        password: user.password,
      });
      accessToken = loginRes.body.data.accessToken || loginRes.body.accessToken;
    });

    it("should logout successfully", async () => {
      const res = await request(app)
        .get("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const msg = res.body.data?.message;
      expect(msg).toContain("Logged out");
    });

    it("should reject logout without token", async () => {
      const res = await request(app).get("/api/v1/auth/logout");

      expect(res.status).toBe(401);
    });
  });
});
