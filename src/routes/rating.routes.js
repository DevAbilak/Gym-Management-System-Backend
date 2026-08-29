const express = require('express');
const ratingController = require('../controllers/rating.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateSubmitRating,
  validateGetTrainerRating,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.post(
  '/:type',
  authenticate,
  authorize('member'),
  validateSubmitRating,
  ratingController.submitRating,
);

router.get(
  '/trainer/:trainerId/average',
  authenticate,
  validateGetTrainerRating,
  ratingController.getTrainerAverageRating,
);

router.get('/facility', ratingController.getFacilityRatingSummary);

module.exports = router;
