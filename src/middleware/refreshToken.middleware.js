/*
 *
 * Checks for a refresh token in the x-refresh-token header.
 * If present and valid, generates a new access token and sets it in x-access-token header.
 *
 */

const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');
const knex = require('../db/db');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET;

const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.headers['x-refresh-token'];

    // if no refresh token provided, just continue
    if (!refreshToken) {
      return next();
    }

    // Step 1: Decode and verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      // Token is invalid or expired
      if (error.name === 'TokenExpiredError') {
        // Token expired => tell frontend to logout
        res.setHeader('x-refresh-status', 'expired');
        res.setHeader('Access-Control-Expose-Headers', 'x-refresh-status');
        logger.warn('Refresh token expired for user');
        return next();
      }
      // Token is malformed or tampered
      res.setHeader('x-refresh-status', 'invalid');
      res.setHeader('Access-Control-Expose-Headers', 'x-refresh-status');
      logger.warn('Invalid refresh token signature');
      return next();
    }

    // Step 2: Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh:${decoded.id}`);
    if (!storedToken) {
      // Token was revoked (deleted from Redis)
      res.setHeader('x-refresh-status', 'revoked');
      res.setHeader('Access-Control-Expose-Headers', 'x-refresh-status');
      logger.warn(`Refresh token revoked for user ${decoded.id}`);
      return next();
    }

    if (storedToken !== refreshToken) {
      // Token mismatch (possible tampering or race condition)
      res.setHeader('x-refresh-status', 'invalid');
      res.setHeader('Access-Control-Expose-Headers', 'x-refresh-status');
      logger.warn(`Refresh token mismatch for user ${decoded.id}`);
      return next();
    }

    // Step 3: Refresh token is valid! Generate new access token
    const userResult = await knex.raw(
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = true',
      [decoded.id],
    );
    const user = userResult.rows[0];
    if (!user) {
      // user doesn't exist or deactivated
      res.setHeader('x-refresh-status', 'invalid');
      res.setHeader('Access-Control-Expose-Headers', 'x-refresh-status');
      return next();
    }

    // Generate new access token (15 minutes)
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Attach to response header
    res.setHeader('x-access-token', newAccessToken);
    res.setHeader(
      'Access-Control-Expose-Headers',
      'x-access-token, x-refresh-status',
    );

    // store in locals for debugging use
    res.locals.newAccessToken = newAccessToken;

    logger.info(`Auto-refreshed access token for user ${user.id}`);
    next();
  } catch (error) {
    logger.error('Refresh token middleware error:', error.message);
    next();
  }
};

module.exports = { handleRefreshToken };
