const ratingService = require('../services/rating.service');
const memberService = require('../services/member.service');
const trainerService = require('../services/trainer.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');
const { isMemberAssignedToTrainer } = require('../utils/permissionCheck');

const submitRating = async (req, res, next) => {
  try {
    const { type } = req.params;
    const payload = req.body;
    const userId = req.user.id;

    const member = await memberService.getMemberByUserId(userId);
    if (!member) {
      return sendError(
        res,
        'Member profile not found.',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    payload.member_profile_id = member.id;
    payload.rating_type = type;

    const rating = await ratingService.submitRating(payload);

    req.log.info(
      { ratingId: rating.id, ratingType: payload.rating_type, userId },
      'Rating submitted successfully',
    );

    return sendSuccess(res, rating, 'Rating submitted successfully', 201);
  } catch (error) {
    if (error.message === 'You have already rated this trainer.') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (error.message === 'You have already rated this class.') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (error.message === 'You have already rated the facility.') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (
      error.message ===
      'You must have attended a session with this trainer to rate them'
    ) {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 403);
    }
    if (error.message === 'You must have booked this class to rate it') {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 403);
    }
    if (error.message === 'Active subscription required to submit a rating') {
      return sendError(res, error.message, ErrorCodes.FORBIDDEN, 403);
    }
    if (error.message.includes('required')) {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

const getTrainerAverageRating = async (req, res, next) => {
  try {
    const { trainerId } = req.params;

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      return sendError(res, 'Trainer not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const userId = req.user.id;
    const userRole = req.user.role;

    const isOwn = userRole === 'trainer' && userId === trainer.user_id;
    const isAdminReception = userRole === 'admin' && userRole === 'reception';
    let isAssignedMember =
      userRole === 'member' &&
      (await isMemberAssignedToTrainer(userId, trainerId));

    if (!isOwn && !isAdminReception && !isAssignedMember) {
      return sendError(
        res,
        userRole === 'trainer'
          ? 'Access denied. You can only view your own rating.'
          : 'Access denied. You can only view your assigned trainer\'s rating.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const stats = await ratingService.getAverageTrainerRating(trainerId);

    return sendSuccess(
      res,
      stats,
      'Trainer rating retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getFacilityRatingSummary = async (req, res, next) => {
  try {
    const summary = await ratingService.getFacilityRatingSummary();
    return sendSuccess(
      res,
      summary,
      'Facility rating summary retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getFlaggedRatings = async (req, res, next) => {
  try {
    const { threshold = 3 } = req.query;
    const ratings = await ratingService.getFlaggedRatings(threshold);

    return sendSuccess(
      res,
      {
        count: ratings.length,
        data: ratings,
      },
      'Flagged ratings retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const moderateRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { moderation_notes } = req.body;

    const updated = await ratingService.moderateRating(id, moderation_notes);

    req.log.warn(
      { ratingId: id, userId: req.user.id },
      'Rating moderated by admin',
    );

    return sendSuccess(res, updated, 'Rating moderated successfully', 200);
  } catch (error) {
    if (error.message === 'Rating not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

module.exports = {
  submitRating,
  getTrainerAverageRating,
  getFacilityRatingSummary,
  getFlaggedRatings,
  moderateRating,
};
