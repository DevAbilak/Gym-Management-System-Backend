const express = require('express');

const checkinController = require('../controllers/checkin.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

const {
  validateCheckInHistory,
  validateCheckInMember,
  validateOverrideCheckIn,
} = require('../middleware/validators.middleware');

const router = express.Router();

// Get member information by unique member ID
router.get(
  '/member/:uniqueId',
  authenticate,
  authorize('admin', 'reception'),
  validateCheckInMember,
  checkinController.getMemberByUniqueId,
);

// Get today's check-ins
router.get(
  '/today',
  authenticate,
  authorize('admin', 'reception'),
  checkinController.getTodayCheckIns,
);

// Get member check-in history
router.get(
  '/history/:memberId',
  authenticate,
  authorize('admin', 'reception'),
  validateCheckInHistory,
  checkinController.getCheckInHistory,
);

// Override check-in
router.post(
  '/:uniqueId/override',
  authenticate,
  authorize('admin', 'reception'),
  validateOverrideCheckIn,
  checkinController.overrideCheckIn,
);

// Normal check-in
router.post(
  '/:uniqueId',
  authenticate,
  authorize('admin', 'reception'),
  validateCheckInMember,
  checkinController.checkIn,
);

module.exports = router;
