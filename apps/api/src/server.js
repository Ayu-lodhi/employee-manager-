const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const securityMiddleware = require('./middleware/security.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// SECURITY FIRST
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(securityMiddleware);
app.use(globalLimiter);

// ROUTES
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

app.get('/', (req, res) => {
  res.json({
    message: 'TBI API running',
    version: '2.0.0',
    modules: ['auth', 'admin', 'events', 'applications', 'teams', 'attendance', 'reviews', 'notifications', 'certificates', 'chat', 'super-admin'],
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// DATABASE
console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log(' MongoDB Connected'))
  .catch((err) => console.error(' MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));