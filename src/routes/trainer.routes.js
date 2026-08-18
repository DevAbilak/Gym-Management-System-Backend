const express = require('express');

const trainerController = require('../controllers/trainer.controller');

const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

const {
  validateTrainerId,
  validateUserId,
  validateUpdateTrainer,
  validateAvailability,
} = require('../middleware/validators.middleware');

const router = express.Router();

// Get all trainers
router.get(
  '/',
  authenticate,
  authorize('admin', 'reception'),
  trainerController.getAllTrainers,
);

// Get trainer by ID
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'reception', 'trainer'),
  validateTrainerId,
  trainerController.getTrainerById,
);

// Get trainer by user ID
router.get(
  '/user/:userId',
  authenticate,
  authorize('admin', 'reception', 'trainer'),
  validateUserId,
  trainerController.getTrainerByUserId,
);

// Update trainer profile
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'trainer'),
  validateTrainerId,
  validateUpdateTrainer,
  trainerController.updateTrainer,
);

// Update trainer availability
router.patch(
  '/:id/availability',
  authenticate,
  authorize('admin', 'trainer'),
  validateTrainerId,
  validateAvailability,
  trainerController.updateAvailability,
);

module.exports = router;