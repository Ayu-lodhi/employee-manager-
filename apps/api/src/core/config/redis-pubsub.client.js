import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisPubSub = ENV.REDIS_PUBSUB_URL ? new Redis(ENV.REDIS_PUBSUB_URL, {
  maxRetriesPerRequest: null, // Pub/Sub requires long-lived uninterrupted connection
  enableReadyCheck: true,
  lazyConnect: true
}) : null;

if (redisPubSub) {
  redisPubSub.on('error', (err) => {
    logger.error('Redis PubSub Client Error', { error: err.message });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { redisPubSub };
  module.exports.redisPubSub = redisPubSub;
}

