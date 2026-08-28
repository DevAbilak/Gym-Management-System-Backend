const healthService = require('../services/health.service');
const memberService = require('../services/member.service');
const trainerService = require('../services/trainer.service');
const { sendSuccess, sendError, ErrorCodes } = require('../utils/response');
const knex = require('../db/db');

// HELPER FUNCTION: Check if trainer is assigned to member
const isTrainerAssignedToMember = async (trainerUserId, memberProfileId) => {
  // Get trainer profile
  const trainer = await trainerService.getTrainerByUserId(trainerUserId);
  if (!trainer) return false;

  // Check assignment
  const result = await knex.raw(
    `
    SELECT 1 FROM member_assignments
    WHERE trainer_id = ? AND member_profile_id = ? AND is_active = true
    `,
    [trainer.id, memberProfileId],
  );
  return result.rows.length > 0;
};

// HELPER FUNCTION: Permission check
const permissionCheck = async (req, userId, memberId) => {
  const isOwn = req.user.role === 'member' && req.user.id === userId;
  const isAdminReception =
    req.user.role === 'admin' || req.user.role === 'reception';
  const isAssignedTrainer =
    req.user.role === 'trainer' &&
    (await isTrainerAssignedToMember(req.user.id, memberId));

  if (isOwn || isAdminReception || isAssignedTrainer) {
    return true;
  }
  return false;
};

const saveHealthProfile = async (req, res, next) => {
  try {
    const payload = req.body;

    const member = await memberService.getMemberById(payload.member_id);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const isOwn = req.user.role === 'member' && req.user.id === member.id;
    const isAdminReception =
      req.user.role === 'admin' || req.user.role === 'reception';
    const isAssignedTrainer =
      req.user.role === 'trainer' &&
      (await isTrainerAssignedToMember(req.user.id, payload.member_id));

    if (!isOwn && !isAdminReception && !isAssignedTrainer) {
      return sendError(
        res,
        'Access denied. You can only save your own or assigned member health metrics.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    // save to mongoDB
    const metric = await healthService.saveHealthProfile(payload);

    req.log.info(
      { memberId: payload.member_id, userId: req.user.id },
      'Health metric saved successfully',
    );

    return sendSuccess(res, metric, 'Health metric saved successfully', 201);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

const getLatestMetrics = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await memberService.getMemberById(memberId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, member.user_id, memberId);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only view your own health metrics or assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    // fetch from MongoDB
    const metrics = await healthService.getLatestMetrics(memberId);

    if (!metrics) {
      return sendError(
        res,
        'No health metrics found for this member',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    return sendSuccess(
      res,
      metrics,
      'Latest health metrics retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getMetricsHistory = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const member = await memberService.getMemberById(memberId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, member.user_id, memberId);
    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only view your own health metrics or assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const history = await healthService.getMetricsHistory(
      memberId,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit),
    );

    return sendSuccess(
      res,
      {
        count: history.length,
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
      'Health metrics history retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getMetricsByDateRange = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    const member = await memberService.getMemberById(memberId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(req, member.user_id, memberId);

    if (!isAllowed) {
      return sendError(
        res,
        'Access denied. You can only view your own health metrics or assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const metrics = await healthService.getMetricsBYDateRange(
      memberId,
      startDate,
      endDate,
    );

    return sendSuccess(
      res,
      {
        count: metrics.length,
        data: metrics,
      },
      'Health metrics by date range retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const deleteMetric = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await healthService.deleteMetric(id);

    req.log.warn(
      { metricId: id, userId: req.user.id },
      'Health metric deleted by admin',
    );

    return sendSuccess(res, result, 'Health metric deleted successfully', 200);
  } catch (error) {
    if (error.message === 'Health metric not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

module.exports = {
  saveHealthProfile,
  getLatestMetrics,
  getMetricsHistory,
  getMetricsByDateRange,
  deleteMetric,
};
