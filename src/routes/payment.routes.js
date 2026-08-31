const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateInitPayment,
  validateVerifyPayment,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.post(
  '/init',
  authenticate,
  validateInitPayment,
  paymentController.initPayment,
);

router.get(
  '/verify/:orderId',
  authenticate,
  validateVerifyPayment,
  paymentController.verifyPayment,
);

// ============================================================
// PUBLIC ROUTE (No authentication)
// ============================================================

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.webhookHandler,
);

module.exports = router;
