const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');
const { createUserLimiter } = require('../../middleware/rateLimit.middleware');
const { validate, schemas } = require('../../middleware/validate.middleware');
const { auditLog } = require('../../middleware/audit.middleware');

router.use(protect);

// ============ ADMIN + SUPER ADMIN ============
// Users can be viewed and created by both Admin and Super Admin
router.get('/users', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.getUsers);

router.post(
  '/users',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  createUserLimiter,
  validate(schemas.addUser),
  auditLog('USER_CREATED'),
  adminController.addUser
);

router.patch('/users/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), adminController.updateUser);

// ============ SUPER ADMIN ONLY ============
// Revoke access
router.post(
  '/users/:id/revoke',
  restrictTo('SUPER_ADMIN'),
  auditLog('ACCESS_REVOKED'),
  adminController.revokeUser
);

// Reset password (generates new temp password)
router.post(
  '/users/:id/reset-password',
  restrictTo('SUPER_ADMIN'),
  auditLog('PASSWORD_RESET'),
  adminController.resetPassword
);

// Set custom password
router.post(
  '/users/:id/set-password',
  restrictTo('SUPER_ADMIN'),
  auditLog('PASSWORD_SET'),
  adminController.setPassword
);

// Delete user
router.delete(
  '/users/:id',
  restrictTo('SUPER_ADMIN'),
  auditLog('USER_DELETED'),
  adminController.deleteUser
);

module.exports = router;