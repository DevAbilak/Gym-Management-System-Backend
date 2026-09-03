const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB } = require("../helpers/auth");
const { createTestClass, getBookingById } = require("../helpers/booking");

describe("Bookings API", () => {
  let adminToken, memberToken, member2Token, trainerToken, receptionToken;
  let memberProfileId, member2ProfileId;
  let trainerId;
  let classId;

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
    trainerId = trainer.trainerProfileId;

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
    member2Token = member2.token;
    member2ProfileId = member2.memberProfileId;

    // Create a test class
    classId = await createTestClass(trainerId, { capacity: 2 });
  });

  describe("POST /api/v1/bookings (Book a Class)", () => {
    it("should allow a member to book a class for themselves", async () => {
      // Get a fresh class with capacity
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("confirmed");
    });

    it("should allow admin to book for any member", async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          member_profile_id: member2ProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("confirmed");
    });

    it("should allow reception to book for any member", async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${receptionToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("confirmed");
    });

    it("should deny a member from booking for another member", async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: member2ProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should deny a trainer from booking a class", async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should add to waitlist if class is full", async () => {
      // Create a class with capacity 1
      const fullClassId = await createTestClass(trainerId, { capacity: 1 });

      // First booking (confirmed)
      await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: fullClassId,
        });

      // Second booking (waitlisted)
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${member2Token}`)
        .send({
          member_profile_id: member2ProfileId,
          class_id: fullClassId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("waitlisted");
    });

    it("should return 409 if member already booked the class", async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });

      // First booking
      await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });

      // Duplicate booking
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/bookings/:id (Cancel Booking)", () => {
    let bookingId;

    beforeAll(async () => {
      // Create a booking
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });
      bookingId = res.body.data.bookingId;
    });

    it("should allow a member to cancel their own booking", async () => {
      // We need a fresh booking for this test
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });
      const bookRes = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });
      const id = bookRes.body.data.bookingId;

      const res = await request(app)
        .delete(`/api/v1/bookings/${id}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should deny a member from cancelling another member's booking", async () => {
      const res = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow admin to cancel any booking", async () => {
      const res = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for non-existent booking", async () => {
      const res = await request(app)
        .delete("/api/v1/bookings/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/bookings/member/:memberProfileId (Booking History)", () => {
    beforeAll(async () => {
      // Create some bookings for the member
      const class1 = await createTestClass(trainerId, { capacity: 5 });
      const class2 = await createTestClass(trainerId, { capacity: 5 });

      await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: class1,
        });

      await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: class2,
        });
    });

    it("should allow a member to view their own booking history", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("count");
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it("should deny a member from viewing another member's history", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/member/${member2ProfileId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow admin to view any member's history", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/member/${memberProfileId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/bookings/:id (Get Booking by ID)", () => {
    let bookingId;

    beforeAll(async () => {
      const freshClassId = await createTestClass(trainerId, { capacity: 5 });
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({
          member_profile_id: memberProfileId,
          class_id: freshClassId,
        });
      bookingId = res.body.data.bookingId;
    });

    it("should allow a member to view their own booking", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(bookingId);
    });

    it("should deny a member from viewing another member's booking", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${member2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow admin to view any booking", async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(bookingId);
    });
  });
});
