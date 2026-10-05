const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../auth/auth.middleware');
const AuditLog = require('../../models/AuditLog.model');
const User = require('../admin/admin.model');

router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

// Get all audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get active sessions
router.get('/sessions', async (req, res) => {
  try {
    const users = await User.find({ activeSessionId: { $ne: null } })
      .select('name email role tier lastActivity activeSessionId createdAt')
      .sort({ lastActivity: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Terminate an active session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { activeSessionId: null, lastActivity: null } },
      { new: true }
    ).select('name email role activeSessionId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Session terminated successfully', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
