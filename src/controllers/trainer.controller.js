const trainerService = require('../services/trainer.service');

// GET ALL TRAINERS
const getAllTrainers = async (req, res, next) => {
  try {
    const trainers = await trainerService.getAllTrainers();

    res.status(200).json(trainers);
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
      return res.status(404).json({
        error: 'Trainer not found',
      });
    }

    res.status(200).json(trainer);
  } catch (error) {
    next(error);
  }
};

// GET TRAINER BY USER ID
const getTrainerByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const trainer = await trainerService.getTrainerByUserId(userId);

    if (!trainer) {
      return res.status(404).json({
        error: 'Trainer not found',
      });
    }

    res.status(200).json(trainer);
  } catch (error) {
    next(error);
  }
};

// UPDATE TRAINER PROFILE
const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trainer = await trainerService.updateTrainer(id, req.body);

    if (!trainer) {
      return res.status(404).json({
        error: 'Trainer not found',
      });
    }

    res.status(200).json(trainer);
  } catch (error) {
    next(error);
  }
};

// UPDATE TRAINER AVAILABILITY
const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const trainer = await trainerService.updateAvailability(
      id,
      is_available,
    );

    if (!trainer) {
      return res.status(404).json({
        error: 'Trainer not found',
      });
    }

    res.status(200).json(trainer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTrainers,
  getTrainerById,
  getTrainerByUserId,
  updateTrainer,
  updateAvailability,
};