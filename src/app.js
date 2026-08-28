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
const checkinRoutes = require('./routes/checkin.routes');
const trainerRoutes = require('./routes/trainer.routes');
const bookingRoutes = require('./routes/booking.routes');
const healthRoutes = require('./routes/health.routes');
const notificationRoutes = require('./routes/notification.routes');
const templateRoutes = require('./routes/template.routes');
const progressRoutes = require('./routes/progress.routes');
const logger = require('./config/logger');
const knex = require('./db/db');
const { redisClient } = require('./config/redis');
const { sendSuccess, sendError, ErrorCodes } = require('./utils/response');
const { apiLimiter } = require('./middleware/redisRateLimiter.middleware');
const { requestId } = require('./middleware/requestId.middleware');
const { isMongoConnected } = require('./config/mongo');

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(requestId);
app.use(handleRefreshToken);

// apply rate limiter to all /api routes
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/health-metrics', healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/progress', progressRoutes);

// Versioned routes
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/v1/trainers', trainerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/health-metrics', healthRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/progress', progressRoutes);

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

  // Check MongoDB
  try {
    status.dependencies.mongodb = isMongoConnected()
      ? 'connected'
      : 'disconnected';
    if (!isMongoConnected()) {
      status.status = 'degraded';
    }
  } catch (error) {
    status.dependencies.mongodb = `error: ${error.message}`;
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
