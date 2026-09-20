const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

// Self check-in / check-out (any logged-in user)
router.post('/check-in', controller.checkIn);
router.post('/check-out', controller.checkOut);
router.get('/me', controller.getMyAttendance);
router.get('/today', controller.getTodayStatus);

// Team view + manual mark (T3/Admin)
router.get('/team', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.getByTeam);
router.get('/team/stats', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.getTeamStats);
router.post('/manual', restrictTo('T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'), controller.manualMark);

module.exports = router;
