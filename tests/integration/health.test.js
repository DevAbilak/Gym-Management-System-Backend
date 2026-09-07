const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB, deactivateUser } = require("../helpers/auth");
const { assignMemberToTrainer } = require("../helpers/trainer");

describe("Health Module API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    member2Token,
    trainer2Token;
  let trainerId, trainerUserId, trainer2Id;
  let memberProfileId, member2ProfileId;

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
  });

  describe("POST /api/v1/health-metrics", () => {
    const validPayload = {
      weight_kg: 82,
      height_cm: 180,
      blood_type: "O+",
      dietary_restrictions: "Gluten-Free",
      body_fat_percentage: 15.5,
      muscle_mass_kg: 35.0,
      waist_cm: 82,
      notes: "Post-workout measurement",
    };

    it("should allow admin to save health metrics for any member", async () => {
      const response = await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...validPayload,
          member_id: memberProfileId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        member_id: memberProfileId,
        weight_kg: 82,
        height_cm: 180,
        bmi: expect.any(Number),
        blood_type: "O+",
        dietary_restrictions: "Gluten-Free",
        body_fat_percentage: 15.5,
        muscle_mass_kg: 35.0,
        waist_cm: 82,
        notes: "Post-workout measurement",
      });
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("recorded_at");
    });

    it("should allow member to save health metrics for themselves", async () => {
      const response = await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          ...validPayload,
          height_cm: 180,
          member_id: memberProfileId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.height_cm).toBe(180);
      expect(response.body.data).toHaveProperty("_id");
    });

    it("should allow reception to save health metrics for any members", async () => {
      const response = await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          ...validPayload,
          notes: "monthly free measurement",
          member_id: memberProfileId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe("monthly free measurement");
      expect(response.body.data).toHaveProperty("_id");
    });

    it("should allow trainer to save health metrics for assigned members", async () => {
      await assignMemberToTrainer(memberProfileId, trainerId);
      const response = await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          ...validPayload,
          notes: "trainer measurement",
          member_id: memberProfileId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe("trainer measurement");
      expect(response.body.data).toHaveProperty("_id");
    });

    it("should deny trainer to save health metrics for unassigned members", async () => {
      const response = await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          ...validPayload,
          notes: "trainer measurement",
          member_id: member2ProfileId,
        })
        .expect(403);
    });

    it("should deny if member tries to save health metrics for another member", async () => {
      const payloadForOther = { ...validPayload, member_id: member2ProfileId };
      await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(payloadForOther)
        .expect(403);
    });

    it("should deny if anyone tries to save health metrics for deactivated member", async () => {
      const member = await createTestUserInDB("member", {
        email: "memberinactive@test.com",
      });
      const inactiveMemberProfileId = member.memberProfileId;
      await deactivateUser(member.email);
      const payloadForOther = {
        ...validPayload,
        member_id: inactiveMemberProfileId,
      };
      await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payloadForOther)
        .expect(403);
    });

    it("should deny if required fields are missing (e.g: weight_kg)", async () => {
      const payloadMissingWeight = { ...validPayload };
      delete payloadMissingWeight.weight_kg;
      await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payloadMissingWeight)
        .expect(400);
    });

    it("should return 404 if member does not exist", async () => {
      const payload = {
        ...validPayload,
        member_id: "00000000-0000-0000-0000-000000000000",
      };
      await request(app)
        .post("/api/v1/health-metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload)
        .expect(404);
    });

    it("should return 401 if no token provided", async () => {
      await request(app)
        .post("/api/v1/health-metrics")
        .send(validPayload)
        .expect(401);
    });
  });

  describe("GET /api/v1/health-metrics/member/:memberId/latest", () => {
    it("should allow admin to view any member's latest health metric", async () => {
      const response = await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        member_id: memberProfileId,
        weight_kg: 82,
      });
    });

    it("should allow reception to view any member's latest health metric", async () => {
      const response = await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        member_id: memberProfileId,
        weight_kg: 82,
      });
    });

    it("should allow members to view their own latest health metric", async () => {
      const response = await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        member_id: memberProfileId,
        weight_kg: 82,
      });
    });

    it("should allow trainer to view assigned member's latest health metric", async () => {
      const response = await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        member_id: memberProfileId,
        weight_kg: 82,
      });
    });

    it("should return 404 if no metrics found for member", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${member2ProfileId}/latest`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    it("should deny member from viewing another member's health metric", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should deny trainer from viewing unassigned member's health metric", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${trainer2Token}`)
        .expect(403);
    });

    it("should return 401 if no token", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/latest`)
        .expect(401);
    });
  });

  describe("GET /api/v1/health-metrics/member/:memberId/history", () => {
    it("should allow admin to view any member's health metrics history with pagination", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/history?page=1&limit=10`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data).toHaveProperty("pagination");
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    it("should allow reception to view any member's health metrics history", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/history?page=1&limit=10`,
        )
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should allow members to view their own health metrics history", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/history?page=1&limit=10`,
        )
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should allow trainer to view assigned member's health metrics history", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/history?page=1&limit=10`,
        )
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should deny trainer from viewing non-assigned member's health metrics history", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/history`)
        .set("Authorization", `Bearer ${trainer2Token}`)
        .expect(403);
    });

    it("should deny member from viewing another member's health metrics history", async () => {
      await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/history`)
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should return 200 with default pagination when no query params", async () => {
      const response = await request(app)
        .get(`/api/v1/health-metrics/member/${memberProfileId}/history`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
      });
    });

    it("should return 404 if member not found", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/00000000-0000-0000-0000-000000000000/history`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("GET /api/v1/health-metrics/member/:memberId/range", () => {
    let endDate = new Date();
    const startDate = endDate.toISOString().split("T")[0];
    endDate.setDate(endDate.getDate() + 7);
    endDate = endDate.toISOString().split("T")[0];
    console.log(startDate, endDate);

    it("should allow admin to view any member health metrics with in date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should allow reception to view any member health metrics with in date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should allow members to view their own health metrics with in date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should allow trainers to view their assigned members health metrics with in date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("count");
      expect(response.body.data).toHaveProperty("data");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("should deny members from viewing another members health metrics with in date range", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should deny trainer from viewing non-assigned members health metrics with in date range", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${trainer2Token}`)
        .expect(403);
    });

    it("should return 400 if startDate missing", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should return 400 if endDate missing", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should return 404 if member not found", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/00000000-0000-0000-0000-000000000000/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    it("should return 401 if no token", async () => {
      await request(app)
        .get(
          `/api/v1/health-metrics/member/${memberProfileId}/range?startDate=${startDate}&endDate=${endDate}`,
        )
        .expect(401);
    });
  });
});
