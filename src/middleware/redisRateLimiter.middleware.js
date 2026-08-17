const { redisClient } = require("../config/redis");
const { sendError, ErrorCodes } = require("../utils/response");
const logger = require("../config/logger");

const createRateLimiter = (windowMs, max, keyPrefix, keyGenerator = null) => {
  const defaultKeyGenerator = (req) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    return `${keyPrefix}:${ip}:${req.route?.path || req.path}`;
  };

  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : defaultKeyGenerator(req);
      const redisKey = `ratelimit${key}`;

      // atomic increment
      const current = await redisClient.incr(redisKey);

      // set expiry on the key for the first request
      if (current === 1) {
        await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
      }

      // get remaining TTL(for response headers)
      const ttl = await redisClient.ttl(redisKey);
      const remainingTime = ttl > 0 ? ttl : 0;

      // check if limit exceeded
      if (current > max) {
        logger.warn(
          {
            ip: req.ip,
            path: req.path,
            current,
            max,
            key: redisKey,
          },
          "Rate limit exceeded",
        );

        // set rate limit headers
        res.setHeader("RateLimit-Limit", max);
        res.setHeader("RateLimit-Remaining", 0);
        res.setHeader(
          "RateLimit-Reset",
          Math.ceil(Date.now() / 1000) + remainingTime,
        );

        return sendError(
          res,
          `Too many requests. Please try again in ${remainingTime} seconds.`,
          ErrorCodes.RATE_LIMIT,
          429,
        );
      }

      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", max - current);
      res.setHeader(
        "RateLimit-Reset",
        Math.ceil(Date.now() / 1000) + remainingTime,
      );

      next();
    } catch (error) {
      logger.error(
        { error: error.message },
        "Rate limiter Redis error — allowing request",
      );
      next();
    }
  };
};

// limiter for auth routes (20 request per 15 minutes)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, //15minutes
  20,
  "auth",
  // custom key generator => ip + email (if available)
  (req) => {
    const ip = req.ip || "unknown";
    const email =
      req.body?.email || req.query?.email || req.user?.email || "unknown";
    return `auth:${ip}:${email}`;
  },
);

// limiter for booking routes (10 attempts per hour)
const bookingLimiter = createRateLimiter(
  60 * 60 * 1000, //1hour
  10,
  "booking",
  (req) => {
    const userId = req.user?.id || "anonymous";
    const ip = req.ip || "unknown";
    return `booking:${userId}:${ip}`;
  },
);

// general api limiter (100 requests per minute)
const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100,
  "api",
);

// sensitive routes limiter (5 requests per day)
const sensitiveRoutesLimiter = createRateLimiter(
  24 * 60 * 60 * 1000, // 1 day
  5,
  "sensitive",
  (req) => {
    const ip = req.ip || "unknown";
    const email =
      req.body?.email || req.query?.email || req.user?.email || "unknown";
    return `auth:${ip}:${email}`;
  },
);

module.exports = {
  createRateLimiter,
  authLimiter,
  bookingLimiter,
  apiLimiter,
  sensitiveRoutesLimiter,
};
