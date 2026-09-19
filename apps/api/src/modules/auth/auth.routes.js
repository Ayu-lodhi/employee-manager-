const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('./auth.middleware');

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;