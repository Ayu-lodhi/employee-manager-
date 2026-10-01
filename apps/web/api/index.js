import app from '../../api/src/server.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ayushlodhi88_db_user:9IzJqRATQYl1hERt@ac-gkiqwag-shard-00-00.wiv7fca.mongodb.net:27017,ac-gkiqwag-shard-00-01.wiv7fca.mongodb.net:27017,ac-gkiqwag-shard-00-02.wiv7fca.mongodb.net:27017/tbi_db?ssl=true&replicaSet=atlas-6g5sz6-shard-0&authSource=admin&appName=Cluster0';

export default async function handler(req, res) {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    } catch (err) {
      console.error('MongoDB serverless connection error:', err.message);
    }
  }

  if (req.url && !req.url.startsWith('/api') && req.url.startsWith('/v1')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
