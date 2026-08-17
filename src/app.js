const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { setupSwagger } = require('./config/swagger');
const { handleRefreshToken } = require('./middleware/refreshToken.middleware');
const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const adminRoutes = require('./routes/admin.routes');
const classRoutes = require('./routes/class.routes');
const logger = require('./config/logger');
const knex = require('./db/db');
const { redisClient } = require('./config/redis');
const { sendSuccess, sendError, ErrorCodes } = require('./utils/response');
const { apiLimiter } = require('./middleware/redisRateLimiter.middleware');

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(handleRefreshToken);

app.use((req, res, next) => {
  // attaching logger to request for easy logging inside controllers
  req.log = logger.child({ reqId: req.id });
  next();
});

// apply rate limiter to all /api routes
app.use('/api', apiLimiter);

// public routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);

// admin routes
app.use('/api/admin', adminRoutes);

// Versioned routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/admin', adminRoutes);

// health check
app.get('/health', async (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {},
  };

  // check PostgreSQL
  try {
    await knex.raw('SELECT 1');
    status.dependencies.postgres = 'connected';
  } catch (error) {
    status.dependencies.postgres = `error: ${error.message}`;
    status.status = 'degraded';
  }

  // check redis
  try {
    await redisClient.ping();
    status.dependencies.redis = 'connected';
  } catch (error) {
    status.dependencies.redis = `error:${error.message}`;
    status.status = 'degraded';
  }

  const httpStatus = status.status === 'ok' ? 200 : 503;

  sendSuccess(res, status, 'health status fetched', httpStatus);
});

// SWAGGER DOCS
setupSwagger(app);

// 404 Handler
app.use('/*splat', (req, res) => {
  sendError(res, 'Not found', ErrorCodes.NOT_FOUND, 404);
});

// Global Error Handler
app.use((err, req, res, _next) => {
  logger.error(
    { error: err.stack, path: req.path, method: req.method },
    'Global error caught',
  );

  // Handle validation errors from express-validator
  if (err.array && err.array().length > 0) {
    return sendError(
      res,
      err
        .array()
        .map((e) => `${e.param}: ${e.msg}`)
        .join(', '),
      ErrorCodes.VALIDATION_ERROR,
      400,
    );
  }

  // Handle JWT errors
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', ErrorCodes.TOKEN_EXPIRED, 401);
  }
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', ErrorCodes.TOKEN_INVALID, 401);
  }

  // Handle database unique violation
  if (err.code === '23505') {
    return sendError(
      res,
      'Duplicate entry. Resource already exists.',
      ErrorCodes.CONFLICT,
      409,
    );
  }
  // Default
  const status = err.status || 500;
  const code = err.code || ErrorCodes.INTERNAL_ERROR;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  sendError(res, message, code, status);
});

module.exports = app;
