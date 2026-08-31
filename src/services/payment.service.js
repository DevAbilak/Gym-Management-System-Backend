const axios = require('axios');
const crypto = require('crypto');
const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const STARPAY_API_URL = process.env.STARPAY_API_URL;
const API_SECRET = process.env.STARPAY_API_SECRET;
const CALLBACK_SECRET = process.env.STARPAY_CALLBACK_SECRET;

// Generate HMAC-SHA256 signature for webhook verification
const createSignature = (payload, secret, timestamp) => {
  const body = JSON.stringify(payload);
  const message = `${timestamp}.${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
};

// Verify incoming webhook signature
const verifyWebhookSignature = (payload, timestamp, signature, secret) => {
  const expectedSignature = createSignature(payload, secret, timestamp);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const createTransaction = async (params) => {
  const {
    amount,
    description,
    customerName,
    customerPhoneNumber,
    customerEmail,
    items,
    metadata,
    redirectUrl,
    callbackURL,
  } = params;

  const payload = {
    amount,
    currency: 'ETB',
    description,
    customerName,
    customerPhoneNumber,
    items,
    redirectUrl: redirectUrl || process.env.STARPAY_REDIRECT_URL,
    callbackURL: callbackURL || process.env.STARPAY_WEBHOOK_URL,
    metadata,
  };

  if (customerEmail) payload.customerEmail = customerEmail;

  const response = await axios.post(`${STARPAY_API_URL}/trdp/order`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET,
    },
  });

  if (response.data.status !== 'success') {
    throw new Error(response.data.message || 'Failed to create payment order');
  }

  return {
    orderId: response.data.data.order_id,
    billRefNo: response.data.data.billRefNo,
    paymentUrl: response.data.data.paymentUrl,
  };
};

const verifyPayment = async (orderId) => {
  const response = await axios.post(
    `${STARPAY_API_URL}/trdp/verify`,
    { orderId },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET,
      },
    },
  );

  if (response.data.status !== 'success') {
    throw new Error(response.data.message || 'Payment verification failed');
  }

  return response.data.data;
};

const processWebhook = async (payload, timestamp, signature) => {
  // verify signature
  if (!timestamp || !signature) {
    throw new Error('Missing webhook headers');
  }

  const isValid = verifyWebhookSignature(
    payload,
    timestamp,
    signature,
    CALLBACK_SECRET,
  );
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // extract data
  const {
    billRefNo,
    status,
    amount,
    externalReferenceId: _externalReferenceId,
    payment_type,
    receipt_url: _receipt_url,
  } = payload;

  // only process successful payments
  if (status !== 'PAID' && status !== 'SETTLED') {
    return { message: `Ignored status: ${status}`, status };
  }

  // retrieve subscription_id from redis
  const cached = await redisClient.get(`payment:${billRefNo}`);
  if (!cached) {
    // If not found in Redis, try to find by externalReferenceId (if stored)
    throw new Error('Transaction reference not found');
  }
  const { subscription_id } = JSON.parse(cached);

  // begin db transaction
  const trx = await knex.transaction();

  try {
    const invoiceResult = await trx.raw(
      `
      INSERT INTO invoices (
        subscription_id,
        invoice_number,
        amount,
        currency,
        status,
        payment_method,
        payment_reference,
        due_date,
        paid_at
      ) VALUES (?, ?, ?, 'ETB', 'paid', ?, ?, CURRENT_DATE, NOW())
      RETURNING *
    `,
      [
        subscription_id,
        `INV-${Date.now()}`,
        amount,
        payment_type || 'starpay',
        billRefNo,
      ],
    );

    // update subscription status to active
    const subscriptionResult = await trx.raw(
      `
      UPDATE subscriptions 
      SET status = 'active', updated_at = NOW()
      WHERE id = ? 
      RETURNING *
    `,
      [subscription_id],
    );

    // clean up redis key
    await redisClient.del(`payment:${billRefNo}`);

    // invalidate KPIs cache
    const { invalidateKpiCache } = require('./admin.service');
    await invalidateKpiCache();

    await trx.commit();

    return {
      success: true,
      subscription: subscriptionResult.rows[0],
      invoice: invoiceResult.rows[0],
    };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

module.exports = { createTransaction, verifyPayment, processWebhook };
