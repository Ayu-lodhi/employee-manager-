const express = require('express');
const router = express.Router();
const teamController = require('./teams.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

router.get('/', teamController.getTeams);
router.get('/me', teamController.getMyTeams);
router.get('/:id', teamController.getTeam);

router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN'), teamController.createTeam);
router.post('/:id/members', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), teamController.addMember);
router.delete('/:id/members/:userId', restrictTo('ADMIN', 'SUPER_ADMIN', 'T3_EXECUTIVE'), teamController.removeMember);
router.delete('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), teamController.deleteTeam);

module.exports = router;
