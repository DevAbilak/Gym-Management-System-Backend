const subscriptionService = require('../services/subscription.service');

// CREATE SUBSCRIPTION
const createSubscription = async (req, res, next) => {
  try {
    const {
      member_profile_id,
      membership_tier_id,
      start_date,
      auto_renew,
    } = req.body;

    if (!member_profile_id || !membership_tier_id) {
      return res.status(400).json({
        error: 'member_profile_id and membership_tier_id are required',
      });
    }

    const result = await subscriptionService.createSubscription({
      member_profile_id,
      membership_tier_id,
      start_date,
      auto_renew,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// UPDATE SUBSCRIPTION STATUS
const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'status is required',
      });
    }

    const result = await subscriptionService.updateSubscriptionStatus(
      id,
      status,
    );

    if (!result) {
      return res.status(404).json({
        error: 'Subscription not found',
      });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET SUBSCRIPTION BY ID
const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await subscriptionService.getSubscriptionById(id);

    if (!result) {
      return res.status(404).json({
        error: 'Subscription not found',
      });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET ACTIVE SUBSCRIPTION
const getActiveSubscription = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;

    const result =
      await subscriptionService.getActiveSubscription(memberProfileId);

    if (!result) {
      return res.status(404).json({
        error: 'No active subscription found for this member',
      });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionById,
  getActiveSubscription,
};