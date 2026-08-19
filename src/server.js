require('dotenv').config();
require('./config/env');
const app = require('./app');
const logger = require('./config/logger');
const { testRedisConnection, redisClient } = require('./config/redis');
const knex = require('./db/db');
const { connectMongo, disconnectMongo } = require('./config/mongo');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Test Upstash Redis before starting
  const redisOk = await testRedisConnection();
  if (!redisOk) {
    logger.error('Redis is not reachable. Shutting down.');
    process.exit(1);
  }

  // 3. Connect to MongoDB
  try {
    await connectMongo();
  } catch (error) {
    logger.warn(
      { error: error.message },
      'MongoDB connection failed. continuing without MongoDB',
    );
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received: closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed.');

      // close database and redis connection
      knex
        .destroy()
        .then(() => {
          logger.info('PostgreSQL connection pool closed.');
          return redisClient.quit();
        })
        .then(() => {
          logger.info('Redis connection closed.');
          return disconnectMongo();
        })
        .then(() => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        })
        .catch((err) => {
          logger.error(
            { error: err.message },
            'Error during graceful shutdown',
          );
          process.exit(1);
        });
    });
  });
};

startServer();
