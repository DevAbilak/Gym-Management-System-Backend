const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const TRAINER_CACHE_TTL = 300; // 5 minutes
const SCHEDULE_CACHE_TTL = 120; // 2 minutes
const ROSTER_CACHE_TTL = 300; // 5 minutes
const FEEDBACK_CACHE_TTL = 600; // 10 minutes

// HELPER FUNCTION: INVALIDATE TRAINER SCHEDULE CACHE
const invalidateTrainerScheduleCache = async (trainerId) => {
  // Delete all schedule caches for this trainer (using pattern matching)
  const keys = await redisClient.keys(`trainer:schedule:${trainerId}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

// GET TRAINER BY ID
const getTrainerById = async (id) => {
  const cacheKey = `trainer:profile:${id}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT 
      tr.*,
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role
    FROM trainers tr
    JOIN users u ON tr.user_id = u.id
    WHERE tr.id = ?
  `,
    [id],
  );

  const trainer = result.rows[0];

  if (trainer) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(trainer),
      'EX',
      TRAINER_CACHE_TTL,
    );
  }

  return trainer;
};

// GET TRAINER PROFILE
const getTrainerByUserId = async (userId) => {
  const cacheKey = `trainer:user:${userId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT
      tr.*,
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.is_active,
      u.role
    FROM trainers tr
    JOIN users u ON tr.user_id = u.id
    WHERE tr.user_id = ?
    `,
    [userId],
  );

  const trainer = result.rows[0];

  if (trainer) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(trainer),
      'EX',
      TRAINER_CACHE_TTL,
    );
  }

  return trainer;
};

// GET ALL TRAINERS
const getAllTrainers = async (filters = {}) => {
  const { page = 1, limit = 20, search, is_available } = filters;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(
      '(u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ? OR tr.specialty ILIKE ?)',
    );
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (is_available !== undefined) {
    conditions.push('tr.is_available = ?');
    params.push(is_available === 'true' || is_available === true);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await knex.raw(
    `
    SELECT 
      tr.id,
      tr.user_id,
      tr.specialty,
      tr.years_of_experience,
      tr.certification,
      tr.hourly_rate,
      tr.bio,
      tr.is_available,
      tr.created_at,
      tr.updated_at,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role
    FROM trainers tr
    JOIN users u ON tr.user_id = u.id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `,
    [...params, limit, offset],
  );

  const countResult = await knex.raw(
    `
    SELECT COUNT(*) AS total
    FROM trainers tr
    JOIN users u ON tr.user_id = u.id
    ${whereClause}
  `,
    params,
  );

  const total = parseInt(countResult.rows[0]?.total || 0);

  return {
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// UPDATE TRAINER
const updateTrainer = async (id, updates) => {
  const allowedFields = [
    'specialty',
    'years_of_experience',
    'certification',
    'hourly_rate',
    'bio',
    'is_available',
  ];

  const setClauses = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  const query = `
    UPDATE trainers
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = ?
    RETURNING *
  `;

  const result = await knex.raw(query, values);
  const updatedTrainer = result.rows[0];

  if (updatedTrainer) {
    // Invalidate all cached representations
    await redisClient.del(`trainer:profile:${id}`);
    await redisClient.del(`trainer:user:${updatedTrainer.user_id}`);
    await invalidateTrainerScheduleCache(id);
    await redisClient.del(`trainer:roster:${id}`);
  }
  return updatedTrainer;
};

// GET TRAINER DAILY SCHEDULE
const getTrainerSchedule = async (trainerId, date = null) => {
  const dateFilter = date ? date : 'all';
  const cacheKey = `trainer:schedule:${trainerId}:${dateFilter}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const dateSQL = date ? `AND DATE(c.start_time) = '${date}'` : '';

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
      (c.capacity - c.current_bookings) AS available_spots,
      c.start_time,
      c.end_time,
      c.location,
      c.status,
      COUNT(cb.id) AS confirmed_bookings
    FROM classes c
    LEFT JOIN class_bookings cb ON c.id = cb.class_id AND cb.status = 'confirmed'
    WHERE c.trainer_id = ? AND c.status = 'scheduled'
    ${dateSQL}
    GROUP BY c.id
    ORDER BY c.start_time ASC
    `,
    [trainerId],
  );

  const schedule = result.rows;
  if (schedule) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(schedule),
      'EX',
      SCHEDULE_CACHE_TTL,
    );
  }

  return schedule;
};

// GET TRAINER ROSTER (Assigned Members)
const getTrainerRoster = async (trainerId) => {
  const cacheKey = `trainer:roster:${trainerId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT DISTINCT
      mp.id AS member_profile_id,
      mp.unique_member_id,
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      ma.assigned_at,
      ma.is_active,
      wt.name AS active_workout_plan,
      mp.fitness_goal,
      s.status AS subscription_status
    FROM member_assignments ma
    JOIN member_profiles mp ON ma.member_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN subscriptions s ON s.member_profile_id = mp.id AND s.status = 'active'
    LEFT JOIN workout_templates wt ON ma.workout_template_id = wt.id
    WHERE ma.trainer_id = ? AND ma.is_active = true
    ORDER BY u.first_name ASC
  `,
    [trainerId],
  );
  const roster = result.rows;

  if (roster) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(roster),
      'EX',
      ROSTER_CACHE_TTL,
    );
  }
  return roster;
};

// DELETE TRAINER (Admin only)
const deactivateTrainer = async (id) => {
  // Check if trainer exists
  const trainer = await getTrainerById(id);
  if (!trainer) {
    return null;
  }

  // Soft delete: deactivate the user account
  await knex.raw(
    'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?',
    [trainer.user_id],
  );
  // Also set trainer is_available to false
  const result = await knex.raw(
    `
    UPDATE trainers SET is_available = false, updated_at = NOW()
    WHERE id = ?
    RETURNING *
  `,
    [id],
  );

  // Invalidate all caches
  await redisClient.del(`trainer:profile:${id}`);
  await redisClient.del(`trainer:user:${trainer.user_id}`);
  await invalidateTrainerScheduleCache(id);
  await redisClient.del(`trainer:roster:${trainer.id}`);

  return result.rows[0];
};

// REACTIVATE TRAINER (Admin only)
const reactivateTrainer = async (id) => {
  const trainer = await getTrainerById(id);
  if (!trainer) {
    return null;
  }

  await knex.raw(
    'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ?',
    [trainer.user_id],
  );
  const result = await knex.raw(
    `
    UPDATE trainers SET is_available = true, updated_at = NOW()
    WHERE id = ?
    RETURNING *
  `,
    [id],
  );

  // Invalidate all caches
  await redisClient.del(`trainer:profile:${id}`);
  await redisClient.del(`trainer:user:${trainer.user_id}`);
  await invalidateTrainerScheduleCache(id);
  await redisClient.del(`trainer:roster:${trainer.id}`);

  return result.rows[0];
};

// GET CLASS ROSTER
const getClassRoster = async (trainerId, classId) => {
  const cacheKey = `trainer:class:${classId}:roster`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT
      c.id AS class_id,
      c.name AS class_name,
      c.start_time,
      c.end_time,
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
    WHERE c.id = ? AND c.trainer_id = ?
    ORDER BY cb.booked_at ASC
    `,
    [classId, trainerId],
  );
  const roster = result.rows;

  if (roster) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(roster),
      'EX',
      ROSTER_CACHE_TTL,
    );
  }
  return roster;
};

