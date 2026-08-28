const trainerService = require('../services/trainer.service');
const classService = require('../services/class.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

// GET MY TRAINER PROFILE
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await trainerService.getTrainerByUserId(userId);

    if (!result) {
      return sendError(
        res,
        'Trainer not found for this user',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    return sendSuccess(res, result, 'Trainer retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET TRAINER BY ID
const getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only view their own profile
    const isOwn =
      req.user.role === 'trainer' && req.user.id === trainer.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own profile.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    return sendSuccess(res, trainer, 'Trainer retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET ALL TRAINERS (ADMIN/RECEPTION ONLY)
const getAllTrainers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, is_available } = req.query;

    const result = await trainerService.getAllTrainers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_available,
    });

    return sendSuccess(res, result, 'Trainers retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// UPDATE TRAINER
const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating protected fields
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    // Check if trainer exists
    const existing = await trainerService.getTrainerById(id);
    if (!existing) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only update their own profile
    const isOwn =
      req.user.role === 'trainer' && req.user.id === existing.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only update your own profile.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const updated = await trainerService.updateTrainer(id, updates);

    req.log.info(
      { trainerId: id, userId: req.user.id },
      'Trainer profile updated',
    );
    return sendSuccess(res, updated, 'Trainer updated successfully', 200);
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

// DEACTIVATE TRAINER (Admin only)
const deactivateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await trainerService.deactivateTrainer(id);

    if (!deleted) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    req.log.warn({ trainerId: id, userId: req.user.id }, 'Trainer deactivated');
    return sendSuccess(res, deleted, 'Trainer deactivated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// REACTIVATE TRAINER (Admin only)
const reactivateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reactivated = await trainerService.reactivateTrainer(id);

    if (!reactivated) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    req.log.info({ trainerId: id, userId: req.user.id }, 'Trainer reactivated');
    return sendSuccess(
      res,
      reactivated,
      'Trainer reactivated successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET TRAINER SCHEDULE
const getTrainerSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Check if trainer exists
    const trainer = await trainerService.getTrainerById(id);
    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only view their own schedule
    const isOwn =
      req.user.role === 'trainer' && req.user.id === trainer.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own schedule.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const schedule = await trainerService.getTrainerSchedule(id, date);

    return sendSuccess(
      res,
      {
        trainer: {
          id: trainer.id,
          full_name: `${trainer.first_name} ${trainer.last_name}`,
          specialty: trainer.specialty,
        },
        schedule,
      },
      'Trainer schedule retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET TRAINER ROSTER
const getTrainerRoster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trainer = await trainerService.getTrainerById(id);
    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only view their own roster
    const isOwn =
      req.user.role === 'trainer' && req.user.id === trainer.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own roster.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const roster = await trainerService.getTrainerRoster(id);

    return sendSuccess(
      res,
      {
        trainer: {
          id: trainer.id,
          full_name: `${trainer.first_name} ${trainer.last_name}`,
          specialty: trainer.specialty,
        },
        count: roster.length,
        roster,
      },
      'Trainer roster retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET CLASS ROSTER
const getClassRoster = async (req, res, next) => {
  try {
    const { trainerId, classId } = req.params;

    // Check if trainer exists
    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Check if class exists
    const result = await classService.getClassById(classId);
    if (!result) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only view their own class roster
    const isOwn =
      req.user.role === 'trainer' &&
      req.user.id === trainer.user_id &&
      result.trainer_id === trainerId;

    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own class rosters.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const roster = await trainerService.getClassRoster(trainerId, classId);

    return sendSuccess(res, roster, 'Class roster retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET WORKOUT TEMPLATES
const getWorkoutTemplates = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const result = await trainerService.getWorkoutTemplates(trainerId);

    return sendSuccess(
      res,
      result,
      'Workout templates retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET MEAL PLANS
const getMealPlans = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const result = await trainerService.getMealPlans(trainerId);

    return sendSuccess(res, result, 'Meal plans retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// ASSIGN PLAN
const assignPlan = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const { member_profile_id, workout_template_id, meal_plan_id, notes } =
      req.body;

    const result = await trainerService.assignPlan({
      memberProfileId: member_profile_id,
      trainerId,
      workoutTemplateId: workout_template_id,
      mealPlanId: meal_plan_id,
      notes,
    });

    req.log.info(`Created new assignment for member ${memberProfileId}`);

    return sendSuccess(res, result, 'Plan assigned successfully', 201);
  } catch (error) {
    if (
      error.message ===
      'Either workout_template_id or meal_plan_id must be provided.'
    ) {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (
      error.message === 'Member not found.' ||
      error.message === 'Trainer not found.' ||
      error.message === 'Workout template not found.' ||
      error.message === 'Meal plan not found.'
    ) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    if (error.message.includes('permission')) {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 403);
    }
    next(error);
  }
};

// ASSIGN TRAINER TO MEMBER (No Plans)
const assignTrainerToMember = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;
    const { member_profile_id, notes } = req.body;

    if (!member_profile_id) {
      return sendError(
        res,
        'member_profile_id is required',
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    const result = await trainerService.assignPlan({
      memberProfileId: member_profile_id,
      trainerId,
      workoutTemplateId: null,
      mealPlanId: null,
      notes,
      allowNull: true,
    });

    return sendSuccess(
      res,
      result,
      'Trainer assigned to member successfully',
      201,
    );
  } catch (error) {
    if (
      error.message === 'Member not found.' ||
      error.message === 'Trainer not found.'
    ) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

// GET CLIENT FEEDBACK
const getClientFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if trainer exists
    const trainer = await trainerService.getTrainerById(id);
    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check: trainer can only view their own feedback
    const isOwn =
      req.user.role === 'trainer' && req.user.id === trainer.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own feedback.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const feedback = await trainerService.getClientFeedback(id);

    return sendSuccess(
      res,
      {
        count: feedback.length,
        feedback,
      },
      'Client feedback retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// RECORD PERSONAL TRAINING ATTENDANCE
const recordPersonalTrainingAttendance = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;
    const notes = req.body?.notes || null;
    const trainerUserId = req.user.id;

    // Verify trainer exists
    const trainer = await trainerService.getTrainerByUserId(trainerUserId);
    if (!trainer) {
      return sendError(
        res,
        'Trainer profile not found for this user',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    const attendance = await trainerService.recordPersonalTrainingAttendance(
      memberProfileId,
      trainerUserId,
      notes,
    );

    req.log.info(
      { memberProfileId, trainerId: trainer.id },
      'Personal training attendance recorded',
    );
    return sendSuccess(
      res,
      attendance,
      'Personal training attendance recorded successfully',
      201,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  getTrainerById,
  getAllTrainers,
  updateTrainer,
  deactivateTrainer,
  reactivateTrainer,
  getTrainerSchedule,
  getTrainerRoster,
  getClassRoster,
  getWorkoutTemplates,
  getMealPlans,
  assignPlan,
  assignTrainerToMember,
  getClientFeedback,
  recordPersonalTrainingAttendance,
};
