// ====================================================================
// Distributed Redis Rate Limiter with In-Memory Fallback
// ====================================================================

const { redisCache } = require('../core/config/redis-cache.client');
const { logger } = require('../core/utils/logger');

// --- In-Memory Fallback State ---
const inMemoryRequests = new Map();
const inMemoryUserCreateRequests = new Map();

const GLOBAL_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const GLOBAL_MAX_REQUESTS = 500;

const CREATE_USER_WINDOW_MS = 60 * 1000; // 1 min
const CREATE_USER_MAX_REQUESTS = 5;

const getClientIdentifier = (req) => {
  if (req.user?.sub) {
    return `user:${req.user.sub}`;
  }
  return `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`;
};

// In-memory fallback for global rate limiting
const inMemoryGlobalLimiter = (req, res, next, identifier) => {
  const now = Date.now();
  const record = inMemoryRequests.get(identifier) || { count: 0, resetTime: now + GLOBAL_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + GLOBAL_WINDOW_MS;
  } else {
    record.count++;
  }

  inMemoryRequests.set(identifier, record);

  res.setHeader('X-RateLimit-Limit', GLOBAL_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, GLOBAL_MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > GLOBAL_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }

  next();
};

// In-memory fallback for user creation rate limiting
const inMemoryCreateUserLimiter = (req, res, next, identifier) => {
  const now = Date.now();
  const record = inMemoryUserCreateRequests.get(identifier) || { count: 0, resetTime: now + CREATE_USER_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + CREATE_USER_WINDOW_MS;
  } else {
    record.count++;
  }

  inMemoryUserCreateRequests.set(identifier, record);

  if (record.count > CREATE_USER_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many user creation requests, please try again later.',
    });
  }

  next();
};

exports.globalLimiter = async (req, res, next) => {
  const identifier = getClientIdentifier(req);
  const redisKey = `rl:global:${identifier}`;

  try {
    if (redisCache && redisCache.status === 'ready') {
      const results = await redisCache
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();

      if (results && results[0] && !results[0][0]) {
        const count = results[0][1];
        let ttl = results[1] ? results[1][1] : -1;

        if (ttl === -1 || count === 1) {
          await redisCache.pexpire(redisKey, GLOBAL_WINDOW_MS);
          ttl = GLOBAL_WINDOW_MS;
        }

        const resetTimestamp = Math.ceil((Date.now() + Math.max(0, ttl)) / 1000);
        res.setHeader('X-RateLimit-Limit', GLOBAL_MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, GLOBAL_MAX_REQUESTS - count));
        res.setHeader('X-RateLimit-Reset', resetTimestamp);

        if (count > GLOBAL_MAX_REQUESTS) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.',
          });
        }

        return next();
      }
    }
  } catch (err) {
    logger.warn('Redis rate limiter failed; falling back to in-memory limiter', { error: err.message });
  }

  // Fallback to in-memory limiter if Redis is unavailable or failed
  return inMemoryGlobalLimiter(req, res, next, identifier);
};

exports.createUserLimiter = async (req, res, next) => {
  const identifier = getClientIdentifier(req);
  const redisKey = `rl:create_user:${identifier}`;

  try {
    if (redisCache && redisCache.status === 'ready') {
      const results = await redisCache
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();

      if (results && results[0] && !results[0][0]) {
        const count = results[0][1];
        let ttl = results[1] ? results[1][1] : -1;

        if (ttl === -1 || count === 1) {
          await redisCache.pexpire(redisKey, CREATE_USER_WINDOW_MS);
          ttl = CREATE_USER_WINDOW_MS;
        }

        if (count > CREATE_USER_MAX_REQUESTS) {
          return res.status(429).json({
            success: false,
            message: 'Too many user creation requests, please try again later.',
          });
        }

        return next();
      }
    }
  } catch (err) {
    logger.warn('Redis user-create limiter failed; falling back to in-memory limiter', { error: err.message });
  }

  return inMemoryCreateUserLimiter(req, res, next, identifier);
};
