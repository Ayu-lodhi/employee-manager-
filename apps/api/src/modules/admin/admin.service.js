const bcrypt = require('bcryptjs');
const User = require('./admin.model');

// Generate default password: TBI@ + 6 chars + 2 digits
const generateDefaultPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = 'TBI@';
  for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  pass += Math.floor(Math.random() * 90 + 10);
  return pass;
};

exports.getAllUsers = async () => {
  return await User.find().select('-password').sort({ createdAt: -1 });
};

exports.createUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new Error('Email already exists');

  const tempPassword = generateDefaultPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || '',
    role: data.role || 'T1_VOLUNTEER',
    password: hashedPassword,
    mustChangePassword: true,   // ⭐ Force password change on first login
    isActive: true,
  });

  // TODO: Send tempPassword via email + SMS in production
  return { user: user.toObject({ virtuals: false }), tempPassword };
};

exports.updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

exports.revokeUser = async (id, reason, notes, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  user.isActive = false;
  await user.save();

  return {
    userId: user._id,
    name: user.name,
    reason,
    notes,
    revokedBy: adminId,
    revokedAt: new Date(),
  };
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('User not found');
  return user;
};

// ⭐ Reset password — generate a NEW temp password + force change
exports.resetPassword = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  const tempPassword = generateDefaultPassword();
  user.password = await bcrypt.hash(tempPassword, 12);
  user.mustChangePassword = true;
  await user.save();

  return { user: user.toObject({ virtuals: false }), tempPassword };
};

// ⭐ Super Admin sets a custom password directly (no forced change)
exports.setPassword = async (id, newPassword) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false; // Directly set — no forced change
  await user.save();

  return { user: user.toObject({ virtuals: false }) };
};