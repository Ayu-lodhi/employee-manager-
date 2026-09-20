const AuditLog = require('../models/AuditLog.model');

const auditLog = (action) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await AuditLog.create({
          action,
          performedBy: req.user?.sub || null,
          performedByName: req.user?.name || req.user?.email || '',
          targetId: req.params?.id || null,
          targetType: 'Event',
          details: {
            body: req.body,
            params: req.params,
          },
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('AuditLog error:', err.message);
      }
    }
  });
  next();
};

module.exports = { auditLog };
