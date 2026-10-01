const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../auth/auth.middleware');
const AuditLog = require('../../models/AuditLog.model');

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

module.exports = router;
