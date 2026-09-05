const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB, deactivateUser } = require("../helpers/auth");
const { assignMemberToTrainer } = require("../helpers/trainer");

describe("Progress API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    member2Token,
    trainer2Token,
    inactiveMemberToken;
  let trainerId, trainerUserId, trainer2Id, inactiveMemberId;
  let memberProfileId, member2ProfileId;
  let inactive_member_assignment_id, member_assignment_id;

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

    member_assignment_id = await assignMemberToTrainer(
      memberProfileId,
      trainerId,
    );

    const memberInactive = await createTestUserInDB("member", {
      email: "inactivemember@test.com",
    });

    inactiveMemberId = memberInactive.memberProfileId;
    inactiveMemberToken = memberInactive.token;
    inactive_member_assignment_id = await assignMemberToTrainer(
      inactiveMemberId,
      trainerId,
    );
    await deactivateUser(memberInactive.email);
  });

  describe("POST /api/v1/progress", () => {
    it("should allow member to add his\'s/her\'s progress", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_assignment_id,
          weight_kg: 82.5,
          body_fat_percentage: 15.2,
          muscle_mass_kg: 35,
          notes: "Post-workout measurement",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should allow admin to add any member progress", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_assignment_id,
          weight_kg: 82.5,
          body_fat_percentage: 15.8,
          muscle_mass_kg: 36,
          notes: "machine measurement",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should allow reception to add any member progress", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          member_assignment_id,
          weight_kg: 76.56,
          body_fat_percentage: 15.8,
          muscle_mass_kg: 36,
          notes: "manual measurement",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should allow trainer to add assigned member progress", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_assignment_id,
          weight_kg: 76.56,
          body_fat_percentage: 15.8,
          muscle_mass_kg: 36,
          notes: "trainer measurement",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should deny trainer from adding unassigned member progress", async () => {
      const new_member_assignment_id = await assignMemberToTrainer(
        member2ProfileId,
        trainer2Id,
      );

      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_assignment_id: new_member_assignment_id,
          weight_kg: 76.56,
          body_fat_percentage: 15.8,
          muscle_mass_kg: 36,
          notes: "trainer measurement",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny member from adding his\'s/her\'s progress without active assignment", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({
          member_assignment_id,
          weight_kg: 82.5,
          body_fat_percentage: 15.2,
          muscle_mass_kg: 35,
          notes: "Post-workout measurement",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny anyone from adding progress for deactivated member", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${inactiveMemberToken}`)
        .send({
          member_assignment_id: inactive_member_assignment_id,
          weight_kg: 82.5,
          body_fat_percentage: 15.2,
          muscle_mass_kg: 35,
          notes: "Post-workout measurement",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny member from adding his\'s/her\'s progress without active assignment", async () => {
      const res = await request(app)
        .post("/api/v1/progress")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({
          member_assignment_id,
          weight_kg: 82.5,
          body_fat_percentage: 15.2,
          muscle_mass_kg: 35,
          notes: "Post-workout measurement",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/progress/member/:memberProfileId", () => {
    it("should allow member to view his\'s/her\'s progress with pagination", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}?page=1&limit=10`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });

    it("should allow admin to view any member progress with pagination", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}?page=1&limit=5`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });

    it("should allow reception to view any member progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should allow trainer to view assigned member progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should allow member to view his\'s/her\'s progress even if they don\'t have active assignments", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${member2ProfileId}`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should deny member from viewing other member\'s progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny trainer from viewing unassigned member progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny anyone from viewing deactivatedMember progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${inactiveMemberId}`)
        .set("Authorization", `Bearer ${inactiveMemberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/progress/member/:memberProfileId/latest", () => {
    it("should allow member to view his\'s/her\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should allow admin to view any member\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
    });

    it("should allow reception to view any member\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
    });

    it("should allow trainer to view assigned member\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_assignment_id).toBe(member_assignment_id);
    });

    it("should allow member to view his\'s/her\'s latest progress even if they don\'t have active assignments", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${member2ProfileId}/latest`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe(null);
    });

    it("should deny member from viewing other member\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny trainer from viewing unassigned member\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${memberProfileId}/latest`)
        .set("Authorization", `Bearer ${trainer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny anyone from viewing deactivatedMember\'s latest progress", async () => {
      const res = await request(app)
        .get(`/api/v1/progress/member/${inactiveMemberId}/latest`)
        .set("Authorization", `Bearer ${inactiveMemberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
