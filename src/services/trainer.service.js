const knex = require('../db/db');

// GET TRAINER PROFILE
const getTrainerByUserId = async (userId) => {
  const result = await knex.raw(
    `
    SELECT
      t.id,
      t.user_id,
      t.specialty,
      t.years_of_experience,
      t.certification,
      t.bio,
      t.hourly_rate,
      t.is_available,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.is_active
    FROM trainers t
    JOIN users u ON t.user_id = u.id
    WHERE t.user_id = ?
    `,
    [userId],
  );

  return result.rows[0];
};


// GET TRAINER DAILY SCHEDULE
const getTrainerSchedule = async (trainerId, date) => {
  const result = await knex.raw(
    `
    SELECT
      c.id,
      c.name,
      c.description,
      c.category,
      c.difficulty,
      c.capacity,
      c.current_bookings,
      c.start_time,
      c.end_time,
      c.location,
      c.status
    FROM classes c
    WHERE c.trainer_id = ?
      AND DATE(c.start_time) = COALESCE(?, CURRENT_DATE)
    ORDER BY c.start_time ASC
    `,
    [trainerId, date || null],
  );

  return result.rows;
};


// GET CLASS ROSTER
const getClassRoster = async (trainerId, classId) => {
  const result = await knex.raw(
    `
    SELECT
      cb.id AS booking_id,
      cb.booking_reference,
      cb.status,
      cb.booked_at,
      mp.id AS member_profile_id,
      mp.unique_member_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN member_profiles mp ON cb.member_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE c.id = ?
      AND c.trainer_id = ?
    ORDER BY cb.booked_at ASC
    `,
    [classId, trainerId],
  );

  return result.rows;
};


// GET MEMBER HEALTH PROFILE
const getMemberHealthProfile = async (memberProfileId) => {
  const memberResult = await knex.raw(
    `
    SELECT
      mp.id,
      mp.unique_member_id,
      mp.date_of_birth,
      mp.gender,
      mp.fitness_goal,
      u.first_name,
      u.last_name,
      u.email,
      u.phone
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.id = ?
    `,
    [memberProfileId],
  );

  const member = memberResult.rows[0];

  if (!member) {
    return null;
  }

  const healthResult = await knex.raw(
    `
    SELECT
      id,
      weight_kg,
      height_cm,
      bmi,
      body_fat_percentage,
      muscle_mass_kg,
      waist_cm,
      recorded_at
    FROM health_metrics
    WHERE member_profile_id = ?
    ORDER BY recorded_at DESC
    `,
    [memberProfileId],
  );

  return {
    member,
    health_metrics: healthResult.rows,
  };
};


// GET TRAINER WORKOUT TEMPLATES
const getWorkoutTemplates = async (trainerId) => {
  const result = await knex.raw(
    `
    SELECT
      id,
      trainer_id,
      name,
      description,
      difficulty,
      goal_type,
      duration_weeks,
      is_public,
      created_at,
      updated_at
    FROM workout_templates
    WHERE trainer_id = ?
       OR is_public = true
    ORDER BY created_at DESC
    `,
    [trainerId],
  );

  return result.rows;
};


// GET TRAINER MEAL PLANS
const getMealPlans = async (trainerId) => {
  const result = await knex.raw(
    `
    SELECT
      id,
      trainer_id,
      name,
      description,
      goal_type,
      calories_target,
      protein_g,
      carbs_g,
      fat_g,
      created_at,
      updated_at
    FROM meal_plans
    WHERE trainer_id = ?
    ORDER BY created_at DESC
    `,
    [trainerId],
  );

  return result.rows;
};


// ASSIGN WORKOUT / MEAL PLAN TO MEMBER
const assignPlan = async ({
  memberProfileId,
  trainerId,
  workoutTemplateId = null,
  mealPlanId = null,
  notes = null,
}) => {
  if (!workoutTemplateId && !mealPlanId) {
    throw new Error('Workout template or meal plan is required');
  }

  const result = await knex.raw(
    `
    INSERT INTO member_assignments (
      member_profile_id,
      trainer_id,
      workout_template_id,
      meal_plan_id,
      assigned_at,
      is_active,
      notes
    )
    VALUES (?, ?, ?, ?, NOW(), true, ?)
    RETURNING *
    `,
    [
      memberProfileId,
      trainerId,
      workoutTemplateId,
      mealPlanId,
      notes,
    ],
  );

  return result.rows[0];
};


// GET CLIENT FEEDBACK
const getClientFeedback = async (trainerId) => {
  const result = await knex.raw(
    `
    SELECT
      r.id,
      r.member_profile_id,
      r.rating_type,
      r.class_id,
      r.rating_stars,
      r.rating_dimension,
      r.comment,
      r.is_anonymous,
      r.created_at,
      u.first_name,
      u.last_name
    FROM ratings r
    JOIN member_profiles mp ON r.member_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE r.trainer_id = ?
    ORDER BY r.created_at DESC
    `,
    [trainerId],
  );

  return result.rows;
};


// RECORD PERSONAL TRAINING ATTENDANCE
const recordPersonalTrainingAttendance = async (
  memberProfileId,
  trainerUserId,
  notes = null,
) => {
  const result = await knex.raw(
    `
    INSERT INTO attendance_records (
      member_profile_id,
      check_in_type,
      checked_in_at,
      verified_by,
      notes
    )
    VALUES (?, 'personal_training', NOW(), ?, ?)
    RETURNING *
    `,
    [memberProfileId, trainerUserId, notes],
  );

  return result.rows[0];
};


module.exports = {
  getTrainerByUserId,
  getTrainerSchedule,
  getClassRoster,
  getMemberHealthProfile,
  getWorkoutTemplates,
  getMealPlans,
  assignPlan,
  getClientFeedback,
  recordPersonalTrainingAttendance,
};