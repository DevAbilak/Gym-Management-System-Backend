const { MealPlan, WorkoutTemplate } = require('../models/index');
const knex = require('../db/db');

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

  return template;
};

const getWorkoutTemplateById = async (id) => {
  return await WorkoutTemplate.findById(id);
};

const getWorkoutTemplateByTrainer = async (trainerId, filters = {}) => {
  const { goal_type, difficulty } = filters;

  const query = { trainer_id: trainerId };
  if (goal_type) query.goal_type = goal_type;
  if (difficulty) query.difficulty = difficulty;

  // if include public, also fetch public templates
  const result = await WorkoutTemplate.find({
    $or: [query, { is_public: true }],
  }).sort({ created_at: -1 });

  // remove duplicates if a template is both trainer's and public
  const seen = new Set();
  return result.filter((template) => {
    const key = template._id.tostring();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getAllWorkoutTemplates = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await promise.all([
    WorkoutTemplate.find().sort({ created_at: -1 }).limit(limit).skip(skip),
    WorkoutTemplate.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

  return await WorkoutTemplate.findByIdAndUpdate(id, filteredUpdates, {
    new: true,
    runValidators: true,
  });
};

const deleteWorkoutTemplate = async (id) => {
  const result = await WorkoutTemplate.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Workout template not found');
  }

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
  return plan;
};

const getMealPlanById = async (id) => {
  return await MealPlan.findById(id);
};

const getMealPlansByTrainer = async (trainerId, filters = {}) => {
  const { goal_type } = filters;
  const query = { trainer_id: trainerId };
  if (goal_type) query.goal_type = goal_type;

  return await MealPlan.find(query).sort({ created_at: -1 });
};

const getAllMealPlans = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    MealPlan.find().sort({ created_at: -1 }).limit(limit).skip(skip),
    MealPlan.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

  return await MealPlan.findByIdAndUpdate(id, filteredUpdates, {
    new: true,
    runValidators: true,
  });
};

const deleteMealPlan = async (id) => {
  const result = await MealPlan.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Meal plan not found');
  }
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
