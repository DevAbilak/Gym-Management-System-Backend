const checkinService = require('../services/checkin.service');

// GET MEMBER BY UNIQUE MEMBER ID
const getMemberByUniqueId = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    const member = await checkinService.getMemberByUniqueId(uniqueId);

    if (!member) {
      return res.status(404).json({
        error: 'Member not found',
      });
    }

    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

// CHECK IN MEMBER
const checkIn = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    // The authenticated user verifies the check-in
    const verifiedBy = req.user ? req.user.id : null;

    const result = await checkinService.checkIn(
      uniqueId,
      verifiedBy,
    );

    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Member not found') {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === 'Account is deactivated') {
      return res.status(403).json({
        error: error.message,
      });
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

    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Member not found') {
      return res.status(404).json({
        error: error.message,
      });
    }

    next(error);
  }
};

// GET CHECK-IN HISTORY
const getCheckInHistory = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { limit } = req.query;

    const result = await checkinService.getCheckInHistory(
      memberId,
      limit ? Number(limit) : 50,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET TODAY'S CHECK-INS
const getTodayCheckIns = async (req, res, next) => {
  try {
    const result = await checkinService.getTodayCheckIns();

    res.status(200).json(result);
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