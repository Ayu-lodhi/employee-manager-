import app from '../../api/src/server.js';

export default function handler(req, res) {
  if (req.url && !req.url.startsWith('/api') && req.url.startsWith('/v1')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
