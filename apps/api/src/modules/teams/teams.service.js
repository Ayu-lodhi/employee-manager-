const Team = require('./teams.model');

exports.getAllTeams = async () => {
  return await Team.find().sort({ createdAt: -1 });
};

exports.getMyTeams = async (userId) => {
  return await Team.find({ leadId: userId }).sort({ createdAt: -1 });
};

exports.createTeam = async (data) => {
  return await Team.create(data);
};

exports.deleteTeam = async (id) => {
  const team = await Team.findByIdAndDelete(id);
  if (!team) throw new Error('Team not found');
  return team;
};
