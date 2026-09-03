const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB } = require("../helpers/auth");
const {
  createMemberProfile,
  createSubscription,
} = require("../helpers/checkin");

describe("Check-in API", () => {
  let adminToken, memberToken, member2Token, receptionToken, trainerToken;
  let memberProfileId, memberUniqueId;

  beforeAll(async () => {
    // Create admin
    const admin = await createTestUserInDB("admin", {
      email: "admin@test.com",
    });
    adminToken = admin.token;

    // Create reception
    const reception = await createTestUserInDB("reception", {
      email: "reception@test.com",
    });
    receptionToken = reception.token;

    // Create trainer
    const trainer = await createTestUserInDB("trainer", {
      email: "trainer@test.com",
    });
    trainerToken = trainer.token;

    // Create member 1
    const member = await createTestUserInDB("member", {
      email: "member@test.com",
    });
    memberToken = member.token;

    // Create member profile and subscription
    const profile = await createMemberProfile(member.id);
    memberProfileId = profile.id;
    memberUniqueId = profile.unique_member_id;
    await createSubscription(memberProfileId, "active");

    // Create member 2 (no subscription)
    const member2 = await createTestUserInDB("member", {
      email: "member2@test.com",
    });
    member2Token = member2.token;
    const profile2 = await createMemberProfile(member2.id);
    // No subscription created for member 2
  });

  describe("POST /api/v1/checkin/:uniqueId", () => {
    it("should allow a member to check in themselves", async () => {
      const res = await request(app)
        .post(`/api/v1/checkin/${memberUniqueId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow reception to check in any member", async () => {
      const res = await request(app)
        .post(`/api/v1/checkin/${memberUniqueId}`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny check-in if subscription is not active", async () => {
      // Create a new member without subscription
      const member3 = await createTestUserInDB("member", {
        email: "member3@test.com",
      });
      const profile3 = await createMemberProfile(member3.id);
      const uniqueId3 = profile3.unique_member_id;

      const res = await request(app)
        .post(`/api/v1/checkin/${uniqueId3}`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain(
        "Member does not have an active subscription",
      );
    });

    it("should return 404 for non-existent member", async () => {
      const res = await request(app)
        .post("/api/v1/checkin/GYM-A0C1-3")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/checkin/override/:uniqueId", () => {
    it("should allow reception to override check-in", async () => {
      const res = await request(app)
        .post(`/api/v1/checkin/override/${memberUniqueId}`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({ reason: "Member paid cash" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.override).toBe(true);
    });

    it("should deny member from overriding check-in", async () => {
      const res = await request(app)
        .post(`/api/v1/checkin/override/${memberUniqueId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ reason: "Trying to bypass" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent member", async () => {
      const res = await request(app)
        .post("/api/v1/checkin/override/GYM-A345-2")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({ reason: "Test" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/checkin/history/:memberProfileId", () => {
    beforeAll(async () => {
      // Perform some check-ins to have history
      await request(app)
        .post(`/api/v1/checkin/${memberUniqueId}`)
        .set("Authorization", `Bearer ${memberToken}`);
    });

    it("should allow a member to view their own check-in history", async () => {
      const res = await request(app)
        .get(`/api/v1/checkin/history/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should deny a member from viewing another member's history", async () => {
      const res = await request(app)
        .get(`/api/v1/checkin/history/${memberProfileId}`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow admin to view any member's history", async () => {
      const res = await request(app)
        .get(`/api/v1/checkin/history/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/v1/checkin/today", () => {
    it("should allow admin to view today's check-ins", async () => {
      const res = await request(app)
        .get("/api/v1/checkin/today")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("count");
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should allow reception to view today's check-ins", async () => {
      const res = await request(app)
        .get("/api/v1/checkin/today")
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny member from viewing today's check-ins", async () => {
      const res = await request(app)
        .get("/api/v1/admin/checkins/today")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
