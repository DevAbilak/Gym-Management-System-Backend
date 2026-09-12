const request = require("supertest");
const app = require("../../src/app");
const { createTestUserInDB, deactivateUser } = require("../helpers/auth");
const { assignMemberToTrainer } = require("../helpers/trainer");

describe("Templates Module API", () => {
  let adminToken,
    receptionToken,
    trainerToken,
    memberToken,
    trainer2Token,
    member2Token;
  let trainerId, trainerUserId, trainer2Id;
  let memberProfileId, member2ProfileId;
  let createdWorkoutTemplateId, createdMealPlanId;

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

  // WORKOUT TEMPLATES
  describe("Workout Templates", () => {
    const validWorkoutPayload = {
      name: "Push/Pull/Legs - Beginner",
      description: "3-day split for beginners",
      difficulty: "beginner",
      goal_type: "muscle_building",
      duration_weeks: 8,
      is_public: false,
      exercises: [
        {
          day_number: 1,
          exercise_name: "Bench Press",
          sets: 4,
          reps_per_set: 10,
          weight_kg: 60,
          rest_seconds: 60,
        },
        {
          day_number: 1,
          exercise_name: "Pull-ups",
          sets: 3,
          reps_per_set: 8,
          weight_kg: 0,
          rest_seconds: 90,
        },
      ],
    };

    describe("POST /api/v1/templates/workout", () => {
      it("should allow trainer to create a workout template for themselves", async () => {
        const response = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          trainer_id: trainerId,
          name: validWorkoutPayload.name,
          description: validWorkoutPayload.description,
          difficulty: validWorkoutPayload.difficulty,
          goal_type: validWorkoutPayload.goal_type,
          duration_weeks: validWorkoutPayload.duration_weeks,
          is_public: validWorkoutPayload.is_public,
          exercises: validWorkoutPayload.exercises,
        });
        expect(response.body.data).toHaveProperty("_id");
        expect(response.body.data).toHaveProperty("created_at");
        expect(response.body.data).toHaveProperty("updated_at");
        createdWorkoutTemplateId = response.body.data._id; // save for later
      });

      it("should allow admin to create a workout template", async () => {
        const response = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("_id");
      });

      it("should deny trainer from creating a workout template for other trainers", async () => {
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(403);
      });

      it("should deny anyone from creating a workout template for deactivated trainers", async () => {
        const trainerDeactivated = await createTestUserInDB("trainer", {
          email: "trainerdeactivated@test.com",
          first_name: "Trainer",
          last_name: "deactivated",
        });
        const trainerDeactivatedId = trainerDeactivated.trainerProfileId;
        await deactivateUser("trainerdeactivated@test.com");
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerDeactivatedId })
          .expect(403);
      });

      it("should deny member from creating a workout template", async () => {
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${memberToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(403);
      });

      it("should deny reception from creating a workout template", async () => {
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${receptionToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(403);
      });

      it("should return 400 if required fields missing (e.g., name)", async () => {
        const payload = { ...validWorkoutPayload };
        delete payload.name;
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...payload, trainer_id: trainerId })
          .expect(400);
      });

      it("should return 404 if trainer does not exist", async () => {
        const nonExistentTrainerId = "00000000-0000-0000-0000-000000000000";
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validWorkoutPayload, trainer_id: nonExistentTrainerId })
          .expect(404);
      });

      it("should return 401 if no token is provided", async () => {
        await request(app)
          .post("/api/v1/templates/workout")
          .send({ ...validWorkoutPayload, trainer_id: trainerId })
          .expect(401);
      });
    });

    describe("GET /api/v1/templates/workout", () => {
      beforeAll(async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId });
        createdWorkoutTemplateId = res.body.data._id;

        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({
            ...validWorkoutPayload,
            trainer_id: trainer2Id,
            is_public: true,
          });
      });

      it("should allow admin to list all workout templates", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
      });

      it("should allow trainer to list their own templates only if not allowing include public in query", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(
          response.body.data.data.some(
            (t) => t._id === createdWorkoutTemplateId,
          ),
        ).toBe(true);
        response.body.data.data.forEach((t) => {
          expect(t.trainer_id).toBe(trainerId);
        });
      });

      it("should allow trainer to list their own templates (including public)", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout?include_public=true")
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        // The trainer should see at least the one they created
        expect(
          response.body.data.data.some(
            (t) => t._id === createdWorkoutTemplateId,
          ),
        ).toBe(true);
        response.body.data.data.some((t) => t.trainer_id === trainer2Id);
      });

      it("should allow member to list public templates only", async () => {
        // We'll create a public template first
        const publicPayload = {
          ...validWorkoutPayload,
          name: "Public Template",
          is_public: true,
          trainer_id: trainerId,
        };
        await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send(publicPayload);

        const response = await request(app)
          .get("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(200);

        const templates = response.body.data.data;
        expect(response.body.success).toBe(true);
        expect(Array.isArray(templates)).toBe(true);
        templates.forEach((t) => {
          expect(t.is_public).toBe(true);
        });
        // Member should see the public template but not the private one
        const allIds = templates.map((t) => t._id);
        expect(allIds).not.toContain(createdWorkoutTemplateId); // private
      });

      it("should filter by goal_type", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout?goal_type=muscle_building")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        // All returned should have goal_type = muscle_building
        response.body.data.data.forEach((t) => {
          expect(t.goal_type).toBe("muscle_building");
        });
      });

      it("should filter by difficulty", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout?difficulty=beginner")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        response.body.data.data.forEach((t) => {
          expect(t.difficulty).toBe("beginner");
        });
      });

      it("should support pagination", async () => {
        const response = await request(app)
          .get("/api/v1/templates/workout?page=1&limit=5")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(response.body.data).toHaveProperty("pagination");
        expect(response.body.data.pagination.limit).toBe(5);
      });

      it("should deny if no token provided", async () => {
        await request(app).get("/api/v1/templates/workout").expect(401);
      });
    });

    describe("GET /api/v1/templates/workout/:id", () => {
      it("should allow admin to get any template by ID", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdWorkoutTemplateId);
        expect(response.body.data.name).toBe(validWorkoutPayload.name);
      });

      it("should allow reception to get any template by ID", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdWorkoutTemplateId);
        expect(response.body.data.name).toBe(validWorkoutPayload.name);
      });

      it("should allow trainer to get their own template", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdWorkoutTemplateId);
      });

      it("should allow trainer to get a public template even if not theirs", async () => {
        const publicPayload = {
          ...validWorkoutPayload,
          name: "Trainer2 Public",
          is_public: true,
          trainer_id: trainer2Id,
        };
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send(publicPayload);
        const publicId = res.body.data._id;

        const response = await request(app)
          .get(`/api/v1/templates/workout/${publicId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(publicId);
      });

      it("should deny trainer from getting another trainer's private template", async () => {
        await request(app)
          .get(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${trainer2Token}`)
          .expect(403);
      });

      it("should deny member from getting a private template", async () => {
        await request(app)
          .get(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(403);
      });

      it("should allow member to get a public template", async () => {
        // Create a public template
        const publicPayload = {
          ...validWorkoutPayload,
          name: "Public For Member",
          is_public: true,
          trainer_id: trainerId,
        };
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send(publicPayload);
        const publicId = res.body.data._id;

        const response = await request(app)
          .get(`/api/v1/templates/workout/${publicId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(publicId);
      });

      it("should return 404 if template not found", async () => {
        await request(app)
          .get("/api/v1/templates/workout/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe("PATCH /api/v1/templates/workout/:id", () => {
      const updatePayload = {
        name: "Updated Workout Template",
        difficulty: "intermediate",
        exercises: [
          {
            day_number: 1,
            exercise_name: "Incline Bench Press",
            sets: 5,
            reps_per_set: 8,
            weight_kg: 70,
            rest_seconds: 90,
          },
        ],
      };

      it("should allow trainer to update their own template", async () => {
        const response = await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .send(updatePayload)
          .expect(200);

        const exercises = { ...updatePayload.exercises };
        exercises[0].notes = null;

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updatePayload.name);
        expect(response.body.data.difficulty).toBe(updatePayload.difficulty);
        expect(response.body.data.exercises).toEqual([exercises[0]]);
      });

      it("should allow admin to update any template", async () => {
        const adminUpdate = { name: "Admin Updated" };
        const response = await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(adminUpdate)
          .expect(200);

        expect(response.body.data.name).toBe("Admin Updated");
      });

      it("should allow reception to update any template", async () => {
        const adminUpdate = { name: "reception Updated" };
        const response = await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(adminUpdate)
          .expect(200);

        expect(response.body.data.name).toBe("reception Updated");
      });

      it("should deny trainer from updating another trainer's template", async () => {
        await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({ name: "Hacked" })
          .expect(403);
      });

      it("should deny member from updating any template", async () => {
        await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .send({ name: "Member" })
          .expect(403);
      });

      it("should return 404 if template not found", async () => {
        await request(app)
          .patch("/api/v1/templates/workout/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "New" })
          .expect(404);
      });

      it("should return 400 for invalid update data", async () => {
        await request(app)
          .patch(`/api/v1/templates/workout/${createdWorkoutTemplateId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ difficulty: "expert" })
          .expect(400);
      });
    });

    describe("DELETE /api/v1/templates/workout/:id", () => {
      let templateToDeleteId;

      beforeAll(async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId });
        templateToDeleteId = res.body.data._id;
      });

      it("should allow trainer to delete their own template", async () => {
        await request(app)
          .delete(`/api/v1/templates/workout/${templateToDeleteId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);
        // Verify it's gone
        await request(app)
          .get(`/api/v1/templates/workout/${templateToDeleteId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });

      it("should allow admin to delete any template", async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        // Verify it's gone
        await request(app)
          .get(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });

      it("should allow reception to delete any template", async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(200);

        // Verify it's gone
        await request(app)
          .get(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(404);
      });

      it("should deny trainer from deleting another trainer's template", async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({ ...validWorkoutPayload, trainer_id: trainer2Id });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(403);
      });

      it("should deny member from deleting any template", async () => {
        const res = await request(app)
          .post("/api/v1/templates/workout")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validWorkoutPayload, trainer_id: trainerId });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/workout/${id}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(403);
      });

      it("should return 404 if template not found", async () => {
        await request(app)
          .delete("/api/v1/templates/workout/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  // MEAL PLANS
  describe("Meal Plans", () => {
    const validMealPayload = {
      name: "Weight Loss - 1800 Cal",
      description: "Balanced meal plan for fat loss",
      goal_type: "weight_loss",
      calories_target: 1800,
      protein_g: 150,
      carbs_g: 180,
      fat_g: 60,
      items: [
        {
          day_number: 1,
          meal_name: "Breakfast",
          food_item: "Oatmeal",
          quantity: "80g",
          calories: 300,
          protein_g: 10,
          carbs_g: 50,
          fat_g: 5,
        },
        {
          day_number: 1,
          meal_name: "Lunch",
          food_item: "Grilled Chicken Salad",
          quantity: "200g",
          calories: 400,
          protein_g: 40,
          carbs_g: 20,
          fat_g: 15,
        },
      ],
    };

    let createdMealPlanId;

    describe("POST /api/v1/templates/meal", () => {
      it("should allow trainer to create a meal plan", async () => {
        const response = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          trainer_id: trainerId,
          name: validMealPayload.name,
          description: validMealPayload.description,
          goal_type: validMealPayload.goal_type,
          calories_target: validMealPayload.calories_target,
          protein_g: validMealPayload.protein_g,
          carbs_g: validMealPayload.carbs_g,
          fat_g: validMealPayload.fat_g,
          items: validMealPayload.items,
        });
        expect(response.body.data).toHaveProperty("_id");
        createdMealPlanId = response.body.data._id;
      });

      it("should allow admin to create a meal plan", async () => {
        const response = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId })
          .expect(201);
        expect(response.body.success).toBe(true);
      });

      it("should deny reception from creating a meal plan", async () => {
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${receptionToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId })
          .expect(403);
      });

      it("should deny member from creating a meal plan", async () => {
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${memberToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId })
          .expect(403);
      });

      it("should deny trainer from creating a meal plan for another trainer", async () => {
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainer2Id })
          .expect(403);
      });

      it("should deny anyone from creating a meal plan for deactivated trainer", async () => {
        const trainerDeactivated = await createTestUserInDB("trainer", {
          email: "trainerdeactivated2@test.com",
          first_name: "Trainer",
          last_name: "deactivated",
        });
        const trainerDeactivatedId = trainerDeactivated.trainerProfileId;
        await deactivateUser("trainerdeactivated2@test.com");
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validMealPayload, trainer_id: trainerDeactivatedId })
          .expect(403);
      });

      it("should return 400 if required fields missing (e.g., name)", async () => {
        const payload = { ...validMealPayload };
        delete payload.name;
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...payload, trainer_id: trainerId })
          .expect(400);
      });

      it("should return 404 if trainer is not found", async () => {
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            ...validMealPayload,
            trainer_id: "00000000-0000-0000-0000-000000000000",
          })
          .expect(404);
      });
    });

    describe("GET /api/v1/templates/meal", () => {
      beforeAll(async () => {
        await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId, is_public: true })
          .expect(201);
      });

      it("should allow admin to list all meal plans", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
      });

      it("should allow reception to list all meal plans", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
      });

      it("should allow trainer to list their own meal plans only if public included isn't in query", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        // Should include the one we created
        expect(
          response.body.data.data.some((m) => m._id === createdMealPlanId),
        ).toBe(true);
        response.body.data.data.forEach((m) => m.trainer_id === trainerId);
      });

      it("should allow trainer to list their own and public meal plans if public included is in query", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal?public_included=true")
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        // Should include the one we created
        expect(
          response.body.data.data.some((m) => m._id === createdMealPlanId),
        ).toBe(true);
        response.body.data.data.forEach((m) => m.is_public === true);
      });

      it("should allow member to list public meal plans only", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(response.body.data.data.length).toBeGreaterThan(0);
        response.body.data.data.forEach((m) => m.is_public === true);
      });

      it("should filter by goal_type", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal?goal_type=weight_loss")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);
        response.body.data.data.forEach((m) => {
          expect(m.goal_type).toBe("weight_loss");
        });
      });

      it("should support pagination", async () => {
        const response = await request(app)
          .get("/api/v1/templates/meal?page=1&limit=5")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(response.body.data).toHaveProperty("pagination");
        expect(response.body.data.pagination.limit).toBe(5);
      });

      it("should return 401 if no token", async () => {
        await request(app).get("/api/v1/templates/meal").expect(401);
      });
    });

    describe("GET /api/v1/templates/meal/:id", () => {
      let publicMealPlanId;

      beforeAll(async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId, is_public: true })
          .expect(201);
        publicMealPlanId = res.body.data._id;
      });

      it("should allow admin to get any meal plan by ID", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdMealPlanId);
        expect(response.body.data.name).toBe(validMealPayload.name);
      });

      it("should allow reception to get any meal plan by ID", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdMealPlanId);
        expect(response.body.data.name).toBe(validMealPayload.name);
      });

      it("should allow trainer to get their own meal plan", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(createdMealPlanId);
      });

      it("should allow trainer to get public meal plan by ID", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/meal/${publicMealPlanId}`)
          .set("Authorization", `Bearer ${trainer2Token}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(publicMealPlanId);
        expect(response.body.data.is_public).toBe(true);
      });

      it("should deny trainer from getting another trainer's private meal plan by ID", async () => {
        await request(app)
          .get(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${trainer2Token}`)
          .expect(403);
      });

      it("should deny member from getting private meal plan by ID", async () => {
        await request(app)
          .get(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(403);
      });

      it("should allow member to get public meal plan only", async () => {
        const response = await request(app)
          .get(`/api/v1/templates/meal/${publicMealPlanId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(publicMealPlanId);
        expect(response.body.data.is_public).toBe(true);
      });

      it("should return 404 if meal plan not found", async () => {
        await request(app)
          .get("/api/v1/templates/meal/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe("PATCH /api/v1/templates/meal/:id", () => {
      const updateMealPayload = {
        name: "Updated Meal Plan",
        calories_target: 2000,
        items: [
          {
            day_number: 1,
            meal_name: "Breakfast",
            food_item: "Oatmeal",
            quantity: "100g",
            calories: 350,
            protein_g: 12,
            carbs_g: 60,
            fat_g: 5,
          },
        ],
      };

      it("should allow trainer to update their own meal plan", async () => {
        const response = await request(app)
          .patch(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .send(updateMealPayload)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateMealPayload.name);
        expect(response.body.data.calories_target).toBe(
          updateMealPayload.calories_target,
        );
        expect(response.body.data.items).toEqual(updateMealPayload.items);
      });

      it("should allow admin to update any meal plan", async () => {
        const adminUpdate = { name: "Admin Meal" };
        const response = await request(app)
          .patch(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(adminUpdate)
          .expect(200);
        expect(response.body.data.name).toBe("Admin Meal");
      });

      it("should allow reception to update any meal plan", async () => {
        const adminUpdate = { name: "reception Meal" };
        const response = await request(app)
          .patch(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .send(adminUpdate)
          .expect(200);
        expect(response.body.data.name).toBe("reception Meal");
      });

      it("should deny trainer from updating another trainer's meal plan", async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({ ...validMealPayload, trainer_id: trainer2Id });
        const id = res.body.data._id;

        await request(app)
          .patch(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ name: "Hack" })
          .expect(403);
      });

      it("should deny member from updating any meal plan", async () => {
        await request(app)
          .patch(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .send({ name: "Member" })
          .expect(403);
      });

      it("should return 404 if meal plan not found", async () => {
        await request(app)
          .patch("/api/v1/templates/meal/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });

      it("should return 400 for invalid enum", async () => {
        await request(app)
          .patch(`/api/v1/templates/meal/${createdMealPlanId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ goal_type: "bulking" })
          .expect(400);
      });
    });

    describe("DELETE /templates/meal/:id", () => {
      let mealToDeleteId;

      beforeAll(async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId });
        mealToDeleteId = res.body.data._id;
      });

      it("should allow trainer to delete their own meal plan", async () => {
        await request(app)
          .delete(`/api/v1/templates/meal/${mealToDeleteId}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(200);
        // Verify deletion
        await request(app)
          .get(`/api/v1/templates/meal/${mealToDeleteId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });

      it("should allow admin to delete any meal plan", async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion
        await request(app)
          .get(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });

      it("should allow reception to delete any meal plan", async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainerToken}`)
          .send({ ...validMealPayload, trainer_id: trainerId });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(200);

        // Verify deletion
        await request(app)
          .get(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${receptionToken}`)
          .expect(404);
      });

      it("should deny trainer from deleting another trainer's meal plan", async () => {
        const res = await request(app)
          .post("/api/v1/templates/meal")
          .set("Authorization", `Bearer ${trainer2Token}`)
          .send({ ...validMealPayload, trainer_id: trainer2Id });
        const id = res.body.data._id;

        await request(app)
          .delete(`/api/v1/templates/meal/${id}`)
          .set("Authorization", `Bearer ${trainerToken}`)
          .expect(403);
      });

      it("should deny member from deleting any meal plan", async () => {
        await request(app)
          .delete(`/api/v1/templates/meal/${mealToDeleteId}`)
          .set("Authorization", `Bearer ${memberToken}`)
          .expect(403);
      });

      it("should return 404 if meal plan not found", async () => {
        await request(app)
          .delete("/api/v1/templates/meal/6a98036a7acc0342c6c016ba")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });
});
