const request = require("supertest");
const app = require("../../src/app");
const {
  createTestUserInDB,
  deactivateUser,
  createUserProfile,
  loginUser,
} = require("../helpers/auth");
const { createTestClass, bookClass } = require("../helpers/booking");
const { createSubscription } = require("../helpers/checkin");
const { assignMemberToTrainer } = require("../helpers/trainer");

describe("Rating Module API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    trainer2Token,
    member2Token;
  let trainerId, trainerUserId, trainer2Id;
  let memberProfileId, member2ProfileId;
  let bookingId, classId;

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

    await createSubscription(memberProfileId);
  });

  describe("POST /api/v1/ratings/:type", () => {
    const facilityRatingPayload = {
      member_profile_id: memberProfileId,
      rating_stars: 4,
      comment: "good and clean facility",
    };

    beforeAll(async () => {
      classId = await createTestClass(trainerId);
      bookingId = await bookClass(memberProfileId, classId);
    });

    it("should allow member who have active subscription to rate facility", async () => {
      const response = await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(facilityRatingPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
      expect(response.body.data.rating_type).toBe("facility");
    });

    it("should deny member who already rated facility from rating again", async () => {
      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(facilityRatingPayload)
        .expect(409);
    });

    it("should allow member who have active subscription to rate trainer if they have a confirmed booking of that trainer's class", async () => {
      const response = await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
      expect(response.body.data.rating_type).toBe("trainer");
      expect(response.body.data.trainer_id).toBe(trainerId);
    });

    it("should deny member who already rated trainer from rating that trainer again", async () => {
      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(409);
    });

    it("should deny a member who didn't attend any session with trainer from rating that trainer", async () => {
      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(403);
    });

    it("should allow member who have active subscription to rate a class he/she attend", async () => {
      const response = await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member_profile_id).toBe(memberProfileId);
      expect(response.body.data.rating_type).toBe("class");
      expect(response.body.data.class_id).toBe(classId);
    });

    it("should deny member from rating a class he/she already rated that class", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(409);
    });

    it("should deny member from rating a class he/she don't attend", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);
    });

    it("should deny member who don't have active subscription from rating a class/trainer/facility", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${member2Token}`)
        .send(facilityRatingPayload)
        .expect(403);
    });

    it("should deny inactive member from rating a class/trainer/facility even if he/she has active subscription", async () => {
      const inactiveUser = await createTestUserInDB("member", {
        email: "inactiveuser@test.com",
      });
      const { email, token, memberProfileId } = inactiveUser;
      await createSubscription(memberProfileId);
      await deactivateUser(email);
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);
    });

    it("should return 404 if member profile is not found", async () => {
      const user = await createUserProfile({
        email: "user1@test.et",
      });

      const res = await loginUser(user.email, "TestPass123!");
      const token = res.accessToken;
      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating_stars: 4,
          comment: "good and clean facility",
          member_profile_id: "00000000-0000-0000-0000-000000000000",
        })
        .expect(404);
    });

    it("should return 400 if rating type is invalid type", async () => {
      await request(app)
        .post("/api/v1/ratings/something")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(400);
    });

    it("should return 401 for unauthenticated user", async () => {
      await request(app)
        .post("/api/v1/ratings/something")
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(401);
    });

    it("should deny admin from rating a class/trainer/facility", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(facilityRatingPayload)
        .expect(403);
    });

    it("should deny reception from rating a class/trainer/facility", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send(facilityRatingPayload)
        .expect(403);
    });

    it("should deny trainer from rating a class/trainer/facility", async () => {
      await request(app)
        .post("/api/v1/ratings/class")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({ ...facilityRatingPayload, class_id: classId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/trainer")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({ ...facilityRatingPayload, trainer_id: trainerId })
        .expect(403);

      await request(app)
        .post("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send(facilityRatingPayload)
        .expect(403);
    });
  });

  describe("GET /api/v1/ratings/trainer/:trainerId/average", () => {
    it("should allow admin to view average rating of any trainer", async () => {
      const response = await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow reception to view average rating of any trainer", async () => {
      const response = await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow trainers to view their own average rating", async () => {
      const response = await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow members to view their assigned trainers average rating", async () => {
      await assignMemberToTrainer(memberProfileId, trainerId);
      const response = await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should deny trainer from viewing another trainer's average rating", async () => {
      await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${trainer2Token}`)
        .expect(403);
    });

    it("should deny member from viewing non-assigned trainer's average rating", async () => {
      await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .set("Authorization", `Bearer ${member2Token}`)
        .expect(403);
    });

    it("should return 404 if trainer is not found", async () => {
      await request(app)
        .get(
          "/api/v1/ratings/trainer/00000000-0000-0000-0000-000000000000/average",
        )
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(404);
    });

    it("should return 401 for unauthenticated user", async () => {
      await request(app)
        .get(`/api/v1/ratings/trainer/${trainerId}/average`)
        .expect(401);
    });
  });

  describe("GET /api/v1/ratings/facility", () => {
    it("should allow admin to view average facility ratings", async () => {
      const response = await request(app)
        .get("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow reception to view average facility ratings", async () => {
      const response = await request(app)
        .get("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${receptionToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow member to view average facility ratings", async () => {
      const response = await request(app)
        .get("/api/v1/ratings/facility")
        .set("Authorization", `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });

    it("should allow unauthenticated user to view average facility ratings", async () => {
      const response = await request(app)
        .get("/api/v1/ratings/facility")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reviews).toBe("1");
      expect(response.body.data).toHaveProperty("average_rating");
    });
  });
});
