const Redis = require('ioredis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL;

let redisClient;
let testRedisConnection;

// If we are in test mode and REDIS_URL is not set, use a mock
if (process.env.NODE_ENV === 'test') {
  logger.info('Test mode: Using mock Redis client');

  // Create a mock Redis client with the same interface as ioredis
  const createMockRedis = () => {
    const store = new Map();
    const mockClient = {
      get: async (key) => store.get(key) || null,
      set: async (key, value, ..._args) => {
        store.set(key, value);
        return 'OK';
      },
      del: async (key) => {
        store.delete(key);
        return 1;
      },
      keys: async (pattern) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(store.keys()).filter((k) => regex.test(k));
      },
      exists: async (key) => (store.has(key) ? 1 : 0),
      expire: async (key, _seconds) => {
        store.set(key, store.get(key));
        return 1;
      },
      ping: async () => 'PONG',
      flushall: async () => {
        store.clear();
        return 'OK';
      },
      quit: async () => 'OK',
      on: () => {},
      setex: async (key, _seconds, value) => {
        store.set(key, value);
        return 'OK';
      },
      incr: async (key) => {
        const current = parseInt(store.get(key) || '0', 10);
        const next = current + 1;
        store.set(key, String(next));
        return next;
      },
      ttl: async (key) => (store.has(key) ? 100 : -2),
      call: async (..._args) => {
        // Handle custom Redis commands if needed
        return 'OK';
      },
    };
    return mockClient;
  };

  redisClient = createMockRedis();
  testRedisConnection = async () => true;
} else {
  // Real Redis connection
  if (!redisUrl) {
    logger.error('REDIS_URL is not defined in .env');
    process.exit(1);
  }

  redisClient = new Redis(redisUrl, {
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

  testRedisConnection = async () => {
    try {
      const pong = await redisClient.ping();
      logger.info(`Upstash Redis ping: ${pong}`);
      return true;
    } catch (error) {
      logger.error('Redis ping failed:', error.message);
      return false;
    }
  };
}

module.exports = { redisClient, testRedisConnection };
