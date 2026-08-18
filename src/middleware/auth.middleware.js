const jwt = require('jsonwebtoken');
const { sendError, ErrorCodes } = require('../utils/response');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Authorization token required. Please log in first.',
      ErrorCodes.UNAUTHORIZED,
      401,
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    // verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug(
      { userId: req.user.id, role: req.user.role },
      'User authenticated successfully',
    );
    next();
  } catch (error) {
    // Ensuring headers are exposed even on error responses
    res.setHeader(
      'Access-Control-Expose-Headers',
      (res.getHeader('Access-Control-Expose-Headers') || '') +
        ', x-access-token, x-refresh-status',
    );
    if (error.name === 'TokenExpiredError') {
      logger.warn({ ip: req.ip }, 'Token expired');
      return sendError(
        res,
        'Token expired. Please refresh your token or log in again.',
        ErrorCodes.TOKEN_EXPIRED,
        401,
      );
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn({ ip: req.ip, error: error.message }, 'Invalid token');
      return sendError(
        res,
        'Invalid token. Please log in again.',
        ErrorCodes.TOKEN_INVALID,
        401,
      );
    }
    // Unknown error
    logger.error({ ip: req.ip, error: error.message }, 'Authentication error');
    return sendError(
      res,
      'Authentication failed. Please log in again.',
      ErrorCodes.UNAUTHORIZED,
      401,
    );
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // check if user is authenticated
    if (!req.user) {
      logger.warn(
        { ip: req.ip, path: req.path },
        'Authorization attempted without authentication',
      );
      return sendError(
        res,
        'Authentication required. Please log in first.',
        ErrorCodes.UNAUTHORIZED,
        401,
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        {
          userId: req.user.id,
          role: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        },
        'Access denied: insufficient permissions',
      );
      return sendError(
        res,
        `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    logger.debug(
      { userId: req.user.id, role: req.user.role, path: req.path },
      'Authorization granted',
    );
    next();
  };
};

const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required',
        ErrorCodes.UNAUTHORIZED,
        401,
      );
    }

    // For routes where the user ID is in params (e.g., GET /api/members/:id)
    const targetUserId = req.params[paramName];

    // If the route doesn't have a user ID param, skip ownership check
    if (!targetUserId) {
      return next();
    }

    // Admin and receptionist can access any user's data
    if (req.user.role === 'admin' || req.user.role === 'reception') {
      return next();
    }

    // Otherwise, user can only access their own data
    if (req.user.id !== targetUserId) {
      logger.warn(
        {
          userId: req.user.id,
          targetUserId,
          path: req.path,
          role: req.user.role,
        },
        'Ownership check failed: user tried to access another user\'s resource',
      );
      return sendError(
        res,
        'Access denied. You can only access your own resources.',
        ErrorCodes.FORBIDDEN,
        403,
      );
    }

    logger.debug(
      { userId: req.user.id, targetUserId, path: req.path },
      'Ownership check passed',
    );

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireOwnership,
};
