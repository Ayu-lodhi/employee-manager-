const User = require('../admin/admin.model');

exports.findByEmail = (email) => User.findOne({ email }).select('+password +mfa');
exports.findById = (id) => User.findById(id).select('+password +mfa');

// Reserve attempts atomically across API instances and across login challenges.
exports.reserveMfaAttempt = async (id, version) => {
  const now = new Date();
  await User.updateOne({
    _id: id, 'mfa.version': version,
    'mfa.windowStartedAt': { $lte: new Date(now.getTime() - 5 * 60 * 1000) },
  }, { $set: { 'mfa.attempts': 0, 'mfa.windowStartedAt': now } });
  return User.findOneAndUpdate({
    _id: id, isActive: true, 'mfa.version': version, 'mfa.attempts': { $lt: 5 },
  }, { $inc: { 'mfa.attempts': 1 } }, { new: true }).select('+password +mfa');
};

exports.consumeMfaCode = (user, timeStep) => User.findOneAndUpdate({
  _id: user._id, isActive: true, role: user.role, password: user.password,
  'mfa.version': user.mfa.version, 'mfa.lastStep': { $lt: timeStep },
}, { $set: { 'mfa.lastStep': timeStep } }, { new: true }).select('+password +mfa');

// No HTTP enrollment/reset: only a trusted operator may provision a factor.
exports.enrollMfa = (id, role, mfa) => User.findOneAndUpdate({
  _id: id, role, isActive: true, mfa: { $exists: false },
}, { $set: { mfa } }, { new: true });
