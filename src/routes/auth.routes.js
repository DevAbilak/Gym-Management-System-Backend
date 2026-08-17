const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validators.middleware');
const {
  authLimiter,
  sensitiveRoutesLimiter,
} = require('../middleware/redisRateLimiter.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validateRegistration,
  authController.register,
);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post(
  '/forgot-password',
  sensitiveRoutesLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  sensitiveRoutesLimiter,
  validateResetPassword,
  authController.resetPassword,
);

// protected route(authentication required)
router.get('/logout', authenticate, authController.logout);

module.exports = router;
