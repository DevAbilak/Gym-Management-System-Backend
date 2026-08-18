const express = require('express');
const trainerController = require('../controllers/trainer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateGetTrainerById,
  validateUpdateTrainer,
  validateGetTrainerSchedule,
  validateGetTrainerRoster,
  validateGetClientFeedback,
  validateClassRoster,
  validatePersonalTrainingAttendance,
} = require('../middleware/validators.middleware');

const router = express.Router();

// ALL ROUTES REQUIRE AUTHENTICATION
router.use(authenticate);

router.get('/me', trainerController.getMyProfile);

router.get('/:id', validateGetTrainerById, trainerController.getTrainerById);

// Update trainer (owner or admin/reception)
router.patch('/:id', validateUpdateTrainer, trainerController.updateTrainer);

// ADMIN/RECEPTION ONLY -
router.get(
  '/',
  authorize('admin', 'reception'),
  trainerController.getAllTrainers,
);

// Trainer schedule (owner or admin/reception)
router.get(
  '/:id/schedule',
  validateGetTrainerSchedule,
  trainerController.getTrainerSchedule,
);

// Trainer roster (owner or admin/reception)
router.get(
  '/:id/roster',
  validateGetTrainerRoster,
  trainerController.getTrainerRoster,
);

// Class roster (owner or admin/reception)
router.get(
  '/:trainerId/classes/:classId/roster',
  validateClassRoster,
  trainerController.getClassRoster,
);

// Client feedback (owner or admin/reception)
router.get(
  '/:id/feedback',
  validateGetClientFeedback,
  trainerController.getClientFeedback,
);

// Record personal training attendance (Trainer only)
router.post(
  '/attendance/:memberProfileId',
  authorize('trainer'),
  validatePersonalTrainingAttendance,
  trainerController.recordPersonalTrainingAttendance,
);

module.exports = router;
