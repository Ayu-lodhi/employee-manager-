const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

// Self check-in / check-out (T1/T2/T3)
router.post('/check-in', controller.selfCheckIn);
router.post('/check-out', controller.selfCheckOut);
router.get('/me', controller.getMyAttendance);
router.get('/my-stats', controller.getMyStats);
router.get('/today', controller.getTodayStatus);

// Team attendance (T3 lead)
router.get('/team', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.getTeamAttendance);
router.get('/team/stats', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.getTeamStats);
router.get('/team/history', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.getTeamHistory);
router.post('/mark', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.markAttendance);
router.get('/download', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.downloadSheet);

module.exports = router;
