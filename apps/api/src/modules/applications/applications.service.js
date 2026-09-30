const Application = require('./applications.model');
const Team = require('../teams/teams.model');
const User = require('../admin/admin.model');
const { notify } = require('../notifications/notifications.service');

class ApplicationService {

  // Student applies to a team/event
  async create(data, user) {
    const { teamId, role, notes } = data;
    if (!teamId) throw new Error('Team is required');

    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');

    // Check existing application
    const existing = await Application.findOne({
      studentId: user.sub,
      teamId,
    });
    if (existing) throw new Error('You have already applied to this team');

    const userDoc = await User.findById(user.sub).select('name email');

    const app = await Application.create({
      studentId: user.sub,
      studentName: userDoc ? userDoc.name : (user.name || 'Unknown'),
      studentEmail: userDoc ? userDoc.email : (user.email || ''),
      teamId,
      teamName: team.name,
      eventId: team.eventId || null,
      eventTitle: team.eventTitle || '',
      role: role || 'Team Member',
      notes: notes || '',
      status: 'pending',
      appliedAt: new Date(),
    });

    // Notify team lead
    if (team.leadId) {
      await notify(
        team.leadId,
        'application',
        'New Application',
        `${userDoc ? userDoc.name : user.name} applied to your team "${team.name}".`
      );
    }

    return app;
  }

  // Alias for backward compatibility
  async createApplication(data, user) {
    return this.create(data, user);
  }

  // T3/Admin lists applications
  async getAll(filters = {}, requester = {}) {
    const query = {};

    // T3 only sees applications for their teams
    if (requester && requester.role === 'T3_EXECUTIVE') {
      const teams = await Team.find({ leadId: requester.sub }).select('_id');
      const teamIds = teams.map((t) => t._id);
      query.teamId = { $in: teamIds };
    }

    if (filters && filters.status) query.status = filters.status;
    if (filters && filters.teamId) query.teamId = filters.teamId;
    if (filters && filters.eventId) query.eventId = filters.eventId;

    return await Application.find(query).sort({ appliedAt: -1 }).limit(200);
  }

  // Alias for backward compatibility
  async getAllApplications(filters, requester) {
    return this.getAll(filters, requester);
  }

  // Student's own applications
  async getMine(userId) {
    return await Application.find({ studentId: userId }).sort({ appliedAt: -1 });
  }

  // Alias for backward compatibility
  async getMyApplications(userId) {
    return this.getMine(userId);
  }

  // Update status
  async updateStatus(id, status, requester, rejectionReason) {
    const valid = ['approved', 'rejected', 'waitlisted', 'pending'];
    if (!valid.includes(status)) throw new Error('Invalid status');

    const app = await Application.findById(id);
    if (!app) throw new Error('Application not found');

    const requesterRole = typeof requester === 'object' && requester ? requester.role : null;
    const requesterSub = typeof requester === 'object' && requester ? requester.sub : requester;

    // Permission check: T3 must be lead of the team
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requesterRole);
    if (!isAdmin && requesterRole === 'T3_EXECUTIVE') {
      const team = await Team.findById(app.teamId);
      if (!team || team.leadId?.toString() !== requesterSub) {
        throw new Error('Not authorized to update this application');
      }
    }

    app.status = status;
    app.reviewedBy = requesterSub;
    app.reviewedAt = new Date();
    if (status === 'rejected') app.rejectionReason = rejectionReason || '';

    await app.save();

    // On approval → add to team + chat + send notification
    if (status === 'approved') {
      const team = await Team.findById(app.teamId);
      if (team) {
        // Add to team members if not already
        if (!team.members.some((m) => m.toString() === app.studentId.toString())) {
          team.members.push(app.studentId);
          team.memberCount = team.members.length;
          await team.save();
        }

        // Add to event members
        if (team.eventId) {
          const Event = require('../events/events.model');
          const event = await Event.findById(team.eventId);
          if (event && !event.members.some((m) => m.toString() === app.studentId.toString())) {
            event.members.push(app.studentId);
            event.memberCount = event.members.length;
            await event.save();
          }
        }

        // Add to team chat room
        const ChatRoom = require('../chat/chatRoom.model');
        const chatRoom = await ChatRoom.findOne({ teamId: team._id });
        if (chatRoom && !chatRoom.members.some((m) => m.toString() === app.studentId.toString())) {
          chatRoom.members.push(app.studentId);
          chatRoom.memberCount = chatRoom.members.length;
          await chatRoom.save();
        }
      }
    }

    // Notify student
    const title = status === 'approved'
      ? 'Application Approved'
      : status === 'rejected'
      ? 'Application Rejected'
      : 'You are on the Waitlist';

    const message = status === 'approved'
      ? `You've been approved for "${app.teamName || app.eventTitle || 'the team'}". You've been added to the team chat.`
      : status === 'rejected'
      ? `Your application for "${app.teamName || app.eventTitle || 'the team'}" was not selected.`
      : `You've been waitlisted for "${app.teamName || app.eventTitle || 'the team'}".`;

    await notify(app.studentId, 'application', title, message);

    return app;
  }
}

module.exports = new ApplicationService();
