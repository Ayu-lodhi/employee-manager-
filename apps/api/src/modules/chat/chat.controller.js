const Message = require('./chat.model');

exports.getRoomMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId, roomName, text } = req.body;
    if (!roomId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'roomId and text required' });
    }

    const message = await Message.create({
      roomId,
      roomName: roomName || '',
      senderId: req.user.sub,
      senderName: req.user.name || 'User',
      text: text.trim(),
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
