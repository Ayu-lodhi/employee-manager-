const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

// All admin routes require authentication + ADMIN or SUPER_ADMIN
router.use(protect);
router.use(restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.patch('/users/:id', adminController.updateUser);
router.post('/users/:id/revoke', adminController.revokeUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;