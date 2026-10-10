import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisCache = ENV.REDIS_CACHE_URL ? new Redis(ENV.REDIS_CACHE_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
}) : null;

if (redisCache) {
  redisCache.on('error', (err) => {
    logger.error('Redis Cache Client Error', { error: err.message });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { redisCache };
  module.exports.redisCache = redisCache;
}
