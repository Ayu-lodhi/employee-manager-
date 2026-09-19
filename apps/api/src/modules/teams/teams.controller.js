const teamService = require('./teams.service');

exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await teamService.getMyTeams(req.user.sub);
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await teamService.deleteTeam(req.params.id);
    res.status(200).json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
