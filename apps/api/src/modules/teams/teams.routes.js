const express = require('express');
const router = express.Router();
const teamController = require('./teams.controller');
const { protect, restrictTo } = require('../auth/auth.middleware');

router.use(protect);

router.get('/', teamController.getTeams);
router.get('/me', teamController.getMyTeams);
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN'), teamController.createTeam);
router.delete('/:id', restrictTo('ADMIN', 'SUPER_ADMIN'), teamController.deleteTeam);

module.exports = router;
