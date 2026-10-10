import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisQueue = ENV.REDIS_QUEUE_URL ? new Redis(ENV.REDIS_QUEUE_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: true
}) : null;

if (redisQueue) {
  redisQueue.on('error', (err) => {
    logger.error('Redis Queue Client Error', { error: err.message });
  });
}

export default redisQueue;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { redisQueue };
}
