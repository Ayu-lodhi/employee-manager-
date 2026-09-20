const mongoose = require('mongoose');
const Team = require('./teams.model');
const User = require('../admin/admin.model');

exports.getAllTeams = async () => {
  const teams = await Team.find()
    .populate('members', 'name email role')
    .populate('leadId', 'name email role')
    .sort({ createdAt: -1 });
  return teams;
};

exports.getTeamById = async (id) => {
  const team = await Team.findById(id)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
  if (!team) throw new Error('Team not found');
  return team;
};

exports.getMyTeams = async (userId) => {
  const teams = await Team.find({
    $or: [{ leadId: userId }, { members: userId }],
  })
    .populate('members', 'name email role')
    .populate('leadId', 'name email role')
    .sort({ createdAt: -1 });
  return teams;
};

exports.createTeam = async (data) => {
  const { name, eventId, eventTitle, leadId, description } = data;

  if (!name) throw new Error('Team name is required');

  const team = await Team.create({
    name,
    eventId: eventId || null,
    eventTitle: eventTitle || '',
    leadId: leadId || null,
    description: description || '',
    chatRoomId: `team-${Date.now()}`,  // Auto-generate chat room ID
    members: leadId ? [leadId] : [],
    memberCount: leadId ? 1 : 0,
  });

  // Set lead name if leadId given
  if (leadId) {
    const lead = await User.findById(leadId).select('name');
    if (lead) {
      team.leadName = lead.name;
      // Add team to user's teamId field
      await User.findByIdAndUpdate(leadId, { teamId: team._id });
      await team.save();
    }
  }

  return await Team.findById(team._id).populate('members', 'name email role').populate('leadId', 'name email role');
};

exports.addMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  const user = await User.findById(userId).select('name email role');
  if (!user) throw new Error('User not found');

  // Check if already a member
  if (team.members.some((m) => m.toString() === userId)) {
    throw new Error(`${user.name} is already in this team`);
  }

  team.members.push(userId);
  team.memberCount = team.members.length;
  await team.save();

  // Also update user's teamId field
  await User.findByIdAndUpdate(userId, { teamId: team._id });

  return await Team.findById(teamId)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
};

exports.removeMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  team.members = team.members.filter((m) => m.toString() !== userId);
  team.memberCount = team.members.length;
  await team.save();

  return await Team.findById(teamId)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
};

exports.deleteTeam = async (id) => {
  const team = await Team.findByIdAndDelete(id);
  if (!team) throw new Error('Team not found');
  return team;
};
