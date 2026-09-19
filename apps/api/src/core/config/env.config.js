import dotenv from 'dotenv';
dotenv.config();

export const ENV = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/tbi_platform',
  REDIS_CACHE_URL: process.env.REDIS_CACHE_URL || 'redis://localhost:6379/0',
  REDIS_PUBSUB_URL: process.env.REDIS_PUBSUB_URL || 'redis://localhost:6380/1',
  REDIS_QUEUE_URL: process.env.REDIS_QUEUE_URL || 'redis://localhost:6381/2',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_secret_jwt_access_must_be_long',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_secret_jwt_refresh_must_be_long',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d'
});
