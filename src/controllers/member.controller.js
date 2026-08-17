const memberService = require("../services/member.service");
const { sendSuccess, ErrorCodes, sendError } = require("../utils/response");

const getAllMembers = async (req, res, next) => {
  try {
    const result = await memberService.getAllMembers();
    return sendSuccess(res, result, "Members retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await memberService.getMemberById(id);

    if (!result) {
      return sendError(res, "Member not found", ErrorCodes.NOT_FOUND, 404);
    }
    return sendSuccess(res, result, "Member retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

const getMemberByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await memberService.getMemberByUserId(userId);

    if (!result) {
      return sendError(
        res,
        "Member not found for this user",
        ErrorCodes.NOT_FOUND,
        404,
      );
    }
    return sendSuccess(res, result, "Member retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

const getMemberByUniqueId = async (req, res, next) => {
  try {
    const { uniqueMemberId } = req.body;
    if (!uniqueMemberId) {
      return sendError(
        res,
        "Unique member ID is required",
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    const result = await memberService.getMemberByUniqueId(uniqueMemberId);

    if (!result) {
      return sendError(res, "Member not found", ErrorCodes.NOT_FOUND, 404);
    }
    return sendSuccess(res, result, "Member retrieved successfully", 200);
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
      return sendError(res, "Member not found", ErrorCodes.NOT_FOUND, 404);
    }

    return sendSuccess(res, result, "Member updated successfully", 200);
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
};
