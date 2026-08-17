const authService = require('../services/auth.service');
const { ErrorCodes, sendError, sendSuccess } = require('../utils/response');

// REGISTER
const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(
      res,
      result,
      result.message || 'Registration successful',
      201,
    );
  } catch (error) {
    req.log.error({ error: error.message }, 'Registration error');
    if (error.message === 'Email already registered') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    next(error);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    req.log.error({ error: error.message }, 'login error');
    switch (error.message) {
      case 'User does not exist.Please register':
        return sendError(res, error.message, ErrorCodes.UNAUTHORIZED, 401);
        break;
      case 'Account is deactivated':
        return sendError(res, error.message, ErrorCodes.UNAUTHORIZED, 401);
        break;
      case 'Invalid password':
        return sendError(res, error.message, ErrorCodes.UNAUTHORIZED, 401);
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
      return sendError(
        res,
        'Refresh token required',
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return sendSuccess(res, result, 'Token refreshed successfully', 200);
  } catch (error) {
    req.log.error({ error: error.message }, 'token refreshing error');
    if (error.message === 'Invalid refresh token') {
      return sendError(
        res,
        error.message,
        ErrorCodes.REFRESH_TOKEN_INVALID,
        401,
      );
    }
    if (error.message === 'User not found') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
    }
    next(error);
  }
};

// LOGOUT
const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await authService.logoutUser(userId);

    return sendSuccess(
      res,
      result,
      result.message || 'Logged out successfully',
      200,
    );
  } catch (error) {
    req.log.error({ error: error.message }, 'logout error');
    next(error);
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res, _next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email, req.log);
    return sendSuccess(
      res,
      result,
      result.message || 'Reset link sent if email exists',
      200,
    );
  } catch (error) {
    req.log.error('Forgot password error:', error.message);
    // Don't leak internal errors to the client
    return sendError(
      res,
      'Unable to send reset email. Please try again later.',
      ErrorCodes.INTERNAL_ERROR,
      500,
    );
  }
};

// RESET PASSWORD
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const result = await authService.resetPassword(email, token, newPassword);
    return sendSuccess(
      res,
      result,
      result.message || 'Password updated successfully',
      200,
    );
  } catch (error) {
    req.log.error({ error: error.message }, 'Reset password error');
    if (error.message === 'Invalid or expired reset token') {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (error.message === 'User does not exist.') {
      return sendError(res, error.message, ErrorCodes.NOT_FOUND, 404);
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
