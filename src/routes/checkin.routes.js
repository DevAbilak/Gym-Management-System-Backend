const express = require('express');

const checkinController = require('../controllers/checkin.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

const {
  validateCheckInHistory,
  validateCheckInMember,
  validateOverrideCheckIn,
} = require('../middleware/validators.middleware');

const router = express.Router();

// all routes need authentication
router.use(authenticate);

// Get member information by unique member ID
router.get(
  '/member/:uniqueId',
  authorize('admin', 'reception'),
  validateCheckInMember,
  checkinController.getMemberByUniqueId,
);

// Get today's check-ins
router.get(
  '/today',
  authorize('admin', 'reception'),
  checkinController.getTodayCheckIns,
);

// Get member check-in history (allowed for: own, admin , reception)
router.get(
  '/history/:memberId',
  validateCheckInHistory,
  checkinController.getCheckInHistory,
);

// Override check-in
router.post(
  '/override/:uniqueId',
  authorize('admin', 'reception'),
  validateOverrideCheckIn,
  checkinController.overrideCheckIn,
);

// Normal check-in
router.post(
  '/:uniqueId',
  authorize('admin', 'reception'),
  validateCheckInMember,
  checkinController.checkIn,
);

module.exports = router;
