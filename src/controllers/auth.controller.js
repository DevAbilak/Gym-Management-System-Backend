const logger = require('../config/logger');
const authService = require('../services/auth.service');

// REGISTER
const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(payload);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json(result);
  } catch (error) {
    switch (error.message) {
      case 'User does not exist.Please register':
        return res.status(401).json({ error: error.message });
        break;
      case 'Account is deactivated':
        return res.status(401).json({ error: error.message });
        break;
      case 'Invalid password':
        return res.status(401).json({ error: error.message });
        break;
      default:
        next(error);
        break;
    }
  }
};

// REFRESH TOKEN
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid refresh token') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

// LOGOUT
const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await authService.logoutUser(userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, _next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Forgot password error:', error.message);
    // Don't leak internal errors to the client
    res.status(500).json({
      error: 'Unable to send reset email. Please try again later.',
    });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const result = await authService.resetPassword(email, token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'User does not exist.') {
      return res.status(400).json({ error: error.message });
    }

    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
