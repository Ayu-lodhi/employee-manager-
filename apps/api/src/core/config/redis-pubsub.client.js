import Redis from 'ioredis';
import { ENV } from './env.config.js';
import { logger } from '../utils/logger.js';

export const redisPubSub = new Redis(ENV.REDIS_PUBSUB_URL, {
  maxRetriesPerRequest: null, // Pub/Sub requires long-lived uninterrupted connection
  enableReadyCheck: true,
  lazyConnect: true
});

redisPubSub.on('error', (err) => {
  logger.error('Redis PubSub Client Error', { error: err.message });
});
