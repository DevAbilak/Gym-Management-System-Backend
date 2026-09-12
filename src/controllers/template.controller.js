const templateService = require('../services/template.service');
const trainerService = require('../services/trainer.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

// ============================================================
// WORKOUT TEMPLATES
// ============================================================

const createWorkoutTemplate = async (req, res, next) => {
  try {
    const payload = req.body;
    const trainer = await trainerService.getTrainerById(payload.trainer_id);

    if (!trainer) {
      return sendError(
        res,
        'Trainer does not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    // Permission check
    if (req.user.role === 'trainer' && req.user.id !== trainer.user_id) {
      return sendError(
        res,
        'Trainers can only create templates for themselves.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    if (!trainer.is_active) {
      return sendError(
        res,
        'You can\'t create workout template for deactivated user',
        ErrorCodes.UNAUTHORIZED,
        403,
      );
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
    const result = await templateService.getAllWorkoutTemplates(
      req.query,
      req.user,
    );
    return sendSuccess(
      res,
      result,
      'Workout templates retrieved successfully',
      200,
    );
  } catch (error) {
    console.log(error);
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

    const trainer = await trainerService.getTrainerById(payload.trainer_id);

    if (!trainer) {
      return sendError(
        res,
        'Trainer does not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    // Permission check
    if (req.user.role === 'trainer') {
      if (trainer.user_id !== req.user.id) {
        return sendError(
          res,
          'You can only create meal plan for Yourself.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    if (!trainer.is_active) {
      return sendError(
        res,
        'You can\'t create workout template for deactivated user',
        ErrorCodes.UNAUTHORIZED,
        403,
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
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== plan.trainer_id) {
        return sendError(
          res,
          'Trainers can only view their own meal plans.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }
    return sendSuccess(res, plan, 'Meal plan retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getMealPlans = async (req, res, next) => {
  try {
    const plans = await templateService.getAllMealPlans(
      parseInt(page),
      parseInt(limit),
    );

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
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== existing.trainer_id) {
        return sendError(
          res,
          'Trainers can only update their own meal plans.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
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
      const trainer = await trainerService.getTrainerByUserId(req.user.id);
      if (trainer && trainer.id !== existing.trainer_id) {
        return sendError(
          res,
          'Trainers can only delete their own meal plans.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
    }

    const result = await templateService.deleteMealPlan(id);

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
