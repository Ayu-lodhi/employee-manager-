const chatService = require('./chat.service');
const { emitToRoom } = require('../../config/socket');

exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await chatService.getMyRooms(req.user.sub);
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await chatService.getRoomById(req.params.id, req.user.sub);
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const room = await chatService.createRoom(req.body, req.user);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const room = await chatService.addMember(req.params.id, req.body.userId, req.user);
    res.json({ success: true, message: 'Member added', data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.params.id, req.user.sub);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await chatService.sendMessage(req.params.id, text, req.user);

    // Real-time emit to room
    emitToRoom(`chat:${req.params.id}`, 'chat:new_message', {
      _id: message._id,
      roomId: message.roomId,
      roomName: message.roomName,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      createdAt: message.createdAt,
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.archiveRoom = async (req, res) => {
  try {
    const room = await chatService.archiveRoom(req.params.id, req.user);
    res.json({ success: true, message: 'Room archived', data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createOrGetTeamRoom = async (req, res) => {
  try {
    const room = await chatService.createOrGetTeamRoom(req.params.teamId, req.user);
    res.status(201).json({ success: true, message: 'Team chat ready', data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const result = await chatService.deleteRoom(req.params.id, req.user);
    emitToRoom(`chat:${req.params.id}`, 'chat:room_deleted', { roomId: req.params.id });
    res.json({ success: true, message: 'Room deleted', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await chatService.deleteMessage(req.params.id, req.user);
    emitToRoom(`chat:${message.roomId}`, 'chat:message_deleted', {
      messageId: req.params.id,
      roomId: message.roomId,
    });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

