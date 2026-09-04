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
  validateTrainerIdParam,
  validateAssignPlan,
  validateAssignTrainerToMember,
  validateUnassignTrainer,
  validateGetAllTrainers,
} = require('../middleware/validators.middleware');

const router = express.Router();

// ALL ROUTES REQUIRE AUTHENTICATION
router.use(authenticate);

router.get('/me', authorize('trainer'), trainerController.getMyProfile);

router.get('/:id', validateGetTrainerById, trainerController.getTrainerById);

// Update trainer (owner or admin/reception)
router.patch(
  '/:id',
  authorize('admin', 'reception', 'trainer'),
  validateUpdateTrainer,
  trainerController.updateTrainer,
);

// ADMIN/RECEPTION ONLY -
router.get(
  '/',
  authorize('admin', 'reception'),
  validateGetAllTrainers,
  trainerController.getAllTrainers,
);

// Trainer schedule (owner, assigned member or admin/reception)
router.get(
  '/:id/schedule',
  validateGetTrainerSchedule,
  trainerController.getTrainerSchedule,
);

// Trainer roster (owner or admin/reception)
router.get(
  '/:id/roster',
  authorize('admin', 'reception', 'trainer'),
  validateGetTrainerRoster,
  trainerController.getTrainerRoster,
);

// Class roster (owner or admin/reception)
router.get(
  '/:trainerId/classes/:classId/roster',
  authorize('admin', 'reception', 'trainer'),
  validateClassRoster,
  trainerController.getClassRoster,
);

// Client feedback (owner or admin/reception)
router.get(
  '/:id/feedback',
  authorize('admin', 'reception', 'trainer'),
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

// Workout Templates
router.get(
  '/:trainerId/templates',
  authorize('trainer', 'admin', 'reception'),
  validateTrainerIdParam,
  trainerController.getWorkoutTemplates,
);

// Meal Plans
router.get(
  '/:trainerId/meal-plans',
  authorize('trainer', 'admin', 'reception'),
  validateTrainerIdParam,
  trainerController.getMealPlans,
);

// Assign Plan
router.post(
  '/:trainerId/assign-plan',
  authorize('trainer', 'admin', 'reception'),
  validateAssignPlan,
  trainerController.assignPlan,
);

// ASSIGN TRAINER TO MEMBER
router.post(
  '/:trainerId/assign-trainer',
  authorize('admin', 'reception'),
  validateAssignTrainerToMember,
  trainerController.assignTrainerToMember,
);

// UNASSIGN TRAINER
router.delete(
  '/assignments/member/:memberProfileId',
  authorize('admin', 'reception'),
  validateUnassignTrainer,
  trainerController.unassignTrainer,
);

module.exports = router;
