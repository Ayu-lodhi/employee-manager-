const ChatRoom = require('./chatRoom.model');
const Message = require('./chat.model');
const User = require('../admin/admin.model');
const { notify } = require('../notifications/notifications.service');

class ChatService {

  // List rooms where current user is a member
  async getMyRooms(userId) {
    return await ChatRoom.find({ members: userId, isArchived: false })
      .populate('createdBy', 'name')
      .sort({ lastMessageAt: -1 });
  }

  // Get single room
  async getRoomById(roomId, userId) {
    const room = await ChatRoom.findById(roomId)
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
    if (!room) throw new Error('Room not found');

    const isMember = room.members.some((m) => m._id.toString() === userId);
    if (!isMember) throw new Error('You are not a member of this room');

    return room;
  }

  // Create a new chat room
  async createRoom(data, requester) {
    const { name, description, teamId, teamName, eventId, eventTitle, memberIds } = data;

    if (!name || name.trim().length < 2) {
      throw new Error('Room name must be at least 2 characters');
    }

    // Ensure creator is in members list
    const members = new Set([requester.sub]);
    if (Array.isArray(memberIds)) {
      for (const id of memberIds) {
        if (id && id.trim() !== '') members.add(id);
      }
    }

    // Validate each member exists
    const memberList = Array.from(members);
    const existing = await User.find({ _id: { $in: memberList } }).select('_id name');
    if (existing.length !== memberList.length) {
      throw new Error('One or more members do not exist');
    }

    const room = await ChatRoom.create({
      name: name.trim(),
      description: description || '',
      teamId: teamId || null,
      teamName: teamName || '',
      eventId: eventId || null,
      eventTitle: eventTitle || '',
      createdBy: requester.sub,
      createdByName: requester.name || 'User',
      members: memberList,
      memberCount: memberList.length,
    });

    // Notify each new member except creator
    for (const m of memberList) {
      if (m !== requester.sub) {
        await notify(m, 'chat', 'Added to Chat Room', `You've been added to "${room.name}".`);
      }
    }

    return await ChatRoom.findById(room._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
  }

  // Add member to existing room
  async addMember(roomId, userId, requester) {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new Error('Room not found');

    // Only creator or admin can add
    const isCreator = room.createdBy.toString() === requester.sub;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);
    if (!isCreator && !isAdmin) throw new Error('Only the room creator can add members');

    const user = await User.findById(userId).select('name');
    if (!user) throw new Error('User not found');

    if (room.members.some((m) => m.toString() === userId)) {
      throw new Error(`${user.name} is already in this room`);
    }

    room.members.push(userId);
    room.memberCount = room.members.length;
    await room.save();

    await notify(userId, 'chat', 'Added to Chat Room', `You've been added to "${room.name}".`);

    return await ChatRoom.findById(roomId)
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
  }

  // Get messages for a room
  async getMessages(roomId, userId) {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new Error('Room not found');

    const isMember = room.members.some((m) => m.toString() === userId);
    if (!isMember) throw new Error('You are not a member of this room');

    return await Message.find({ roomId }).sort({ createdAt: 1 }).limit(200);
  }

  // Send message
  async sendMessage(roomId, text, user) {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new Error('Room not found');

    const isMember = room.members.some((m) => m.toString() === user.sub);
    if (!isMember) throw new Error('You are not a member of this room');

    if (!text || text.trim().length === 0) throw new Error('Message cannot be empty');

    const message = await Message.create({
      roomId,
      roomName: room.name,
      senderId: user.sub,
      senderName: user.name || 'User',
      text: text.trim(),
    });

    room.lastMessageAt = new Date();
    await room.save();

    return message;
  }

  // Archive room
  async archiveRoom(roomId, requester) {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new Error('Room not found');

    const isCreator = room.createdBy.toString() === requester.sub;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);
    if (!isCreator && !isAdmin) throw new Error('Only the creator can archive this room');

    room.isArchived = true;
    await room.save();
    return room;
  }

  // Create or get chat room for a specific team
  async createOrGetTeamRoom(teamId, requester) {
    const Team = require('../teams/teams.model');

    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');

    // Permission: requester must be team lead OR admin
    const isLead = team.leadId && team.leadId.toString() === requester.sub;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);
    if (!isLead && !isAdmin) throw new Error('Only the Team Lead or Admin can manage the team chat');

    // Build default members list from team
    const memberList = new Set(team.members.map((m) => m.toString()));
    if (team.leadId) memberList.add(team.leadId.toString());
    memberList.add(requester.sub); // ensure requester is in

    // Look for existing room for this team
    let room = await ChatRoom.findOne({ teamId });

    if (room) {
      // Merge new members
      for (const id of memberList) {
        if (!room.members.some((m) => m.toString() === id)) {
          room.members.push(id);
          await notify(id, 'chat', 'Added to Chat Room', `You've been added to "${room.name}".`);
        }
      }
      room.memberCount = room.members.length;
      await room.save();
      return await ChatRoom.findById(room._id)
        .populate('members', 'name email role')
        .populate('createdBy', 'name');
    }

    // Create new room
    const roomName = `${team.name}${team.eventTitle ? ` — ${team.eventTitle}` : ''}`;
    room = await ChatRoom.create({
      name: roomName,
      description: `Team chat for ${team.name}`,
      teamId: team._id,
      teamName: team.name,
      eventId: team.eventId || null,
      eventTitle: team.eventTitle || '',
      createdBy: requester.sub,
      createdByName: requester.name || 'User',
      members: Array.from(memberList),
      memberCount: memberList.size,
    });

    // Notify all members except creator
    for (const id of Array.from(memberList)) {
      if (id !== requester.sub) {
        await notify(id, 'chat', 'Team Chat Created', `You've been added to "${room.name}".`);
      }
    }

    return await ChatRoom.findById(room._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name');
  }

  // Delete room + all its messages
  async deleteRoom(roomId, requester) {
    const room = await ChatRoom.findById(roomId);
    if (!room) throw new Error('Room not found');

    const isCreator = room.createdBy.toString() === requester.sub;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);
    if (!isCreator && !isAdmin) throw new Error('Only the room creator or Admin can delete this room');

    // Delete all messages in this room
    await Message.deleteMany({ roomId });

    // Delete the room
    await ChatRoom.findByIdAndDelete(roomId);

    // Notify remaining members
    for (const memberId of room.members) {
      if (memberId.toString() !== requester.sub) {
        await notify(memberId, 'chat', 'Chat Room Deleted', `The room "${room.name}" has been deleted.`);
      }
    }

    return { deletedRoomId: roomId, deletedMessages: true };
  }

  // Delete a single message
  async deleteMessage(messageId, requester) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');

    // Only sender or admin can delete
    const isSender = message.senderId.toString() === requester.sub;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);
    if (!isSender && !isAdmin) throw new Error('You can only delete your own messages');

    await Message.findByIdAndDelete(messageId);
    return message;
  }
}

module.exports = new ChatService();
