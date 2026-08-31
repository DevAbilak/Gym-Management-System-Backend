const express = require('express');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateCreateSubscription,
  validateUpdateSubscriptionStatus,
  validateGetActiveSubscription,
  validateGetSubscriptionsByMember,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('admin', 'reception'),
  validateCreateSubscription,
  subscriptionController.createSubscription,
);

router.patch(
  '/:id/status',
  authorize('admin', 'reception'),
  validateUpdateSubscriptionStatus,
  subscriptionController.updateSubscriptionStatus,
);

router.get(
  '/active/:memberProfileId',
  validateGetActiveSubscription,
  subscriptionController.getActiveSubscription,
);

router.get(
  '/member/:memberProfileId',
  validateGetSubscriptionsByMember,
  subscriptionController.getSubscriptionByMember,
);

module.exports = router;
