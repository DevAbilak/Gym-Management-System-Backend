const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const memberController = require('../controllers/member.controller');
const trainerController = require('../controllers/trainer.controller');
const healthController = require('../controllers/health.controller');
const notificationController = require('../controllers/notification.controller');
const progressController = require('../controllers/progress.controller');
const ratingController = require('../controllers/rating.controller');
const subscriptionController = require('../controllers/subscription.controller');

const {
  validateDeactivateUser,
  validateDeactivateTrainer,
  validateReactivateTrainer,
  validateDeleteHealthMetric,
  validateCleanup,
  validateDeleteProgressLog,
  validateModerateRating,
  validateGetFlaggedRating,
  validateGetSubscriptionById,
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

// ------- NOTIFICATION MANAGEMENT ---------
// Clean old read notifications
router.delete(
  '/notifications/cleanup',
  validateCleanup,
  notificationController.cleanupOldNotifications,
);

// delete progress logs
router.delete(
  '/progress-logs/:id',
  validateDeleteProgressLog,
  progressController.deleteProgressLog,
);

// ------- RATING MANAGEMENT ---------
// get flagged ratings
router.get(
  '/ratings/flagged',
  validateGetFlaggedRating,
  ratingController.getFlaggedRatings,
);

// moderate rating
router.patch(
  '/ratings/:id/moderate',
  validateModerateRating,
  ratingController.moderateRating,
);

// ------- SUBSCRIPTION MANAGEMENT ---------
// get subscription by ID
router.get(
  '/subscriptions/:id',
  validateGetSubscriptionById,
  subscriptionController.getSubscriptionById,
);

// get admin KPIs
router.get('/kpis', adminController.getAdminKPIs);

module.exports = router;
