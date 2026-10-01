import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisQueue = new Redis(ENV.REDIS_QUEUE_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: true
});

redisQueue.on('error', (err) => {
  logger.error('Redis Queue Client Error', { error: err.message });
});
