const knex = require("../../src/db/db");
const { MealPlan, WorkoutTemplate } = require("../../src/models/index");

// Assign a member to a trainer (create an active assignment)
const assignMemberToTrainer = async (memberProfileId, trainerId) => {
  const result = await knex.raw(
    `
    INSERT INTO member_assignments (
      member_profile_id, trainer_id, assigned_at, is_active
    ) VALUES (?, ?, NOW(), true)
    RETURNING id
    `,
    [memberProfileId, trainerId],
  );
  return result.rows[0].id;
};

// Create a rating for a trainer
const createTrainerRating = async (memberProfileId, trainerId, stars = 5) => {
  const result = await knex.raw(
    `
    INSERT INTO ratings (
      member_profile_id, rating_type, trainer_id, rating_stars
    ) VALUES (?, 'trainer', ?, ?)
    RETURNING id
    `,
    [memberProfileId, trainerId, stars],
  );
  return result.rows[0].id;
};

const createMealPlan = async (payload) => {
  const {
    trainer_id,
    name,
    description,
    goal_type,
    calories_target,
    protein_g,
    carbs_g,
    fat_g,
    items,
  } = payload;
  const plan = new MealPlan({
    trainer_id,
    name,
    description: description || null,
    goal_type: goal_type || "maintenance",
    calories_target: calories_target || null,
    protein_g: protein_g || null,
    carbs_g: carbs_g || null,
    fat_g: fat_g || null,
    items: items || [],
  });

  await plan.save();
  return plan.id;
};

const createWorkoutTemplate = async (payload) => {
  const {
    trainer_id,
    name,
    description,
    difficulty,
    goal_type,
    duration_weeks,
    is_public,
    exercises,
  } = payload;

  const template = new WorkoutTemplate({
    trainer_id,
    name,
    description: description || null,
    difficulty: difficulty || "beginner",
    goal_type: goal_type || "general_fitness",
    duration_weeks: duration_weeks || null,
    is_public: is_public || false,
    exercises: exercises || [],
  });
  await template.save();

  return template.id;
};

const assignPlan = async (payload) => {
  const { memberProfileId, trainerId, workoutTemplateId, mealPlanId, notes } =
    payload;

  const assignment = await knex.raw(
    `
    INSERT INTO member_assignments (
      member_profile_id, trainer_id, workout_template_id, meal_plan_id,
      assigned_at, is_active, notes
    )
    VALUES (?, ?, ?, ?, NOW(), true, ?)
    RETURNING *
  `,
    [
      memberProfileId,
      trainerId,
      workoutTemplateId || null,
      mealPlanId || null,
      notes || null,
    ],
  );

  return assignment.rows[0].id;
};

const getActiveAssignment = async (memberProfileId, trainerId) => {
  const assignment = await knex.raw(
    `
    SELECT * FROM member_assignments
    WHERE member_profile_id = ? AND is_active = true AND trainer_id = ?
  `,
    [memberProfileId, trainerId],
  );

  return assignment.rows;
};

module.exports = {
  assignMemberToTrainer,
  createTrainerRating,
  createMealPlan,
  createWorkoutTemplate,
  assignPlan,
  getActiveAssignment,
};
