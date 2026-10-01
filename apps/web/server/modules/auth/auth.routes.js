const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect, protectPasswordChange } = require('./auth.middleware');

router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.post('/login', authController.login);
router.post('/mfa/verify', authController.verifyMfa);
router.get('/me', protect, authController.getMe);
router.post('/change-password', protectPasswordChange, authController.changePassword);

module.exports = router;
