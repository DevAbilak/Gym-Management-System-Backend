const { MealPlan, WorkoutTemplate } = require('../models/index');
const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

// HELPER FUNCTION: Generate cache keys
const cacheKeys = {
  workout: (id) => `template:workout:${id}`,
  meal: (id) => `template:meal:${id}`,
  workoutByTrainer: (trainerId, filters) => {
    const { goal_type, difficulty } = filters || {};
    const key = `template:workout:trainer:${trainerId}`;
    const parts = [];
    if (goal_type) parts.push(`goal:${goal_type}`);
    if (difficulty) parts.push(`diff:${difficulty}`);
    return parts.length ? `${key}:${parts.join(':')}` : key;
  },
  mealByTrainer: (trainerId, goalType) => {
    return goalType
      ? `template:meal:trainer:${trainerId}:goal:${goalType}`
      : `template:meal:trainer:${trainerId}`;
  },
  workoutAll: (page, limit) =>
    `template:workout:all:page:${page}:limit:${limit}`,
  mealAll: (page, limit) => `template:meal:all:page:${page}:limit:${limit}`,
};

// HELPER FUNCTION: Invalidate caches
const invalidateWorkoutCache = async (trainerId, templateId = null) => {
  const promises = [];

  // delete specific cache if id is provided
  if (templateId) {
    promises.push(redisClient.del(cacheKeys.workout(templateId)));
  }

  // delete all trainer specific caches for this trainer
  promises.push(redisClient.del(cacheKeys.workoutByTrainer(trainerId)));

  // also delete any with filters
  const pattern = `template:workout:trainer:${trainerId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length) {
    promises.push(redisClient.del(keys));
  }

  // delete admin all templates cache
  const allPattern = 'template:workout:all:*';
  const allKeys = await redisClient.keys(allPattern);
  if (allKeys.length) {
    promises.push(redisClient.del(allKeys));
  }

  await Promise.all(promises);
};

const invalidateMealCache = async (trainerId, planId = null) => {
  const promises = [];

  if (planId) {
    promises.push(redisClient.del(cacheKeys.meal(planId)));
  }

  // Delete trainer-specific meal caches (with and without goal filter)
  promises.push(redisClient.del(cacheKeys.mealByTrainer(trainerId)));
  const pattern = `template:meal:trainer:${trainerId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length) {
    promises.push(redisClient.del(keys));
  }

  // Delete admin all-meal caches
  const allPattern = 'template:meal:all:*';
  const allKeys = await redisClient.keys(allPattern);
  if (allKeys.length) {
    promises.push(redisClient.del(allKeys));
  }

  await Promise.all(promises);
};

// ============================================================
// WORKOUT TEMPLATES
// ============================================================
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

  // verify trainer exists in postgreSQL
  const trainerCheck = await knex.raw(
    `
    SELECT id FROM trainers WHERE id = ?
  `,
    [trainer_id],
  );
  if (trainerCheck.rows.length === 0) {
    throw new Error(`Trainer with ID ${trainer_id} does not exist`);
  }

  // create a mongoDB document
  const template = new WorkoutTemplate({
    trainer_id,
    name,
    description: description || null,
    difficulty: difficulty || 'beginner',
    goal_type: goal_type || 'general_fitness',
    duration_weeks: duration_weeks || null,
    is_public: is_public || false,
    exercises: exercises || [],
  });
  await template.save();

  await invalidateWorkoutCache(trainer_id);

  return template;
};

const getWorkoutTemplateById = async (id) => {
  const cacheKey = cacheKeys.workout(id);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const template = await WorkoutTemplate.findById(id);

  if (template) {
    await redisClient.set(cacheKey, JSON.stringify(template), 'EX', CACHE_TTL);
  } else {
    // Cache null for 1 minute to avoid cache stampede
    await redisClient.set(cacheKey, JSON.stringify(null), 'EX', 60);
  }

  return template;
};

