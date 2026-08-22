const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const memberController = require('../controllers/member.controller');
const trainerController = require('../controllers/trainer.controller');
const healthController = require('../controllers/health.controller');

const {
  validateDeactivateUser,
  validateDeactivateTrainer,
  validateReactivateTrainer,
  validateDeleteHealthMetric,
} = require('../middleware/validators.middleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ------- USER MANAGEMENT ---------
// register any user with roles: member,trainer,reception
router.post('/register', adminController.adminRegister);

// ------- MEMBER MANAGEMENT ---------
// deactivate member
router.delete(
  '/members/:id',
  validateDeactivateUser,
  memberController.deactivateMember,
);

// reactivate member
router.patch(
  '/members/:id/reactivate',
  validateDeactivateUser,
  memberController.reactivateMember,
);

// ------- TRAINER MANAGEMENT ---------
// Deactivate trainer
router.delete(
  '/trainers/:id',
  validateDeactivateTrainer,
  trainerController.deactivateTrainer,
);

// Reactivate trainer
router.patch(
  '/trainers/:id/reactivate',
  validateReactivateTrainer,
  trainerController.reactivateTrainer,
);

// ------- HEALTH MANAGEMENT ---------
// Delete health metric
router.delete(
  '/health-metrics/:id',
  validateDeleteHealthMetric,
  healthController.deleteMetric,
);
module.exports = router;
