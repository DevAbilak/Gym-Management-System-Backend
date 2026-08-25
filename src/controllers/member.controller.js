const memberService = require('../services/member.service');
const { sendSuccess, ErrorCodes, sendError } = require('../utils/response');

const getAllMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const result = await memberService.getAllMembers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });
    return sendSuccess(res, result, 'Members retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await memberService.getMemberById(id);

    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Permission checks
    const userId = req.user.id;
    const userRole = req.user.role;

    // If role = Admin or Reception --> full access
    if (userRole === 'admin' || userRole === 'reception') {
      return sendSuccess(res, member, 'Member retrieved successfully', 200);
    }

    // If role = Member --> only their own profile
    if (userRole === 'member') {
      if (userId !== member.user_id) {
        return sendError(
          res,
          'Access denied. You can only view your own profile.',
          ErrorCodes.FORBIDDEN,
          403,
        );
      }
      return sendSuccess(res, member, 'Member retrieved successfully', 200);
    }

    // TODO: needs member assignment table
    // If role = Trainer → only assigned members

    // for Unknown role → deny
    return sendError(
      res,
      'Access denied. Insufficient permissions.',
      ErrorCodes.FORBIDDEN,
      403,
    );
  } catch (error) {
    next(error);
  }
};

const getMemberByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await memberService.getMemberByUserId(userId);

    if (!result) {
      return sendError(
        res,
        'Member not found for this user',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }
    return sendSuccess(res, result, 'Member retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getMemberByUniqueId = async (req, res, next) => {
  try {
    const { uniqueMemberId } = req.params;

    const result = await memberService.getMemberByUniqueId(uniqueMemberId);

    if (!result) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }
    return sendSuccess(res, result, 'Member retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent updating protected fields
    const updates = req.body;
    delete updates.id;
    delete updates.user_id;
    delete updates.unique_member_id;
    delete updates.created_at;

    const result = await memberService.updateMember(id, updates);

    if (!result) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, result, 'Member updated successfully', 200);
  } catch (error) {
    if (error.message === 'No valid fields to update') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

// DEACTIVATE MEMBER (Admin Only)
const deactivateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await memberService.deactivateMember(id);

    if (!result) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, result, 'Member deactivated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// REACTIVATE MEMBER (Admin Only)
const reactivateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await memberService.reactivateMember(id);

    if (!result) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, result, 'Member reactivated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET CURRENT MEMBER PROFILE (Authenticated User)
const getCurrentMember = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await memberService.getMemberByUserId(userId);

    if (!result) {
      return sendError(
        res,
        'Member profile not found for this user',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    return sendSuccess(
      res,
      result,
      'Current member profile retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByUniqueId,
  getMemberByUserId,
  updateMember,
  deactivateMember,
  reactivateMember,
  getCurrentMember,
};
