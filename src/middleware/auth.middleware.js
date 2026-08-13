const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization token required. Please log in first.',
    });
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

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please refresh your token or log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token. Please log in again.',
      });
    }
    // Unknown error
    return res.status(401).json({
      error: 'Authentication failed. Please log in again.',
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required. Please log in first.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
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
      return res.status(403).json({
        error: 'Access denied. You can only access your own resources.',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireOwnership,
};
