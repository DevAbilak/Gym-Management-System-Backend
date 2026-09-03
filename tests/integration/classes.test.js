const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB } = require("../helpers/auth");
const knex = require("../../src/db/db");

describe("Classes API", () => {
  let adminToken, trainerToken, memberToken;
  let trainerId;
  let classId;

  beforeAll(async () => {
    // Create admin
    const admin = await createTestUserInDB("admin", {
      email: "admin@test.com",
    });
    adminToken = admin.token;

    // Create trainer
    const trainer = await createTestUserInDB("trainer", {
      email: "trainer@test.com",
    });
    trainerToken = trainer.token;
    trainerId = trainer.trainerProfileId;

    // Create member
    const member = await createTestUserInDB("member", {
      email: "member@test.com",
    });
    memberToken = member.token;
  });

  describe("GET /api/v1/classes (List Classes)", () => {
    let testDate;

    beforeAll(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
      testDate = futureDate.toISOString().split("T")[0];
      await knex.raw(
        `
        INSERT INTO classes (trainer_id, name, category, capacity, start_time, end_time)
        VALUES (?, ?, ?, ?, ?::timestamptz, ?::timestamptz)
        `,
        [
          trainerId,
          "Test Class",
          "hiit",
          10,
          `${testDate}T10:00:00Z`,
          `${testDate}T11:00:00Z`,
        ],
      );
    });

    it("should return list of classes (public, no auth)", async () => {
      const res = await request(app)
        .get("/api/v1/classes")
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("count");
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("should filter classes by date", async () => {
      // Use a fixed date to avoid timezone issues

      const res = await request(app)
        .get("/api/v1/classes")
        .query({ date: testDate });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/classes/:id", () => {
    beforeAll(async () => {
      // Insert a class
      const result = await knex.raw(
        `
        INSERT INTO classes (trainer_id, name, category, capacity, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id
        `,
        [
          trainerId,
          "Get Class Test",
          "yoga",
          15,
          new Date().toISOString(),
          new Date(Date.now() + 3600000).toISOString(),
        ],
      );
      classId = result.rows[0].id;
    });

    it("should return class by ID (public)", async () => {
      const res = await request(app).get(`/api/v1/classes/${classId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(classId);
      expect(res.body.data.name).toBe("Get Class Test");
    });

    it("should return 404 for non-existent class", async () => {
      const res = await request(app).get(
        "/api/v1/classes/00000000-0000-0000-0000-000000000000",
      );
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/classes (Create Class)", () => {
    it("should allow admin to create a class", async () => {
      const res = await request(app)
        .post("/api/v1/classes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          trainer_id: trainerId,
          name: "Admin Created Class",
          description: "Admin test class",
          category: "strength",
          difficulty: "intermediate",
          capacity: 20,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
          location: "Studio A",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.name).toBe("Admin Created Class");
    });

    it("should allow trainer to create a class (for themselves)", async () => {
      const res = await request(app)
        .post("/api/v1/classes")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          trainer_id: trainerId,
          name: "Trainer Created Class",
          category: "hiit",
          capacity: 10,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainer_id).toBe(trainerId);
    });

    it("should deny trainer from creating a class for another trainer", async () => {
      // Create another trainer
      const anotherTrainer = await createTestUserInDB("trainer", {
        email: "another@test.com",
      });
      const anotherTrainerId = anotherTrainer.trainerProfileId;

      const res = await request(app)
        .post("/api/v1/classes")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          trainer_id: anotherTrainerId,
          name: "Unauthorized Class",
          capacity: 10,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny member from creating a class", async () => {
      const res = await request(app)
        .post("/api/v1/classes")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          trainer_id: trainerId,
          name: "Member Class",
          capacity: 10,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject if end_time is before start_time", async () => {
      const res = await request(app)
        .post("/api/v1/classes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          trainer_id: trainerId,
          name: "Invalid Times",
          capacity: 10,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 86400000 - 3600000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/classes/:id (Update Class)", () => {
    let classToUpdateId;

    beforeAll(async () => {
      // Insert a class for admin to update
      const result = await knex.raw(
        `
        INSERT INTO classes (trainer_id, name, capacity, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
        `,
        [
          trainerId,
          "To Update",
          15,
          new Date().toISOString(),
          new Date(Date.now() + 3600000).toISOString(),
        ],
      );
      classToUpdateId = result.rows[0].id;
    });

    it("should allow admin to update a class", async () => {
      const res = await request(app)
        .patch(`/api/v1/classes/${classToUpdateId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated by Admin",
          capacity: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated by Admin");
      expect(res.body.data.capacity).toBe(25);
    });

    it("should allow trainer to update their own class", async () => {
      // Create a class owned by the trainer
      const result = await knex.raw(
        `
        INSERT INTO classes (trainer_id, name, capacity, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
        `,
        [
          trainerId,
          "Trainer Own Class",
          20,
          new Date().toISOString(),
          new Date(Date.now() + 3600000).toISOString(),
        ],
      );
      const ownClassId = result.rows[0].id;

      const res = await request(app)
        .patch(`/api/v1/classes/${ownClassId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          name: "Updated by Trainer",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated by Trainer");
    });

    it("should deny trainer from updating another trainer's class", async () => {
      // Create another trainer
      const anotherTrainer = await createTestUserInDB("trainer", {
        email: "updater@test.com",
      });
      const anotherToken = anotherTrainer.token;

      const res = await request(app)
        .patch(`/api/v1/classes/${classToUpdateId}`)
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          name: "Hacked by Another Trainer",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny member from updating a class", async () => {
      const res = await request(app)
        .patch(`/api/v1/classes/${classToUpdateId}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          name: "Member Update",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
