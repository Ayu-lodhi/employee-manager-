const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const securityMiddleware = require('./middleware/security.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const { initSocket } = require('./config/socket');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(securityMiddleware);
app.use(globalLimiter);

app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/admin', require('./modules/admin/admin.routes'));
app.use('/api/v1/events', require('./modules/events/events.routes'));
app.use('/api/v1/applications', require('./modules/applications/applications.routes'));
app.use('/api/v1/teams', require('./modules/teams/teams.routes'));
app.use('/api/v1/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/v1/reviews', require('./modules/reviews/reviews.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/v1/certificates', require('./modules/certificates/certificates.routes'));
app.use('/api/v1/chat', require('./modules/chat/chat.routes'));
app.use('/api/v1/super-admin', require('./modules/super-admin/superAdmin.routes'));
app.use('/api/v1/stats', require('./modules/stats/stats.routes'));
app.use('/api/v1/preferences', require('./modules/users/preferences.routes'));
app.use('/api/v1/announcements', require('./modules/announcements/announcements.routes'));

app.get('/', (req, res) => {
  res.json({
    message: 'TBI API running',
    version: '3.0.0',
    realtime: 'socket.io enabled',
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Error:', err.message));

const server = http.createServer(app);
initSocket(server);
console.log('Socket.io initialized');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));