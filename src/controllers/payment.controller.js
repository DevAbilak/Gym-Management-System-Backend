const subscriptionService = require('../services/subscription.service');
const paymentService = require('../services/payment.service');
const knex = require('../db/db');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

const initPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { member_profile_id, membership_tier_id, start_date, auto_renew } =
      req.body;

    // permission check
    const memberCheck = await knex.raw(
      `
      SELECT user_id FROM member_profiles WHERE id = ?
    `,
      [member_profile_id],
    );

    if (memberCheck.rows.length === 0) {
      return sendError(res, 'Member not found.', ErrorCodes.NOT_FOUND, 404);
    }

    const isOwn =
      userRole === 'member' && memberCheck.rows[0].user_id === userId;
    const isAdminReception = userRole === 'admin' || userRole === 'reception';
    if (!isOwn && !isAdminReception) {
      return sendError(
        res,
        'Access denied. You can only initiate payment for yourself.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    const result = await subscriptionService.createPendingSubscription({
      member_profile_id,
      membership_tier_id,
      start_date,
      auto_renew,
    });

    req.log.info(
      {
        subscriptionId: result.subscription.id,
        billRefNo: result.payment.billRefNo,
        userId,
      },
      'Payment initiated successfully',
    );

    return sendSuccess(res, result, 'Payment initiated successfully', 201);
  } catch (error) {
    if (error.message === 'Member already has an active subscription') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (
      error.message.includes('Member not found') ||
      error.message.includes('Invalid membership tier')
    ) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    if (error.message.includes('Failed to create payment order')) {
      return sendError(
        res,
        'Payment gateway error. Please try again later.',
        ErrorCodes.INTERNAL_ERROR,
        500,
      );
    }
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const status = await paymentService.verifyPayment(orderId);

    req.log.debug(
      { orderId, status: status.status },
      'Payment status verified',
    );
    return sendSuccess(res, status, 'Payment status retrieved', 200);
  } catch (error) {
    if (error.message.includes('Payment verification failed')) {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    return next(error);
  }
};

const webhookHandler = async (req, res, _next) => {
  try {
    // Extract headers required for signature verification
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];

    const payload = req.body;

    const result = await paymentService.processWebhook(
      payload,
      timestamp,
      signature,
    );

    req.log.info(
      {
        billRefNo: payload.billRefNo,
        status: payload.status,
        subscriptionId: result.subscription?.id,
      },
      'Webhook processed successfully',
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    req.log.error(
      {
        error: error.message,
        billRefNo: req.body?.billRefNo,
      },
      'Webhook processing error',
    );

    // IMPORTANT: Even if we fail internally, we return 200 to StarPay.
    // If we return 500, StarPay will keep retrying the webhook.
    // We return a 200 with "error" status so we can manually investigate the logs.
    return res.status(200).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  initPayment,
  verifyPayment,
  webhookHandler,
};
