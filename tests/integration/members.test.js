const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB } = require("../helpers/auth");

describe("Members API", () => {
  let adminUser, memberUser, trainerUser, receptionUser;
  let adminToken, memberToken, trainerToken, receptionToken;
  let memberProfileId;
  let targetProfileId, targetMemberToken;

  beforeAll(async () => {
    adminUser = await createTestUserInDB("admin", { email: "admin@test.com" });
    adminToken = adminUser.token;

    receptionUser = await createTestUserInDB("reception", {
      email: "reception@test.com",
    });
    receptionToken = receptionUser.token;

    memberUser = await createTestUserInDB("member", {
      email: "member@test.com",
    });
    memberToken = memberUser.token;
    memberProfileId = memberUser.memberProfileId;

    trainerUser = await createTestUserInDB("trainer", {
      email: "trainer@test.com",
    });
    trainerToken = trainerUser.token;

    // another member for deactivation tests
    const targetUser = await createTestUserInDB("member", {
      email: "target@test.com",
    });
    targetProfileId = targetUser.memberProfileId;
    targetMemberToken = targetUser.token;
  });

  // helper to extract data
  const extractData = (res) => {
    return res.body.data || res.body;
  };

  describe("GET /api/v1/members/me", () => {
    it("should return the current member profile", async () => {
      const res = await request(app)
        .get("/api/v1/members/me")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const profile = extractData(res);
      expect(profile).toHaveProperty("id");
      expect(profile.email).toBe("member@test.com");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/v1/members/me");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/members/:id", () => {
    it("should allow a member to view their own profile", async () => {
      const res = await request(app)
        .get(`/api/v1/members/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const profile = extractData(res);
      expect(profile.id).toBe(memberProfileId);
    });

    it("should deny a member from viewing another member\'s profile", async () => {
      const res = await request(app)
        .get(`/api/v1/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to view any member", async () => {
      const res = await request(app)
        .get(`/api/v1/members/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const profile = extractData(res);
      expect(profile.id).toBe(memberProfileId);
    });
  });

  describe("PATCH /api/v1/members/:id", () => {
    it("should allow a member to update their own profile", async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          emergency_contact_name: "New Contact",
          fitness_goal: "weight_loss",
        });

      expect(res.status).toBe(200);
      const updated = extractData(res);
      expect(updated.emergency_contact_name).toBe("New Contact");
      expect(updated.fitness_goal).toBe("weight_loss");
    });

    it("should deny a member from updating another member\'s profile", async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          emergency_contact_name: "Hacked LOL",
        });

      expect(res.status).toBe(403);
    });

    it("should allow admin to update any member profile", async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          emergency_contact_name: "admin updated",
        });

      expect(res.status).toBe(200);
      const updated = extractData(res);
      expect(updated.emergency_contact_name).toBe("admin updated");
    });
  });

  describe("GET /api/v1/members", () => {
    it("should allow admin to list all members with pagination", async () => {
      const res = await request(app)
        .get("/api/v1/members?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const result = extractData(res);
      expect(result).toHaveProperty("data");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result).toHaveProperty("pagination");
    });

    it("should allow reception to list all members", async () => {
      const res = await request(app)
        .get("/api/v1/members?page=1&limit=10")
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny member from listing all members", async () => {
      const res = await request(app)
        .get("/api/v1/members?page=1&limit=10")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should support search by email", async () => {
      const res = await request(app)
        .get("/api/v1/members?search=member@test.com")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const result = extractData(res);
      expect(result.data.length).toBeGreaterThan(0);
      const found = result.data.some((m) => m.email === "member@test.com");
      expect(found).toBe(true);
    });
  });

  describe("GET /api/v1/members/user/:userId", () => {
    it("should allow admin to get member by user ID", async () => {
      const res = await request(app)
        .get(`/api/v1/members/user/${memberUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const profile = extractData(res);
      expect(profile.id).toBe(memberProfileId);
    });

    it("should deny member from accessing this endpoint", async () => {
      const res = await request(app)
        .get(`/api/v1/members/user/${memberUser.id}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/members/unique/:uniqueMemberId", () => {
    it("should allow admin to get member by unique ID", async () => {
      const profileRes = await request(app)
        .get(`/api/v1/members/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      const profile = extractData(profileRes);
      const uniqueId = profile.unique_member_id;

      const res = await request(app)
        .get(`/api/v1/members/unique/${uniqueId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = extractData(res);
      expect(found.id).toBe(memberProfileId);
    });

    it("should deny member from accessing this endpoint", async () => {
      const res = await request(app)
        .get("/api/v1/members/unique/GYM-A3F9-7")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Admin Member Management", () => {
    it("should allow admin to deactivate a member (soft delete)", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // verify the member is inactive
      const checkRes = await request(app)
        .get(`/api/v1/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      const profile = extractData(checkRes);
      expect(profile.is_active).toBe(false);
    });

    it("should allow to reactivate member", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/members/${targetProfileId}/reactivate`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const checkRes = await request(app)
        .get(`/api/v1/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      const profile = extractData(checkRes);
      expect(profile.is_active).toBe(true);
    });

    it("should not allow non-admin to deactivate", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/members/${targetProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
