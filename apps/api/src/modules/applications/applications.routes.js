const express = require('express');
const router = express.Router();
const appController = require('./applications.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

router.get('/', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), appController.getApplications);
router.get('/me', appController.getMyApplications);
router.post('/', restrictTo('T1_VOLUNTEER', 'T2_ASSOCIATE'), appController.createApplication);
router.patch('/:id/status', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), appController.updateStatus);

module.exports = router;
