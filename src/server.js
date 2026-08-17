require('dotenv').config();
require('./config/env');
const app = require('./app');
const logger = require('./config/logger');
const { testRedisConnection } = require('./config/redis');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Test Upstash Redis before starting
  const redisOk = await testRedisConnection();
  if (!redisOk) {
    logger.error('Redis is not reachable. Shutting down.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received: closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  });
};

startServer();
