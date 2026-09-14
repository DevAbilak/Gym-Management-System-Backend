const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB, deactivateUser } = require("../helpers/auth");
const { createMembershipTier } = require("../helpers/subscription");

describe("Subscription Module API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    trainer2Token,
    member2Token;
  let trainerId, trainerUserId, trainer2Id;
  let memberProfileId, member2ProfileId, member3ProfileId;
  let tierId1, tierId2, tierId3;
  let subscriptionId;

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

    // Create member 1
    const member = await createTestUserInDB("member", {
      email: "member@test.com",
    });
    memberToken = member.token;
    memberProfileId = member.memberProfileId;

    // Create member 2
    const member2 = await createTestUserInDB("member", {
      email: "member2@test.com",
    });
    member2ProfileId = member2.memberProfileId;
    member2Token = member2.token;

    const member3 = await createTestUserInDB("member", {
      email: "member3@test.com",
    });
    member3ProfileId = member3.memberProfileId;

    // Create trainer 1
    const trainer = await createTestUserInDB("trainer", {
      email: "trainer@test.com",
      first_name: "Trainer",
      last_name: "One",
    });
    trainerToken = trainer.token;
    trainerId = trainer.trainerProfileId;
    trainerUserId = trainer.id;

    // Create trainer 2
    const trainer2 = await createTestUserInDB("trainer", {
      email: "trainer2@test.com",
      first_name: "Trainer",
      last_name: "Two",
    });
    trainer2Token = trainer2.token;
    trainer2Id = trainer2.trainerProfileId;

    tierId1 = (await createMembershipTier()).tierId1;
    tierId2 = (await createMembershipTier()).tierId2;
    tierId3 = (await createMembershipTier()).tierId3;
  });

  describe("POST /api/v1/subscriptions", () => {
    it("should allow admin to create subscription", async () => {
      const response = await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: memberProfileId,
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
        })
        .expect(201);

      subscriptionId = response.body.data.id;

      expect(response.body.success).toBe(true);
      expect(response.body.data.membership_tier_id).toBe(tierId1);
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
    });

    it("should allow reception to create subscription", async () => {
      const response = await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          member_profile_id: member2ProfileId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.membership_tier_id).toBe(tierId1);
      expect(response.body.data.member_profile_id).toBe(member2ProfileId);
    });

    it("should deny member from creating subscription", async () => {
      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          membership_tier_id: tierId2,
        })
        .expect(403);
    });

    it("should deny trainer from creating subscription", async () => {
      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_profile_id: memberProfileId,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          membership_tier_id: tierId2,
        })
        .expect(403);
    });

    it("should deny admin/reception from creating subscription to inactive member", async () => {
      const response = await createTestUserInDB("member", {
        email: "inactivemember@test.com",
      });
      const inactiveMemberId = response.memberProfileId;
      await deactivateUser("inactivemember@test.com");

      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          member_profile_id: inactiveMemberId,
        })
        .expect(403);
    });

    it("should deny admin/reception from creating subscription if member already have active subscription ", async () => {
      const member = await createTestUserInDB("member", {
        email: "alreadysubscribed@test.com",
      });
      const id = member.memberProfileId;

      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          member_profile_id: id,
        })
        .expect(201);

      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          member_profile_id: id,
        })
        .expect(409);
    });

    it("should return 404 if member is not found", async () => {
      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membership_tier_id: tierId1,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          member_profile_id: "00000000-0000-0000-0000-000000000000",
        })
        .expect(404);
    });

    it("should return 404 if membership tier is not found", async () => {
      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: member3ProfileId,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          membership_tier_id: "00000000-0000-0000-0000-000000000000",
        })
        .expect(404);
    });

    it("should return 404 if membership tier is not active", async () => {
      await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: member3ProfileId,
          start_date: new Date().toISOString().split("T")[0],
          auto_renew: false,
          membership_tier_id: tierId3,
        })
        .expect(404);
    });
  });

  describe("PATCH /api/v1/subscriptions/:id/status", () => {
    it("should allow admin to update subscription status", async () => {
      const response = await request(app)
        .patch(`/api/v1/subscriptions/${subscriptionId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "frozen" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("frozen");
    });

    it("should allow reception to update subscription status", async () => {
      const response = await request(app)
        .patch(`/api/v1/subscriptions/${subscriptionId}/status`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({ status: "active" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("active");
    });

    it("should deny member from updating subscription status", async () => {
      await request(app)
        .patch(`/api/v1/subscriptions/${subscriptionId}/status`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ status: "active" })
        .expect(403);
    });

    it("should deny trainer from updating subscription status", async () => {
      await request(app)
        .patch(`/api/v1/subscriptions/${subscriptionId}/status`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({ status: "active" })
        .expect(403);
    });

    it("should deny admin/reception from updating subscription status to invalid subscription status", async () => {
      await request(app)
        .patch(`/api/v1/subscriptions/${subscriptionId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "LOL" })
        .expect(400);
    });

    it("should return 404 if subscription is not found", async () => {
      await request(app)
        .patch(
          "/api/v1/subscriptions/00000000-0000-0000-0000-000000000000/status",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "frozen" })
        .expect(404);
    });
  });

  describe("GET /api/v1/subscriptions/active/:memberProfileId", () => {
    it("should allow admin to view active subscription for any member", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/active/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tier_name).toBe("Basic Monthly");
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
    });

    it("should allow reception to view active subscription for any member", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/active/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tier_name).toBe("Basic Monthly");
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
    });

    it("should allow member to view active subscription of their own", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/active/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tier_name).toBe("Basic Monthly");
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
    });

    it("should deny member from viewing active subscription of another member", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/active/${memberProfileId}`)
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should deny trainer from viewing active subscription of any member", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/active/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(403);
    });

    it("should return 404 if there is no active subscription for that member", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/active/${member3ProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    it("should return 404 if member is not found", async () => {
      await request(app)
        .get(
          "/api/v1/subscriptions/active/00000000-0000-0000-0000-000000000000",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("GET /api/v1/subscriptions/member/:memberProfileId", () => {
    it("should allow admin to view subscription history for any member", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((m) => {
        expect(m.member_profile_id).toBe(memberProfileId);
      });
    });

    it("should allow reception to view subscription history for any member", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((m) => {
        expect(m.member_profile_id).toBe(memberProfileId);
      });
    });

    it("should allow member to view subscription history of their own", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      response.body.data.data.forEach((m) => {
        expect(m.member_profile_id).toBe(memberProfileId);
      });
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}?page=1&limit=5`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data).toHaveProperty("pagination");
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination).toHaveProperty("total");
    });

    it("should return 400 if given invalid page in query", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}?page=-1&limit=5`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(400);
    });

    it("should return 400 if given limit in query is not between 1 and 100(both 1 and 100 are valid)", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}?page=1&limit=200`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(400);
    });

    it("should deny trainer from viewing subscription history of any member", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(403);
    });

    it("should deny member from viewing subscription history of another member", async () => {
      await request(app)
        .get(`/api/v1/subscriptions/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should return 404 if member id not found", async () => {
      await request(app)
        .get(
          "/api/v1/subscriptions/member/00000000-0000-0000-0000-000000000000",
        )
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(404);
    });
  });
});
