const Redis = require('ioredis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL is not defined in .env');
  process.exit(1);
}

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    if (times > 5) {
      logger.error(`Redis retry exhausted after ${times} attempts`);
      return null;
    }
    return Math.min(times * 200, 3000);
  },
  tls: {
    rejectUnauthorized: false,
  },
});

redisClient.on('connect', () => {
  logger.info('Upstash Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('Upstash Redis error:', err.message);
});

const testRedisConnection = async () => {
  try {
    const pong = await redisClient.ping();
    logger.info(`Upstash Redis ping: ${pong}`);
    return true;
  } catch (error) {
    logger.error('Redis ping failed:', error.message);
    return false;
  }
};

// ---------- REFRESH TOKEN HELPERS ----------
// TTL is set to 7 days (604800 seconds) by default
const storeRefreshToken = async (userId, token, ttlSeconds = 604800) => {
  await redisClient.set(`refresh:${userId}`, token, 'EX', ttlSeconds);
};

const getRefreshToken = async (userId) => {
  return await redisClient.get(`refresh:${userId}`);
};

const revokeRefreshToken = async (userId) => {
  await redisClient.del(`refresh:${userId}`);
};

module.exports = {
  redisClient,
  testRedisConnection,
  storeRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
};
