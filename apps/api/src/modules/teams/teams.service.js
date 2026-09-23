const Team = require('./teams.model');
const User = require('../admin/admin.model');
const Event = require('../events/events.model');
const { notify } = require('../notifications/notifications.service');

exports.getAllTeams = async () => {
  return await Team.find()
    .populate('members', 'name email role')
    .populate('leadId', 'name email role')
    .sort({ createdAt: -1 });
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
    chatRoomId: `team-${Date.now()}`,
    members: leadId ? [leadId] : [],
    memberCount: leadId ? 1 : 0,
  });

  if (leadId) {
    const lead = await User.findById(leadId).select('name');
    if (lead) {
      team.leadName = lead.name;
      await User.findByIdAndUpdate(leadId, { teamId: team._id });
      await team.save();
    }
  }

  return await Team.findById(team._id)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
};

exports.addMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  const user = await User.findById(userId).select('name email role');
  if (!user) throw new Error('User not found');

  if (team.members.some((m) => m.toString() === userId)) {
    throw new Error(`${user.name} is already in this team`);
  }

  team.members.push(userId);
  team.memberCount = team.members.length;
  await team.save();

  await User.findByIdAndUpdate(userId, { teamId: team._id });

  // If team belongs to an event, also add to event.members
  if (team.eventId) {
    const event = await Event.findById(team.eventId);
    if (event && !event.members.some((m) => m.toString() === userId)) {
      event.members.push(userId);
      event.memberCount = event.members.length;
      await event.save();
    }
  }

  await notify(userId, 'system', 'Added to Team', `You've been added to "${team.name}".`);


  return await Team.findById(teamId)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
};

// REMOVE MEMBER — with cascade to event
exports.removeMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  const user = await User.findById(userId).select('name');
  const userName = user?.name || 'Member';

  // Remove from team
  team.members = team.members.filter((m) => m.toString() !== userId);
  team.memberCount = team.members.length;
  await team.save();

  // Cascade: If team belongs to an event, check if user is in ANY OTHER team of that event
  if (team.eventId) {
    const otherTeams = await Team.find({
      eventId: team.eventId,
      _id: { $ne: teamId },
      members: userId,
    });

    // If user not in any other team → remove from event too
    if (otherTeams.length === 0) {
      const event = await Event.findById(team.eventId);
      if (event) {
        event.members = event.members.filter((m) => m.toString() !== userId);
        event.memberCount = event.members.length;
        await event.save();

        // Notify
        await notify(userId, 'system', 'Removed from Event', `You've been removed from "${event.title}" along with team "${team.name}".`);
      }
    } else {
      // Still in other teams — only notify about team removal
      await notify(userId, 'system', 'Removed from Team', `You've been removed from team "${team.name}".`);
    }
  }

  return await Team.findById(teamId)
    .populate('members', 'name email role')
    .populate('leadId', 'name email role');
};

exports.deleteTeam = async (id) => {
  const team = await Team.findById(id);
  if (!team) throw new Error('Team not found');

  // Cascade: Remove all team members from event if they're not in other teams
  if (team.eventId) {
    const event = await Event.findById(team.eventId);
    if (event) {
      for (const memberId of team.members) {
        const otherTeams = await Team.find({
          eventId: team.eventId,
          _id: { $ne: id },
          members: memberId,
        });
        if (otherTeams.length === 0) {
          event.members = event.members.filter((m) => m.toString() !== memberId);
        }
      }
      event.memberCount = event.members.length;
      await event.save();
    }
  }

  await Team.findByIdAndDelete(id);
  return team;
};

// Get all unique members from teams where user is lead or member
exports.getMyTeamMembers = async (userId) => {
  const Team = require('./teams.model');
  const User = require('../admin/admin.model');

  // Find all teams where user is lead OR member
  const teams = await Team.find({
    $or: [{ leadId: userId }, { members: userId }],
  }).select('members leadId');

  // Collect unique member IDs
  const memberIds = new Set();
  for (const team of teams) {
    if (team.leadId) memberIds.add(team.leadId.toString());
    for (const m of team.members) memberIds.add(m.toString());
  }

  // Remove self
  memberIds.delete(userId.toString());

  if (memberIds.size === 0) return [];

  // Fetch user details
  const users = await User.find({ _id: { $in: Array.from(memberIds) }, isActive: true })
    .select('name email role')
    .sort({ name: 1 });

  return users;
};

// Get all unique members from events where user is head or member
exports.getMyEventMembers = async (userId) => {
  const Event = require('../events/events.model');
  const User = require('../admin/admin.model');

  const events = await Event.find({
    $or: [{ headId: userId }, { members: userId }],
  }).select('members headId');

  const memberIds = new Set();
  for (const ev of events) {
    if (ev.headId) memberIds.add(ev.headId.toString());
    for (const m of ev.members) memberIds.add(m.toString());
  }

  memberIds.delete(userId.toString());

  if (memberIds.size === 0) return [];

  return await User.find({ _id: { $in: Array.from(memberIds) }, isActive: true })
    .select('name email role')
    .sort({ name: 1 });
};

// Get team members from a specific team
exports.getTeamMembers = async (teamId, userId) => {
  const Team = require('./teams.model');
  const User = require('../admin/admin.model');

  const team = await Team.findById(teamId).select('members leadId');
  if (!team) throw new Error('Team not found');

  // Check if requester is a member
  const isMember = team.members.some((m) => m.toString() === userId) ||
    (team.leadId && team.leadId.toString() === userId);
  if (!isMember) throw new Error('You are not a member of this team');

  const memberIds = new Set(team.members.map((m) => m.toString()));
  if (team.leadId) memberIds.add(team.leadId.toString());
  memberIds.delete(userId.toString());

  if (memberIds.size === 0) return [];

  return await User.find({ _id: { $in: Array.from(memberIds) }, isActive: true })
    .select('name email role')
    .sort({ name: 1 });
};

