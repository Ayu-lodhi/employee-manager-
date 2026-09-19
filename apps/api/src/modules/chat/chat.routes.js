const express = require('express');
const router = express.Router();
const controller = require('./chat.controller');
const { protect } = require('../auth/auth.middleware');

router.use(protect);

router.get('/rooms/:roomId/messages', controller.getRoomMessages);
router.post('/messages', controller.sendMessage);

module.exports = router;
