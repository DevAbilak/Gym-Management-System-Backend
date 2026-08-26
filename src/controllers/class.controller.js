const classService = require('../services/class.service');
const trainerService = require('../services/trainer.service');
const { sendError, ErrorCodes, sendSuccess } = require('../utils/response');

// HELPER FUNCTION: Checking user permission
const permissionCheck = async (userId, trainerId, res, message) => {
  const trainer = await trainerService.getTrainerByUserId(userId);
  console.log(trainer);

  if (!trainer) {
    return sendError(
      res,
      'Trainer profile not found for this user',
      ErrorCodes.NOT_FOUND,
      404,
    );
  }

  if (trainer.id !== trainerId) {
    return sendError(res, message, ErrorCodes.FORBIDDEN, 403);
  }
};

const listClasses = async (req, res, next) => {
  try {
    const { date, discipline, trainer_id, page, limit } = req.query;

    const classes = await classService.listClasses({
      date,
      discipline,
      trainer_id,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    return sendSuccess(
      res,
      {
        count: classes.length,
        data: classes,
      },
      'Classes retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classData = await classService.getClassById(id);

    if (!classData) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, classData, 'Class retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const payload = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'trainer') {
      return permissionCheck(
        userId,
        payload.trainer_id,
        res,
        'Trainers can only create classes for themselves.',
      );
    }

    const newClass = await classService.createClass(payload);

    req.log.info(
      { trainerId: payload.trainer_id, classId: newClass.id, userId },
      'Class created successfully',
    );

    return sendSuccess(res, newClass, 'Class created successfully', 201);
  } catch (error) {
    if (error.message && error.message.startsWith('Trainer not found')) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    if (error.message === 'end_time must be after start_time') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // prevent updating id or protected fields
    delete updates.id;
    delete updates.created_at;
    delete updates.current_bookings;

    const existingClass = await classService.getClassById(id);
    if (!existingClass) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

    console.log(userRole);

    if (userRole === 'trainer') {
      return permissionCheck(
        userId,
        existingClass.trainer_id,
        res,
        'Trainers can only update their own classes.',
      );
    }

    const updated = await classService.updateClass(id, updates);

    if (!updated) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

    req.log.info(
      { classId: id, trainerId: existingClass.trainer_id, userId },
      'Class updated successfully',
    );

    return sendSuccess(res, updated, 'Class updated successfully', 200);
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (error.message === 'end_time must be after start_time') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }

    next(error);
  }
};

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
};
