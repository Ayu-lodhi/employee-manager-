const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');
const { createUserLimiter } = require('../../middleware/rateLimit.middleware');
const { validate, schemas } = require('../../middleware/validate.middleware');
const { auditLog } = require('../../middleware/audit.middleware');

router.use(protect);

// Admin + Super Admin
router.get('/users', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.getUsers);
router.post('/users', restrictTo('ADMIN', 'SUPER_ADMIN'), createUserLimiter, validate(schemas.addUser), auditLog('USER_CREATED'), adminController.addUser);
router.patch('/users/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.updateUser);

// Super Admin only
router.post('/users/:id/revoke', restrictTo('SUPER_ADMIN'), auditLog('ACCESS_REVOKED'), adminController.revokeUser);
router.post('/users/:id/reactivate', restrictTo('SUPER_ADMIN'), auditLog('ACCESS_REACTIVATED'), adminController.reactivateUser);
router.post('/users/:id/reset-password', restrictTo('SUPER_ADMIN'), auditLog('PASSWORD_RESET'), adminController.resetPassword);
router.post('/users/:id/set-password', restrictTo('SUPER_ADMIN'), auditLog('PASSWORD_SET'), adminController.setPassword);
router.delete('/users/:id', restrictTo('SUPER_ADMIN'), auditLog('USER_DELETED'), adminController.deleteUser);

module.exports = router;