const progressService = require('../services/progress.service');
const memberService = require('../services/member.service');
const { sendSuccess, sendError, ErrorCodes } = require('../utils/response');
const { isTrainerAssignedToMember } = require('../utils/permissionCheck');
const knex = require('../db/db');

// HELPER FUNCTION: check permission
const permissionCheck = async (req, userId, memberProfileId) => {
  const isOwn = req.user.role === 'member' && req.user.id === userId;
  const isAdminReception =
    req.user.role === 'admin' || req.user.role === 'reception';
  const isAssignedTrainer =
    req.user.role === 'trainer' &&
    (await isTrainerAssignedToMember(req.user.id, memberProfileId));

  if (!isOwn && !isAdminReception && !isAssignedTrainer) {
    return false;
  }
  return true;
};

const logProgress = async (req, res, next) => {
  try {
    const payload = req.body;
    const userId = req.user.id;

    const assignmentCheck = await knex.raw(
      `
      SELECT ma.*,mp.user_id AS member_user_id
      FROM member_assignments ma
      JOIN member_profiles mp ON ma.member_profile_id = mp.id
      WHERE ma.id = ? AND ma.is_active = true
    `,
      [payload.member_assignment_id],
    );

    if (assignmentCheck.rows.length === 0) {
      return sendError(
        res,
        'Active assignment not found.',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    const memberProfileId = assignmentCheck.rows[0].member_profile_id;
    const memberUserId = assignmentCheck.rows[0].member_user_id;

    // permission check
    const isAllowed = await permissionCheck(req, memberUserId, memberProfileId);

    if (!isAllowed) {
      return sendError(
        res,
        req.user.role === 'member'
          ? 'Access denied. You can only log progress for yourself.'
          : 'Access denied. You can only log progress for your assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const result = await progressService.logProgress(payload);

    req.log.info(
      { memberAssignmentId: payload.member_assignment_id, userId },
      'Progress logged successfully',
    );

    return sendSuccess(res, result, 'Progress logged successfully', 201);
  } catch (error) {
    if (error.message === 'Active assignment not found for this member.') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

const getProgressHistory = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const member = await memberService.getMemberById(memberProfileId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const isAllowed = await permissionCheck(
      req,
      member.user_id,
      memberProfileId,
    );

    if (!isAllowed) {
      return sendError(
        res,
        req.user.role === 'member'
          ? 'Access denied. You can only view your progresses'
          : 'Access denied. You can only view progresses of your assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const history = await progressService.getProgressHistory(
      memberProfileId,
      parseInt(limit),
      parseInt(page),
    );

    return sendSuccess(
      res,
      history,
      'Progress history retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getLatestProgress = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;

    const member = await memberService.getMemberById(memberProfileId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const isAllowed = await permissionCheck(
      req,
      member.user_id,
      memberProfileId,
    );

    if (!isAllowed) {
      return sendError(
        res,
        req.user.role === 'member'
          ? 'Access denied. You can only view your latest progresses'
          : 'Access denied. You can only view latest progresses of your assigned members.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const latest = await progressService.getLatestProgress(memberProfileId);

    return sendSuccess(
      res,
      latest,
      'Latest progress retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const deleteProgressLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await progressService.deleteProgressLog(id);

    req.log.warn(
      { logId: id, userId: req.user.id },
      'Progress log deleted by admin',
    );

    return sendSuccess(res, result, 'Progress log deleted successfully', 200);
  } catch (error) {
    if (error.message === 'Progress log not found.') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

module.exports = {
  logProgress,
  getProgressHistory,
  getLatestProgress,
  deleteProgressLog,
};
