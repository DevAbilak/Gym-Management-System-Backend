const classService = require('../services/class.service');
const { sendError, ErrorCodes, sendSuccess } = require('../utils/response');

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
    const newClass = await classService.createClass(req.body);

    return sendSuccess(res, newClass, 'Class created successfully', 201);
  } catch (error) {
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

    // prevent updating id or protected fields
    delete updates.id;
    delete updates.created_at;
    delete updates.current_bookings;

    const updated = await classService.updateClass(id, updates);

    if (!updated) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

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
