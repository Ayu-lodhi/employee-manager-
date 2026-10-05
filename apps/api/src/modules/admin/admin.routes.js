const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');
const { createUserLimiter, bulkImportLimiter } = require('../../middleware/rateLimit.middleware');
const { validate, schemas } = require('../../middleware/validate.middleware');
const { auditLog } = require('../../middleware/audit.middleware');

// PUBLIC — one-time password reset link endpoints (no auth required)
router.get('/reset-password/verify', adminController.verifyResetToken);
router.post('/reset-password/complete', adminController.completePasswordReset);

router.use(protect);

// Admin + Super Admin
router.get('/users', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.getUsers);
router.post('/users', restrictTo('ADMIN', 'SUPER_ADMIN'), createUserLimiter, validate(schemas.addUser), auditLog('USER_CREATED'), adminController.addUser);
router.post('/users/bulk', restrictTo('ADMIN', 'SUPER_ADMIN'), bulkImportLimiter, express.json({ limit: '2mb' }), validate(schemas.bulkUsers), auditLog('BULK_USERS_IMPORTED'), adminController.bulkImportUsers);
router.patch('/users/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.updateUser);
router.patch('/users/:id/tier', restrictTo('ADMIN', 'SUPER_ADMIN'), createUserLimiter, require('../profile/profile.controller').updateUserTier);
router.post('/users/:id/reset-session', restrictTo('ADMIN', 'SUPER_ADMIN'), auditLog('SESSION_RESET'), adminController.resetUserSession);

// Super Admin only
router.patch('/users/:id/role', restrictTo('SUPER_ADMIN'), adminController.updateUserRole);
router.patch('/users/:id/permissions', restrictTo('SUPER_ADMIN'), adminController.updateUserPermissions);
router.post('/users/:id/revoke', restrictTo('SUPER_ADMIN'), auditLog('ACCESS_REVOKED'), adminController.revokeUser);
router.post('/users/:id/reactivate', restrictTo('SUPER_ADMIN'), auditLog('ACCESS_REACTIVATED'), adminController.reactivateUser);
router.post('/users/:id/reset-password', restrictTo('SUPER_ADMIN'), auditLog('PASSWORD_RESET'), adminController.resetPassword);
router.post('/users/:id/set-password', restrictTo('SUPER_ADMIN'), auditLog('PASSWORD_SET'), adminController.setPassword);
router.post('/users/:id/change-email', restrictTo('SUPER_ADMIN'), auditLog('EMAIL_CHANGED'), adminController.changeEmail);
router.delete('/users/:id', restrictTo('SUPER_ADMIN'), auditLog('USER_DELETED'), adminController.deleteUser);

module.exports = router;