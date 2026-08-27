const bookingService = require('../services/booking.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');
const { getMemberById } = require('../services/member.service');
const { getClassById } = require('../services/class.service');

// HELPER FUNCTION: PERMISSION CHECK
const permissionCheck = async (req, id) => {
  const isOwn = req.user.role === 'member' && req.user.id === id;
  const isAdminReception =
    req.user.role === 'admin' || req.user.role === 'reception';

  if (isOwn || isAdminReception) {
    return true;
  }
  return false;
};

const bookClass = async (req, res, next) => {
  try {
    const { member_profile_id, class_id } = req.body;
    const member = await getMemberById(member_profile_id);

    const isForOwn =
      req.user.role === 'member' && req.user.id === member?.user_id;

    // members can only book for themselves
    if (req.user.role === 'member' && !isForOwn) {
      return sendError(
        res,
        'Members can only book classes for themselves.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const classData = await getClassById(class_id);
    if (!classData) {
      return sendError(res, 'Class not found', ErrorCodes.NOT_FOUND, 404);
    }

    // book the class
    const result = await bookingService.bookClass(member_profile_id, class_id);

    req.log.info(
      { memberId: member_profile_id, classId: class_id, status: result.status },
      'Booking attempt completed',
    );
    return sendSuccess(res, result, result.message, 201);
  } catch (error) {
    if (error.message === 'Already booked') {
      return sendError(
        res,
        'You have already booked this class.',
        ErrorCodes.CONFLICT,
        409,
      );
    }
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      return sendError(res, 'Booking not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, booking.member_user_id);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only cancel your own bookings.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    // cancel the booking
    const result = await bookingService.cancelBooking(id);

    req.log.info(
      { bookingId: id, userId: req.user.id },
      'Booking cancelled successfully',
    );
    return sendSuccess(res, booking, result.message, 200);
  } catch (error) {
    if (error.message === 'Booking not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    if (error.message === 'Booking already cancelled') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (error.message.includes('Cancellation must be at least')) {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 400);
    }
    next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_class_id } = req.body;

    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      return sendError(res, 'Booking not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const isAllowed = await permissionCheck(req, booking.member_user_id);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only reschedule your own bookings.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const newClass = await getClassById(new_class_id);
    if (!newClass) {
      return sendError(
        res,
        'Target class not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    if (newClass.available_spots <= 0) {
      return sendError(res, 'Target class is full', ErrorCodes.CONFLICT, 409);
    }

    // reschedule the booking
    const result = await bookingService.rescheduleBooking(id, new_class_id);

    req.log.info(
      {
        bookingId: id,
        newClassId: new_class_id,
        userId: req.user.id,
      },
      'Booking rescheduled successfully',
    );
    return sendSuccess(res, result, 'Booking rescheduled successfully', 200);
  } catch (error) {
    if (
      error.message === 'Booking not found' ||
      error.message === 'Target class not found'
    ) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    if (error.message === 'Cannot reschedule a cancelled booking') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (error.message.includes('must be at least')) {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 400);
    }
    if (error.message === 'Target class is full') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    next(error);
  }
};

const getBookingByMember = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;

    const member = await getMemberById(memberProfileId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, member.user_id);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only view your own booking history.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const bookings = await bookingService.getBookingByMember(memberProfileId);
    return sendSuccess(
      res,
      {
        count: bookings.length,
        bookings,
      },
      'Booking history retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      return sendError(res, 'Booking not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, booking.member_user_id);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only view your own bookings.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    return sendSuccess(res, booking, 'Booking retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookClass,
  cancelBooking,
  rescheduleBooking,
  getBookingByMember,
  getBookingById,
};
