const express = require('express');
const healthController = require('../controllers/health.controller');
const {
  authenticate,
  authorize,
  requireOwnership,
} = require('../middleware/auth.middleware');
const {
  validateSaveHealthMetric,
  validateGetHealthHistory,
  validateGetHealthByDateRange,
  validateGetLatestHealthMetric,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('member', 'admin', 'reception'),
  requireOwnership('id'),
  validateSaveHealthMetric,
  healthController.saveHealthProfile,
);

router.get(
  '/member/:memberId/latest',
  validateGetLatestHealthMetric,
  healthController.getLatestMetrics,
);

router.get(
  '/member/:memberId/history',
  validateGetHealthHistory,
  healthController.getMetricsHistory,
);

router.get(
  '/member/:memberId/range',
  validateGetHealthByDateRange,
  healthController.getMetricsByDateRange,
);

module.exports = router;
