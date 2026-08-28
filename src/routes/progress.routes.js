const express = require('express');
const progressController = require('../controllers/progress.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateLogProgress,
  validateGetProgressHistory,
  validateGetLatestProgress,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', validateLogProgress, progressController.logProgress);

router.get(
  '/member/:memberProfileId',
  validateGetProgressHistory,
  progressController.getProgressHistory,
);

router.get(
  '/member/:memberProfileId/latest',
  validateGetLatestProgress,
  progressController.getLatestProgress,
);

module.exports = router;
