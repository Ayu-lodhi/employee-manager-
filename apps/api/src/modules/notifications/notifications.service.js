const Notification = require('./notifications.model');
const { emitToUser } = require('../../config/socket');

exports.notify = async (userId, type, title, message) => {
  try {
    const notif = await Notification.create({ userId, type, title, message });

    emitToUser(userId, 'notification:new', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      isRead: false,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (err) {
    console.error('Notify failed:', err.message);
  }
};

exports.notifyMany = async (userIds, type, title, message) => {
  try {
    const docs = userIds.map((userId) => ({ userId, type, title, message }));
    const created = await Notification.insertMany(docs);

    for (const notif of created) {
      emitToUser(notif.userId, 'notification:new', {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: false,
        createdAt: notif.createdAt,
      });
    }

    return created;
  } catch (err) {
    console.error('NotifyMany failed:', err.message);
  }
};

exports.notifyAll = async (excludeUserId, type, title, message, User) => {
  try {
    const users = await User.find({ _id: { $ne: excludeUserId }, isActive: true }).select('_id');
    return await exports.notifyMany(users.map((u) => u._id), type, title, message);
  } catch (err) {
    console.error('NotifyAll failed:', err.message);
  }
};
