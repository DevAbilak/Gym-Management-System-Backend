const templateService = require('../services/templete.service');
const trainerService = require('../services/trainer.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

// HELPER FUNCTION: trainer permission check
const trainerPermissionCheck = async (userId, res, trainerId, message) => {
  const trainer = await trainerService.getTrainerByUserId(userId);
  if (trainer && trainer.id !== trainerId) {
    return sendError(res, message, ErrorCodes.FORBIDDEN, 403);
  }
};

// ============================================================
// WORKOUT TEMPLATES
// ============================================================

const createWorkoutTemplate = async (req, res, next) => {
  try {
    const payload = req.body;

    // Permission check
    // If user is a trainer, they can only create templates for themselves
    // Admin can create for any trainer (already allowed)
    if (req.user.role === 'trainer' && req.user.id !== payload.trainer_id) {
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== payload.trainer_id) {
        return sendError(
          res,
          'Trainers can only create templates for themselves.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    const template = await templateService.createWorkoutTemplate(payload);

    req.log.info(
      { trainerId: payload.trainer_id, userId: req.user.id },
      'Workout template created',
    );
    return sendSuccess(
      res,
      template,
      'Workout template created successfully',
      201,
    );
  } catch (error) {
    if (error.message.includes('does not exist')) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

const getWorkoutTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await templateService.getWorkoutTemplateById(id);

    if (!template) {
      return sendError(
        res,
        'Workout template not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    // Permission check
    // Members can only view public templates
    if (req.user.role === 'member' && !template.is_public) {
      return sendError(
        res,
        'Access denied. This template is not public.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    // Trainer can view their own templates
    if (req.user.role === 'trainer') {
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (
        trainer &&
        trainer.id !== template.trainer_id &&
        !template.is_public
      ) {
        return sendError(
          res,
          'Access denied. You can only view your own templates or public templates.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }
    // Admin/Reception can view any templates
    return sendSuccess(
      res,
      template,
      'Workout template retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getWorkoutTemplates = async (req, res, next) => {
  try {
    const {
      trainer_id,
      goal_type,
      difficulty,
      include_public,
      page = 1,
      limit = 20,
    } = req.query;

    // Permission logic
    // If no trainer_id provided, return all templates (Admin/Reception only)
    if (!trainer_id) {
      if (req.user.role !== 'admin' && req.user.role !== 'reception') {
        return sendError(
          res,
          'Access denied. Only Admin/Reception can view all templates without a trainer filter.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }

      // Admin/Reception can see all templates
      const result = await templateService.getAllWorkoutTemplates(
        parseInt(page),
        parseInt(limit),
      );
      return sendSuccess(
        res,
        result,
        'Workout templates retrieved successfully',
        200,
      );
    }

    // if trainer_id is provided
    if (req.user.role === 'trainer') {
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== trainer_id) {
        return sendError(
          res,
          'Trainers can only view their own templates.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    // member can view public templates only
    const includePublic =
      req.user.role === 'member' ? true : include_public !== 'false';

    const templates = await templateService.getWorkoutTemplateByTrainer(
      trainer_id,
      { goal_type, difficulty, include_public: includePublic },
    );

    return sendSuccess(
      res,
      templates,
      'Workout templates retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const updateWorkoutTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if template exists
    const existing = await templateService.getWorkoutTemplateById(id);
    if (!existing) {
      return sendError(
        res,
        'Workout template not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    // Permission check
    if (req.user.role === 'trainer') {
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== existing.trainer_id) {
        return sendError(
          res,
          'Trainers can only update their own templates.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    const updated = await templateService.updateWorkoutTemplate(id, updates);

    req.log.info(
      { templateId: id, trainerId: existing.trainer_id, userId: req.user.id },
      'Workout template updated',
    );

    return sendSuccess(
      res,
      updated,
      'Workout template updated successfully',
      200,
    );
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

const deleteWorkoutTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existing = await templateService.getWorkoutTemplateById(id);
    if (!existing) {
      return sendError(
        res,
        'Workout template not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    // Permission check
    if (req.user.role === 'trainer') {
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== existing.trainer_id) {
        return sendError(
          res,
          'Trainers can only delete their own templates.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    const result = await templateService.deleteWorkoutTemplate(id);

    req.log.warn(
      { templateId: id, trainerId: existing.trainer_id, userId: req.user.id },
      'Workout template deleted',
    );

    return sendSuccess(
      res,
      result,
      'Workout template deleted successfully',
      200,
    );
  } catch (error) {
    if (error.message === 'Workout template not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }

    next(error);
  }
};

// ============================================================
// MEAL PLANS
// ============================================================
const createMealPlan = async (req, res, next) => {
  try {
    const payload = req.body;

    // Permission check
    if (req.user.role === 'trainer') {
      trainerPermissionCheck(
        req.user.id,
        res,
        payload.trainer_id,
        'Trainers can only create meal plans for themselves.',
      );
    }

    const plan = await templateService.createMealPlan(payload);

    req.log.info(
      { trainerId: payload.trainer_id, userId: req.user.id },
      'Meal plan created',
    );

    return sendSuccess(res, plan, 'Meal plan created successfully', 201);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

const getMealPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await templateService.getMealPlanById(id);
    if (!plan) {
      return sendError(res, 'Meal plan not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check
    // Members can always view meal plans (they are assigned by trainers)
    // Admin/Reception can view anything
    // Trainers can view their own
    if (req.user.role === 'trainer') {
      trainerPermissionCheck(
        req.user.id,
        res,
        plan.trainer_id,
        'Trainers can only view their own meal plans.',
      );
    }
    return sendSuccess(res, plan, 'Meal plan retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getMealPlans = async (req, res, next) => {
  try {
    const { trainer_id, goal_type, page = 1, limit = 20 } = req.query;

    // If no trainer_id, return all (Admin/Reception only)
    if (!trainer_id) {
      if (req.user.role !== 'admin' && req.user.role !== 'reception') {
        return sendError(
          res,
          'Access denied. Only Admin/Reception can view all meal plans without a trainer filter.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
      const result = await templateService.getAllMealPlans(
        parseInt(page),
        parseInt(limit),
      );
      return sendSuccess(res, result, 'Meal plans retrieved successfully', 200);
    }

    // Permission check for specific trainer
    if (req.user.role === 'trainer') {
      trainerPermissionCheck(
        req,
        user.id,
        res,
        trainer_id,
        'Trainers can only view their own meal plans.',
      );
    }

    // Members, Admin/Reception can view any trainer's meal plans
    const plans = await templateService.getMealPlansByTrainer(trainer_id, {
      goal_type,
    });

    return sendSuccess(res, plans, 'Meal plans retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const updateMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if plan exists
    const existing = await templateService.getMealPlanById(id);
    if (!existing) {
      return sendError(res, 'Meal plan not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission check
    if (req.user.role === 'trainer') {
      trainerPermissionCheck(
        req.user.id,
        res,
        existing.trainer_id,
        'Trainers can only update their own meal plans.',
      );
    }

    const updated = await templateService.updateMealPlan(id, updates);

    req.log.info(
      { planId: id, trainerId: existing.trainer_id, userId: req.user.id },
      'Meal plan updated',
    );

    return sendSuccess(res, updated, 'Meal plan updated successfully', 200);
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

const deleteMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await templateService.getMealPlanById(id);
    if (!existing) {
      return sendError(res, 'Meal plan not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (req.user.role === 'trainer') {
      trainerPermissionCheck(
        req.user.id,
        res,
        existing.trainer_id,
        'Trainers can only delete their own meal plans.',
      );
    }

    const result = await trainerService.deleteMealPlan(id);

    req.log.warn(
      { planId: id, trainerId: existing.trainer_id, userId: req.user.id },
      'Meal plan deleted',
    );

    return sendSuccess(res, result, 'Meal plan deleted successfully', 200);
  } catch (error) {
    if (error.message === 'Meal plan not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

module.exports = {
  createWorkoutTemplate,
  getWorkoutTemplateById,
  getWorkoutTemplates,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,

  createMealPlan,
  getMealPlanById,
  getMealPlans,
  updateMealPlan,
  deleteMealPlan,
};