const getWorkoutTemplateByTrainer = async (trainerId, filters = {}) => {
  const cacheKey = cacheKeys.workoutByTrainer(trainerId, filters);
  const { goal_type, difficulty } = filters;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const query = { trainer_id: trainerId };
  if (goal_type) query.goal_type = goal_type;
  if (difficulty) query.difficulty = difficulty;

  // if include public, also fetch public templates
  const result = await WorkoutTemplate.find({
    $or: [query, { is_public: true }],
  }).sort({ created_at: -1 });

  // remove duplicates if a template is both trainer's and public
  const seen = new Set();
  const templates = result.filter((template) => {
    const key = template._id.tostring();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (templates) {
    await redisClient.set(cacheKey, JSON.stringify(templates), 'EX', CACHE_TTL);
  }

  return templates;
};

const getAllWorkoutTemplates = async (page = 1, limit = 20) => {
  const cacheKey = cacheKeys.workoutAll(page, limit);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const skip = (page - 1) * limit;
  const [data, total] = await promise.all([
    WorkoutTemplate.find().sort({ created_at: -1 }).limit(limit).skip(skip),
    WorkoutTemplate.countDocuments(),
  ]);

  const result = {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (result) {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  }

  return result;
};

const updateWorkoutTemplate = async (id, updates) => {
  const allowedFields = [
    'name',
    'description',
    'difficulty',
    'goal_type',
    'duration_weeks',
    'is_public',
    'exercises',
  ];

  const filteredUpdates = {};
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  });

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Fetch existing template to get trainer_id for invalidation
  const existing = await WorkoutTemplate.findById(id);
  if (!existing) {
    throw new Error('Workout template not found');
  }

  const updated = await WorkoutTemplate.findByIdAndUpdate(id, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  await invalidateWorkoutCache(existing.trainer_id, id);

  return updated;
};

const deleteWorkoutTemplate = async (id) => {
  // Fetch existing template to get trainer_id
  const existing = await WorkoutTemplate.findById(id);
  if (!existing) {
    throw new Error('Workout template not found');
  }
  const trainerId = existing.trainer_id;

  const result = await WorkoutTemplate.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Workout template not found');
  }

  await invalidateWorkoutCache(trainerId, id);

  return { message: 'Workout template deleted successfully' };
};

const findTemplateWithExercise = async (exerciseName) => {
  return await WorkoutTemplate.find({
    'exercises.exercise_name': { $regex: exerciseName, $options: 'i' },
  });
};

// ============================================================
// MEAL PLANS
// ============================================================
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

  // verify trainer exists in PostgreSQL
  const trainerCheck = await knex.raw('SELECT id FROM trainers WHERE id = ?', [
    trainer_id,
  ]);
  if (trainerCheck.rows.length === 0) {
    throw new Error(`Trainer with ID ${trainer_id} does not exist`);
  }

  // create mongoDB document
  const plan = new MealPlan({
    trainer_id,
    name,
    description: description || null,
    goal_type: goal_type || 'maintenance',
    calories_target: calories_target || null,
    protein_g: protein_g || null,
    carbs_g: carbs_g || null,
    fat_g: fat_g || null,
    items: items || [],
  });

  await plan.save();

  await invalidateMealCache(trainer_id);
  return plan;
};

const getMealPlanById = async (id) => {
  const cacheKey = cacheKeys.meal(id);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const plan = await MealPlan.findById(id);

  if (plan) {
    await redisClient.set(cacheKey, JSON.stringify(plan), 'EX', CACHE_TTL);
  } else {
    await redisClient.set(cacheKey, JSON.stringify(null), 'EX', 60);
  }

  return plan;
};

const getMealPlansByTrainer = async (trainerId, filters = {}) => {
  const { goal_type } = filters;
  const cacheKey = cacheKeys.mealByTrainer(trainerId, goal_type);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const query = { trainer_id: trainerId };
  if (goal_type) query.goal_type = goal_type;

  const plans = await MealPlan.find(query).sort({ created_at: -1 });

  if (plans) {
    await redisClient.set(cacheKey, JSON.stringify(plans), 'EX', CACHE_TTL);
  }

  return plans;
};

const getAllMealPlans = async (page = 1, limit = 20) => {
  const cacheKey = cacheKeys.mealAll(page, limit);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    MealPlan.find().sort({ created_at: -1 }).limit(limit).skip(skip),
    MealPlan.countDocuments(),
  ]);

  const result = {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (result) {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  }

  return result;
};

const updateMealPlan = async (id, updates) => {
  const allowedFields = [
    'name',
    'description',
    'goal_type',
    'calories_target',
    'protein_g',
    'carbs_g',
    'fat_g',
    'items',
  ];

  const filteredUpdates = {};
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  });

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Fetch existing plan to get trainer_id
  const existing = await MealPlan.findById(id);
  if (!existing) {
    throw new Error('Meal plan not found');
  }

  const updated = await MealPlan.findByIdAndUpdate(id, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  await invalidateMealCache(existing.trainer_id, id);

  return updated;
};

const deleteMealPlan = async (id) => {
  const existing = await MealPlan.findById(id);
  if (!existing) {
    throw new Error('Meal plan not found');
  }

  const trainerId = existing.trainer_id;

  await MealPlan.findByIdAndDelete(id);

  await invalidateMealCache(trainerId, id);

  return { message: 'Meal plan deleted successfully' };
};

module.exports = {
  createWorkoutTemplate,
  getWorkoutTemplateById,
  getWorkoutTemplateByTrainer,
  getAllWorkoutTemplates,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  findTemplateWithExercise,

  createMealPlan,
  getMealPlanById,
  getMealPlansByTrainer,
  getAllMealPlans,
  updateMealPlan,
  deleteMealPlan,
};
