const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB } = require("../helpers/auth");
const {
  assignMemberToTrainer,
  createTrainerRating,
  createMealPlan,
  createWorkoutTemplate,
} = require("../helpers/trainer");
const knex = require("../../src/db/db");

// Check if MongoDB is available (skip template tests if not)
const isMongoAvailable = !!process.env.MONGODB_URI;

describe("Trainers API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    member2Token,
    trainer2Token;
  let trainerId, trainerUserId, trainer2Id;
  let memberProfileId, member2ProfileId;
  let classId;

  // Helper to extract data from response
  const extractData = (res) => res.body.data || res.body;

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

    // Create a class for the trainer (for schedule/roster tests)
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);
    const classResult = await knex.raw(
      `
      INSERT INTO classes (trainer_id, name, category, capacity, start_time, end_time, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
      `,
      [
        trainerId,
        "Test Class",
        "hiit",
        10,
        startTime.toISOString(),
        endTime.toISOString(),
        "Studio A",
      ],
    );
    classId = classResult.rows[0].id;
  });

  describe("GET /api/v1/trainers/me", () => {
    it("should return the current trainer profile", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/me")
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const profile = extractData(res);
      expect(profile.id).toBe(trainerId);
      expect(profile.user_id).toBe(trainerUserId);
      expect(profile.email).toBe("trainer@test.com");
      expect(profile.role).toBe("trainer");
    });

    it("should reject non-trainer (member)", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/me")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject non-trainer (admin)", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 if no token", async () => {
      const res = await request(app).get("/api/v1/trainers/me");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/trainers/:id", () => {
    it("should allow a trainer to view their own profile", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(extractData(res).id).toBe(trainerId);
    });

    it("should allow admin to view any trainer", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(extractData(res).id).toBe(trainerId);
    });

    it("should allow reception to view any trainer", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(extractData(res).id).toBe(trainerId);
    });

    it("should deny a member from viewing a trainer (unless assigned)", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow an assigned member to view their trainer", async () => {
      // Assign member to trainer
      await assignMemberToTrainer(memberProfileId, trainerId);

      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(extractData(res).id).toBe(trainerId);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/trainers/:id", () => {
    it("should allow a trainer to update their own profile", async () => {
      const res = await request(app)
        .patch(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          specialty: "Yoga & Pilates",
          hourly_rate: 60.65,
          bio: "Certified yoga instructor",
          is_available: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const updated = extractData(res);
      expect(updated.specialty).toBe("Yoga & Pilates");
      expect(updated.hourly_rate).toBe("60.65");
      expect(updated.bio).toBe("Certified yoga instructor");
      expect(updated.is_available).toBe(false);
    });

    it("should allow admin to update any trainer", async () => {
      const res = await request(app)
        .patch(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          bio: "Updated by admin",
          is_available: true,
        });

      expect(res.status).toBe(200);
      expect(extractData(res).bio).toBe("Updated by admin");
      expect(extractData(res).is_available).toBe(true);
    });

    it("should allow reception to update any trainer", async () => {
      const res = await request(app)
        .patch(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          specialty: "Reception updated",
        });

      expect(res.status).toBe(200);
      expect(extractData(res).specialty).toBe("Reception updated");
    });

    it("should deny a trainer from updating another trainer", async () => {
      const res = await request(app)
        .patch(`/api/v1/trainers/${trainer2Id}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          specialty: "Hacked",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .patch(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          years_of_experience: "not-a-number",
        });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .patch("/api/v1/trainers/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          specialty: "Doesn't matter",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers", () => {
    beforeAll(async () => {
      // Ensure there are trainers in the DB
      await createTestUserInDB("trainer", { email: "extra@test.com" });
    });

    it("should allow admin to list all trainers with pagination", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });

    it("should allow reception to list all trainers", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?page=1&limit=10")
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should deny a member from listing trainers", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?page=1&limit=10")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should filter by search (name)", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?search=Trainer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      const found = res.body.data.data.some(
        (t) => t.first_name === "Trainer" || t.last_name === "One",
      );
      expect(found).toBe(true);
    });

    it("should filter by is_available", async () => {
      // First, set a trainer to unavailable
      await request(app)
        .patch(`/api/v1/trainers/${trainerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ is_available: false });

      const res = await request(app)
        .get("/api/v1/trainers?is_available=false")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.data.some((t) => t.id === trainerId);
      expect(found).toBe(true);
    });

    it("should handle out-of-range page", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?page=9999&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toEqual([]);
    });

    it("should reject invalid limit", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?limit=-1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it("should cap limit at 100", async () => {
      const res = await request(app)
        .get("/api/v1/trainers?limit=200")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/trainers/:id/schedule", () => {
    it("should allow a trainer to view their own schedule", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schedule).toBeDefined();
      expect(Array.isArray(res.body.data.schedule)).toBe(true);
      expect(res.body.data.trainer.id).toBe(trainerId);
    });

    it("should allow admin to view any trainer schedule", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should allow reception to view any trainer schedule", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny a member from viewing schedule (unless assigned)", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
    });

    it("should allow an assigned member to view schedule", async () => {
      // Member already assigned in previous test
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should filter schedule by date", async () => {
      const date = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/schedule?date=${date}`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Should return at least the class we created
      expect(res.body.data.schedule.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000/schedule")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers/:id/roster", () => {
    beforeAll(async () => {
      // Ensure member is assigned to trainer
      await assignMemberToTrainer(memberProfileId, trainerId);
    });

    it("should allow a trainer to view their own roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/roster`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roster).toBeDefined();
      expect(Array.isArray(res.body.data.roster)).toBe(true);
      expect(res.body.data.count).toBeGreaterThan(0);
      // The assigned member should appear in the roster
      const found = res.body.data.roster.some(
        (m) => m.member_profile_id === memberProfileId,
      );
      expect(found).toBe(true);
    });

    it("should allow admin to view any trainer roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/roster`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it("should allow reception to view any trainer roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/roster`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny a member from viewing a trainer roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/roster`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000/roster")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers/:trainerId/classes/:classId/roster", () => {
    let bookingId;

    beforeAll(async () => {
      // Book the member into the class
      const bookRes = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: classId,
        });
      bookingId = bookRes.body.data?.bookingId;
    });

    it("should allow a trainer to view their own class roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/classes/${classId}/roster`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const found = res.body.data.some(
        (m) => m.member_profile_id === memberProfileId,
      );
      expect(found).toBe(true);
    });

    it("should allow admin to view any class roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/classes/${classId}/roster`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should allow reception to view any class roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/classes/${classId}/roster`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny a member from viewing a class roster", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/classes/${classId}/roster`)
        .set("Authorization", `Bearer ${memberToken}`);

      // Member can only view their own bookings, not the full roster
      expect(res.status).toBe(403);
    });

    it("should return 404 if trainer or class not found", async () => {
      const res = await request(app)
        .get(
          `/api/v1/trainers/00000000-0000-0000-0000-000000000000/classes/${classId}/roster`,
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers/:id/feedback", () => {
    beforeAll(async () => {
      // Create a rating for the trainer
      await createTrainerRating(memberProfileId, trainerId, 4);
      await createTrainerRating(memberProfileId, trainerId, 5);
    });

    it("should allow a trainer to view their own feedback", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/feedback`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.feedback)).toBe(true);
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it("should allow admin to view feedback", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/feedback`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it("should allow reception to view feedback", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/feedback`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny a member from viewing trainer feedback", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/feedback`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000/feedback")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/trainers/attendance/:memberProfileId", () => {
    it("should allow a trainer to record class training attendance", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/attendance/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          notes: "Focused on deadlifts",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.check_in_type).toBe("class_attendance");
      expect(res.body.data.notes).toBe("Focused on deadlifts");
    });

    it("should allow attendance without notes", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/attendance/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBeNull();
    });

    it("should deny a member from recording attendance", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/attendance/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          notes: "Invalid attempt",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny admin from recording attendance (trainer only)", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/attendance/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          notes: "Admin attempt",
        });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent member", async () => {
      const res = await request(app)
        .post(
          "/api/v1/trainers/attendance/00000000-0000-0000-0000-000000000000",
        )
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          notes: "Test",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/trainers/:trainerId/assign-trainer", () => {
    it("should allow admin to assign a trainer to a member", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: member2ProfileId,
          notes: "New client intake",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_profile_id).toBe(member2ProfileId);
      expect(res.body.data.trainer_id).toBe(trainerId);
      expect(res.body.data.notes).toBe("New client intake");
      expect(res.body.data.is_active).toBe(true);
    });

    it("should allow reception to assign a trainer to a member", async () => {
      // Create a new member
      const newMember = await createTestUserInDB("member", {
        email: "newmember@test.com",
      });
      const newMemberId = newMember.memberProfileId;

      const res = await request(app)
        .post(`/api/v1/trainers/${trainer2Id}/assign-trainer`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          member_profile_id: newMemberId,
          notes: "Reception assignment",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_profile_id).toBe(newMemberId);
      expect(res.body.data.trainer_id).toBe(trainer2Id);
    });

    it("should deny a trainer from assigning themselves to a member (admin/reception only)", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_profile_id: memberProfileId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny a member from assigning a trainer", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
        });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .post(
          "/api/v1/trainers/00000000-0000-0000-0000-000000000000/assign-trainer",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: memberProfileId,
        });

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent member", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: "00000000-0000-0000-0000-000000000000",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 if member_profile_id is missing", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/trainers/assignments/member/:memberProfileId", () => {
    it("should allow admin to unassign a trainer from a member", async () => {
      const res = await request(app)
        .delete(`/api/v1/trainers/assignments/member/${member2ProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_active).toBe(false);
    });

    it("should allow reception to unassign a trainer", async () => {
      // First assign a trainer to a new member
      const newMember = await createTestUserInDB("member", {
        email: "unassign@test.com",
      });
      const newMemberId = newMember.memberProfileId;

      await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-trainer`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: newMemberId,
        });

      const res = await request(app)
        .delete(`/api/v1/trainers/assignments/member/${newMemberId}`)
        .set("Authorization", `Bearer ${receptionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny a trainer from unassigning themselves", async () => {
      const res = await request(app)
        .delete(`/api/v1/trainers/assignments/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    it("should deny a member from unassigning their trainer", async () => {
      const res = await request(app)
        .delete(`/api/v1/trainers/assignments/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent member", async () => {
      const res = await request(app)
        .delete(
          "/api/v1/trainers/assignments/member/00000000-0000-0000-0000-000000000000",
        )
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 if no active assignment exists", async () => {
      // Create a member with no assignment
      const newMember = await createTestUserInDB("member", {
        email: "noassign@test.com",
      });
      const newMemberId = newMember.memberProfileId;

      const res = await request(app)
        .delete(`/api/v1/trainers/assignments/member/${newMemberId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/trainers/:trainerId/assign-plan", () => {
    let templateId1, templateId2;

    beforeAll(async () => {
      templateId1 = await createMealPlan({
        trainer_id: trainerId,
        name: "weekend meal",
      });
      templateId2 = await createWorkoutTemplate({
        trainer_id: trainerId,
        name: "Running",
      });
    });

    it("should allow a trainer to assigning a plan for assigned member only", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-plan`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_profile_id: memberProfileId,
          meal_plan_id: templateId1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.trainer_id).toBe(trainerId);
      expect(res.body.data.member_profile_id).toBe(memberProfileId);
    });

    it("should allow admin to assign a plan", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-plan`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: memberProfileId,
          workout_template_id: templateId2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.workout_template_id).toBe(templateId2);
    });

    it("should assign a workout template and meal plan successfully", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-plan`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: memberProfileId,
          workout_template_id: templateId2,
          meal_plan_id: templateId1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member_profile_id).toBe(memberProfileId);
      expect(res.body.data.workout_template_id).toBe(templateId2);
      expect(res.body.data.meal_plan_id).toBe(templateId1);
    });

    it("should return 400 if member_profile_id is missing", async () => {
      const res = await request(app)
        .post(`/api/v1/trainers/${trainerId}/assign-plan`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          workout_template_id: templateId2,
        });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .post(
          "/api/v1/trainers/00000000-0000-0000-0000-000000000000/assign-plan",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: memberProfileId,
          meal_plan_id: templateId1,
        });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers/:trainerId/templates", () => {
    beforeAll(async () => {
      await createWorkoutTemplate({
        trainer_id: trainerId,
        name: "exercise 1",
      });
      await createWorkoutTemplate({
        trainer_id: trainerId,
        name: "exercise 2",
      });
      await createWorkoutTemplate({
        trainer_id: trainerId,
        name: "exercise 3",
      });
    });

    it("should allow a trainer to view their own templates", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/templates`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should not allow a trainer to view another trainer templates", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/templates`)
        .set("Authorization", `Bearer ${trainer2Token}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to view trainer templates", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/templates`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should deny member from viewing trainer templates", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/templates`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000/templates")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/trainers/:trainerId/meal-plans", () => {
    beforeAll(async () => {
      await createMealPlan({ trainer_id: trainerId, name: "meal 1" });
      await createMealPlan({ trainer_id: trainerId, name: "meal 2" });
      await createMealPlan({ trainer_id: trainerId, name: "meal 3" });
    });

    it("should allow a trainer to view their own meal plans", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/meal-plans`)
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should not allow trainer to view another trainer meal plans", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/meal-plans`)
        .set("Authorization", `Bearer ${trainer2Token}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to view trainer meal plans", async () => {
      const res = await request(app)
        .get(`/api/v1/trainers/${trainerId}/meal-plans`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent trainer", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/00000000-0000-0000-0000-000000000000/meal-plans")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ADDITIONAL EDGE CASES
  describe("Trainers API - Additional Edge Cases", () => {
    it("should return 401 for all protected endpoints when no token", async () => {
      const endpoints = [
        "/api/v1/trainers/me",
        `/api/v1/trainers/${trainerId}`,
        `/api/v1/trainers/${trainerId}/schedule`,
        `/api/v1/trainers/${trainerId}/roster`,
        `/api/v1/trainers/${trainerId}/feedback`,
        "/api/v1/trainers?page=1&limit=10",
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
      }
    });

    it("should reject invalid UUID format for trainer ID", async () => {
      const res = await request(app)
        .get("/api/v1/trainers/not-a-uuid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
