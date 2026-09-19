const express = require('express');
const router = express.Router();
const attController = require('./attendance.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

router.get('/team/:teamName', attController.getByTeam);
router.get('/me', attController.getMyAttendance);
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), attController.markAttendance);
router.patch('/:id', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), attController.updateStatus);

module.exports = router;
