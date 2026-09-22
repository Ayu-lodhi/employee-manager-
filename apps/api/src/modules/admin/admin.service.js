const bcrypt = require('bcryptjs');
const User = require('./admin.model');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../../services/email.service');

const generateDefaultPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = 'TBI@';
  for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  pass += Math.floor(Math.random() * 90 + 10);
  return pass;
};

const LOGIN_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
    mustChangePassword: true,
    isActive: true,
  });

  // Send welcome email (fire and forget)
  sendWelcomeEmail({
    to: user.email,
    name: user.name,
    role: user.role,
    tempPassword,
    loginUrl: LOGIN_URL,
  }).catch((err) => console.error('Welcome email failed:', err.message));

  return { user: user.toObject({ virtuals: false }), tempPassword };
};

exports.updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

// REVOKE — full implementation
exports.revokeUser = async (id, reason, notes, adminId) => {
  // 1. Find user
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  // 2. Prevent revoking Super Admin
  if (user.role === 'SUPER_ADMIN') {
    throw new Error('Cannot revoke a Super Admin account');
  }

  // 3. Prevent self-revoke
  if (user._id.toString() === adminId.toString()) {
    throw new Error('You cannot revoke your own account');
  }

  // 4. Prevent revoking already-inactive
  if (!user.isActive) {
    throw new Error(`${user.name}'s account is already inactive`);
  }

  // 5. Deactivate + reset password to prevent re-login
  user.isActive = false;
  user.password = await bcrypt.hash(generateDefaultPassword(), 12);
  user.mustChangePassword = true;
  await user.save();

  // 6. Create audit log entry
  try {
    const AuditLog = require('../../models/AuditLog.model');
    await AuditLog.create({
      action: 'ACCESS_REVOKED',
      performedBy: adminId,
      targetUser: user._id,
      targetName: user.name,
      reason,
      resource: `/api/v1/admin/users/${id}/revoke`,
      method: 'POST',
    });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    reason,
    notes,
    revokedAt: new Date(),
  };
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('User not found');
  return user;
};

// RESET PASSWORD — new temp password + email with one-time use
exports.resetPassword = async (id, adminId = null) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  // Prevent resetting Super Admin
  if (user.role === 'SUPER_ADMIN') {
    throw new Error('Cannot reset Super Admin password this way');
  }

  // Generate new temp password
  const tempPassword = generateDefaultPassword();
  user.password = await bcrypt.hash(tempPassword, 12);
  user.mustChangePassword = true;  // force change on next login
  await user.save();

  // Email the temp password
  let emailSent = false;
  try {
    const result = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      tempPassword,
      loginUrl: LOGIN_URL,
    });
    emailSent = result.success;
  } catch (err) {
    console.error('Reset email failed:', err.message);
  }

  // Audit log
  try {
    const AuditLog = require('../../models/AuditLog.model');
    await AuditLog.create({
      action: 'PASSWORD_RESET',
      performedBy: adminId || null, // Set by controller via req.user
      targetUser: user._id,
      targetName: user.name,
      reason: 'Admin-initiated password reset',
      resource: `/api/v1/admin/users/${id}/reset-password`,
      method: 'POST',
    });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }

  return { user: user.toObject({ virtuals: false }), tempPassword, emailSent };
};

exports.setPassword = async (id, newPassword) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();
  return { user: user.toObject({ virtuals: false }) };
};