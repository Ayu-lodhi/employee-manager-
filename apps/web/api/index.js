import { createRequire } from 'node:module';
import mongoose from 'mongoose';

const require = createRequire(import.meta.url);

let app;
let initError = null;
try {
  app = require('../server/server.js');
} catch (e) {
  initError = e;
  console.error('Server module load error:', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (initError) {
    console.error('Server initialization error:', initError);
    return res.status(503).json({
      success: false,
      message: 'Service is temporarily unavailable. Please try again shortly.',
    });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    }
  } catch (err) {
    console.error('MongoDB serverless connection error:', err.message);
  }

  if (req.url && !req.url.startsWith('/api') && req.url.startsWith('/v1')) {
    req.url = '/api' + req.url;
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('Unhandled serverless error:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again shortly.',
    });
  }
}
