const Notification = require('./notifications.model');

// Create a single notification
exports.notify = async (userId, type, title, message) => {
  try {
    return await Notification.create({ userId, type, title, message });
  } catch (err) {
    console.error('Notify failed:', err.message);
  }
};

// Notify multiple users at once
exports.notifyMany = async (userIds, type, title, message) => {
  try {
    const docs = userIds.map((userId) => ({ userId, type, title, message }));
    return await Notification.insertMany(docs);
  } catch (err) {
    console.error('NotifyMany failed:', err.message);
  }
};

// Notify everyone except the actor
exports.notifyAll = async (excludeUserId, type, title, message, User) => {
  try {
    const users = await User.find({ _id: { $ne: excludeUserId }, isActive: true }).select('_id');
    return await exports.notifyMany(users.map((u) => u._id), type, title, message);
  } catch (err) {
    console.error('NotifyAll failed:', err.message);
  }
};
