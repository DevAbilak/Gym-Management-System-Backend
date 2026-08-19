const express = require('express');
const { authorize, authenticate } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const {
  validateGetBookingById,
  validateGetBookingsByMember,
  validateCancelBooking,
  validateCreateBooking,
  validateRescheduleBooking,
} = require('../middleware/validators.middleware');

router = express.Router();

router.use(authenticate);
router.use(authorize('member', 'admin', 'reception'));

router.post('/', validateCreateBooking, bookingController.bookClass);

router.get('/:id', validateGetBookingById, bookingController.getBookingById);

router.delete('/:id', validateCancelBooking, bookingController.cancelBooking);

router.post(
  '/:id/reschedule',
  validateRescheduleBooking,
  bookingController.rescheduleBooking,
);

router.get(
  '/member/:memberProfileId',
  validateGetBookingsByMember,
  bookingController.getBookingByMember,
);

module.exports = router;
