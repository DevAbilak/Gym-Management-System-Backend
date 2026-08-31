const subscriptionService = require('../services/subscription.service');
const memberService = require('../services/member.service');
const { sendSuccess, sendError, ErrorCodes } = require('../utils/response');

// CREATE SUBSCRIPTION
const createSubscription = async (req, res, next) => {
  try {
    const { member_profile_id, membership_tier_id, start_date, auto_renew } =
      req.body;

    const member = await memberService.getMemberById(member_profile_id);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const existing =
      await subscriptionService.getActiveSubscription(member_profile_id);
    if (existing) {
      return sendError(
        res,
        'Member already has an active subscription',
        ErrorCodes.CONFLICT,
        409,
      );
    }

    const subscription = await subscriptionService.createSubscription({
      member_profile_id,
      membership_tier_id,
      start_date,
      auto_renew,
    });

    req.log.info(
      { subscriptionId: subscription.id, memberProfileId: member_profile_id },
      'Subscription created directly (Admin/Reception)',
    );

    return sendSuccess(
      res,
      subscription,
      'Subscription created successfully',
      201,
    );
  } catch (error) {
    if (error.message === 'Invalid or inactive membership tier') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

// UPDATE SUBSCRIPTION STATUS
const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await subscriptionService.getSubscriptionById(id);
    if (!existing) {
      return sendError(
        res,
        'Subscription not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    const updated = await subscriptionService.updateSubscriptionStatus(
      id,
      status,
    );

    req.log.info(
      { subscriptionId: id, oldStatus: existing.status, newStatus: status },
      'Subscription status updated',
    );

    return sendSuccess(
      res,
      updated,
      'Subscription status updated successfully',
      200,
    );
  } catch (error) {
    if (error.message === 'Invalid subscription status') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

// GET SUBSCRIPTION BY ID
const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return sendError(
        res,
        'Subscription not found',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    return sendSuccess(
      res,
      subscription,
      'Subscription retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

// GET ACTIVE SUBSCRIPTION
const getActiveSubscription = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const member = await memberService.getMemberById(memberProfileId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const isOwn = userRole === 'member' && userId === member.user_id;
    const isAdminReception = userRole === 'admin' && userRole === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own subscription.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const subscription =
      await subscriptionService.getActiveSubscription(memberProfileId);

    if (!subscription) {
      return sendError(
        res,
        'No active subscription found for this member',
        ErrorCodes.NOT_FOUND,
        404,
      );
    }

    return sendSuccess(
      res,
      subscription,
      'Active subscription retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getSubscriptionByMember = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const member = await memberService.getMemberById(memberProfileId);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }

    // permission check
    const isOwn = userRole === 'member' && member.user_id === userId;
    const isAdminReception = userRole === 'admin' || userRole === 'reception';

    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only view your own subscriptions.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const result = await subscriptionService.getSubscriptionByMember(
      memberProfileId,
      parseInt(page),
      parseInt(limit),
    );

    return sendSuccess(
      res,
      result,
      'Subscriptions retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionById,
  getActiveSubscription,
  getSubscriptionByMember,
};