// // GET TRAINER WORKOUT TEMPLATES
// const getWorkoutTemplates = async (trainerId) => {
//   const result = await knex.raw(
//     `
//     SELECT
//       id,
//       trainer_id,
//       name,
//       description,
//       difficulty,
//       goal_type,
//       duration_weeks,
//       is_public,
//       created_at,
//       updated_at
//     FROM workout_templates
//     WHERE trainer_id = ?
//        OR is_public = true
//     ORDER BY created_at DESC
//     `,
//     [trainerId],
//   );

//   return result.rows;
// };

// // GET TRAINER MEAL PLANS
// const getMealPlans = async (trainerId) => {
//   const result = await knex.raw(
//     `
//     SELECT
//       id,
//       trainer_id,
//       name,
//       description,
//       goal_type,
//       calories_target,
//       protein_g,
//       carbs_g,
//       fat_g,
//       created_at,
//       updated_at
//     FROM meal_plans
//     WHERE trainer_id = ?
//     ORDER BY created_at DESC
//     `,
//     [trainerId],
//   );

//   return result.rows;
// };

// ASSIGN WORKOUT / MEAL PLAN TO MEMBER
// const assignPlan = async ({
//   memberProfileId,
//   trainerId,
//   workoutTemplateId = null,
//   mealPlanId = null,
//   notes = null,
// }) => {
//   if (!workoutTemplateId && !mealPlanId) {
//     throw new Error("Workout template or meal plan is required");
//   }

//   const trx = await knex.transaction();

//   try {
//     // 1. Deactivate any existing active assignments for this member + trainer
//     await trx.raw(
//       `
//       UPDATE member_assignments
//       SET is_active = false, updated_at = NOW()
//       WHERE member_profile_id = ? AND trainer_id = ? AND is_active = true
//       `,
//       [memberProfileId, trainerId],
//     );

//     // 2. Insert the new assignment
//     const result = await trx.raw(
//       `
//       INSERT INTO member_assignments (
//         member_profile_id,
//         trainer_id,
//         workout_template_id,
//         meal_plan_id,
//         assigned_at,
//         is_active,
//         notes
//       )
//       VALUES (?, ?, ?, ?, NOW(), true, ?)
//       RETURNING *
//       `,
//       [memberProfileId, trainerId, workoutTemplateId, mealPlanId, notes],
//     );

//     await trx.commit();
//     return result.rows[0];
//   } catch (error) {
//     await trx.rollback();
//     throw error;
//   }
// };

// GET CLIENT FEEDBACK
const getClientFeedback = async (trainerId) => {
  const cacheKey = `trainer:feedback:${trainerId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

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

  const feedback = result.rows;
  if (feedback) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(feedback),
      'EX',
      FEEDBACK_CACHE_TTL,
    );
  }

  return feedback;
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
  getTrainerById,
  getTrainerByUserId,
  getAllTrainers,
  updateTrainer,
  getTrainerSchedule,
  getClassRoster,
  getTrainerRoster,
  deactivateTrainer,
  reactivateTrainer,
  // getMemberHealthProfile,
  // getWorkoutTemplates,
  // getMealPlans,
  // assignPlan,
  getClientFeedback,
  recordPersonalTrainingAttendance,
  invalidateTrainerScheduleCache,
};
