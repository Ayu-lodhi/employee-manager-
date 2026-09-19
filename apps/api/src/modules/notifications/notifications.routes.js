const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const { protect } = require('../auth/auth.middleware');

router.use(protect);

router.get('/', controller.getMyNotifications);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllRead);

module.exports = router;
