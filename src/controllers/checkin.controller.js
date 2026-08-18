const checkinService = require('../services/checkin.service');
const { sendSuccess, sendError, ErrorCodes } = require('../utils/response');

// GET MEMBER BY UNIQUE MEMBER ID
const getMemberByUniqueId = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    const member = await checkinService.getMemberByUniqueId(uniqueId);

    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, member, 'Member retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

// CHECK IN MEMBER
const checkIn = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    // The authenticated reception/admin verifies the check-in
    const verifiedBy = req.user ? req.user.id : null;

    const result = await checkinService.checkIn(uniqueId, verifiedBy);

    req.log.info(
      { uniqueId, userId: verifiedBy },
      'Member checked in successfully',
    );
    return sendSuccess(res, result, 'Check-in successful', 200);
  } catch (error) {
    if (error.message === 'Member not found') {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (
      error.message === 'Subscription is not active' ||
      error.message === 'Account is deactivated'
    ) {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 403);
    }

    next(error);
  }
};

// OVERRIDE CHECK-IN
const overrideCheckIn = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    const { reason } = req.body;

    const verifiedBy = req.user ? req.user.id : null;

    const result = await checkinService.overRideCheckIn(
      uniqueId,
      reason,
      verifiedBy,
    );

    req.log.warn(
      { uniqueId, userId: verifiedBy, reason },
      'Override check-in performed',
    );

    return sendSuccess(
      res,
      result,
      `Override check-in successful. Reason: ${reason}`,
      200,
    );
  } catch (error) {
    if (error.message === 'Member not found') {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    next(error);
  }
};

// GET CHECK-IN HISTORY
const getCheckInHistory = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { limit } = req.query;

    // check if member exists
    const member = await getMemberById(memberId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check: member can only access their own history
    const isOwn = req.user.role === 'member' && req.user.id === member.user_id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own check-in history.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const result = await checkinService.getCheckInHistory(
      memberId,
      limit ? Number(limit) : 50,
    );

    req.log.debug(
      { memberId, userId: req.user.id },
      'Check-in history retrieved',
    );

    return sendSuccess(
      res,
      result,
      'Check-in history retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET TODAY'S CHECK-INS
const getTodayCheckIns = async (req, res, next) => {
  try {
    const result = await checkinService.getTodayCheckIns();

    req.log.debug({ userId: req.user.id }, 'Today\'s check-ins retrieved');

    return sendSuccess(
      res,
      {
        count: result.length,
        data: result,
      },
      'Today\'s check-ins retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMemberByUniqueId,
  checkIn,
  overrideCheckIn,
  getCheckInHistory,
  getTodayCheckIns,
};
