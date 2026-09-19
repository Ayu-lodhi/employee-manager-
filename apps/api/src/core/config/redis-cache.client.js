import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisCache = new Redis(ENV.REDIS_CACHE_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

redisCache.on('error', (err) => {
  logger.error('Redis Cache Client Error', { error: err.message });
});
