const classService = require('../services/class.service');

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

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classData = await classService.getClassById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const newClass = await classService.createClass(req.body);

    res.status(201).json({
      success: true,
      data: newClass,
      message: 'Class created successfully',
    });
  } catch (error) {
    if (error.message === 'end_time must be after start_time') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
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
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Class updated successfully',
    });
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    if (error.message === 'end_time must be after start_time') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
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
