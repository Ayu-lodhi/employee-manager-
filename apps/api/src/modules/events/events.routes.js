const express = require('express');
const router = express.Router();
const eventController = require('./events.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

// All routes require login
router.use(protect);

// Anyone logged-in can view events
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Only Admin/Super Admin can create/update/delete
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN'), eventController.createEvent);
router.patch('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), eventController.updateEvent);
router.delete('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), eventController.deleteEvent);

module.exports = router;
