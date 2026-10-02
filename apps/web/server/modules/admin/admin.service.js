const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./admin.model');
const { sendWelcomeEmail, sendPasswordResetLinkEmail, sendProfileUpdatedEmail, sendPasswordChangedEmail, sendEmailChangedEmail } = require('../../services/email.service');

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
  // C6: Allowlist only safe profile fields — block role, isActive, mustChangePassword, password
  const allowed = ['name', 'phone', 'skills', 'bio', 'availability'];
  const safeData = {};
  allowed.forEach((k) => { if (data[k] !== undefined) safeData[k] = data[k]; });

  const user = await User.findByIdAndUpdate(id, safeData, { new: true }).select('-password');
  if (!user) throw new Error('User not found');

  if (Object.keys(safeData).length > 0) {
    sendProfileUpdatedEmail({
      to: user.email,
      name: user.name,
      updatedFields: Object.keys(safeData),
      byAdmin: true,
    }).catch((err) => console.error('Admin profile update email failed:', err.message));
  }

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
  user.passwordChangeStartedAt = null;
  user.password = await bcrypt.hash(generateDefaultPassword(), 12);
  user.mustChangePassword = true;
  await user.save();

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    reason,
    notes,
    revokedAt: new Date(),
  };
};

// REACTIVATE — restore revoked access with new temp password
exports.reactivateUser = async (id, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  if (user.role === 'SUPER_ADMIN') {
    throw new Error('Cannot reactivate via this action');
  }

  if (user.isActive) {
    throw new Error(`${user.name}'s account is already active`);
  }

  // Generate new temp password (old one was reset at revoke time)
  const tempPassword = generateDefaultPassword();
  user.passwordChangeStartedAt = null;
  user.password = await bcrypt.hash(tempPassword, 12);
  user.isActive = true;
  user.mustChangePassword = true;  // Force password change on next login
  await user.save();

  // Send welcome email with new credentials
  sendWelcomeEmail({
    to: user.email,
    name: user.name,
    role: user.role,
    tempPassword,
    loginUrl: LOGIN_URL,
  }).catch((err) => console.error('Reactivate email failed:', err.message));

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    tempPassword,
    reactivatedAt: new Date(),
  };
};

// C7: deleteUser — guard against Super Admin and self-delete
exports.deleteUser = async (id, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  if (user.role === 'SUPER_ADMIN') throw new Error('Cannot delete a Super Admin account');
  if (id.toString() === adminId?.toString()) throw new Error('You cannot delete your own account');
  await User.findByIdAndDelete(id);
  return user;
};

// RESET PASSWORD — generates a ONE-TIME reset link and emails it to the user.
exports.resetPassword = async (id) => {
  const user = await User.findById(id).select('+passwordResetToken +passwordResetExpiry');
  if (!user) throw new Error('User not found');
  if (user.role === 'SUPER_ADMIN') throw new Error('Cannot reset Super Admin password this way');

  // Generate a cryptographically secure one-time token (hex, 48 chars)
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Store a SHA-256 hash (never store raw tokens in DB)
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Token expires in 1 hour
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${LOGIN_URL}/reset-password?token=${rawToken}&id=${String(user._id)}`;

  // Email the link
  let emailSent = false;
  try {
    const result = await sendPasswordResetLinkEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
    emailSent = result.success;
  } catch (err) {
    console.error('Reset link email failed:', err.message);
  }

  return { user: user.toObject({ virtuals: false }), emailSent };
};

// VERIFY TOKEN — check a one-time reset link token (does NOT consume it yet)
exports.verifyResetToken = async (id, rawToken) => {
  const user = await User.findById(id).select('+passwordResetToken +passwordResetExpiry');
  if (!user) throw new Error('Invalid or expired reset link');
  if (!user.passwordResetToken || !user.passwordResetExpiry) throw new Error('Invalid or expired reset link');
  if (new Date() > user.passwordResetExpiry) throw new Error('This reset link has expired. Please ask an admin to send a new one.');

  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const valid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordResetToken, 'hex'));
  if (!valid) throw new Error('Invalid or expired reset link');

  return { name: user.name, email: user.email };
};

// COMPLETE RESET — set new password and consume the token
exports.completePasswordReset = async (id, rawToken, newPassword) => {
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Password must be at least 8 characters');
  if (Buffer.byteLength(newPassword, 'utf8') > 72) throw new Error('Password must not exceed 72 UTF-8 bytes');
  if (!/[A-Z]/.test(newPassword)) throw new Error('Password must contain an uppercase letter');
  if (!/[a-z]/.test(newPassword)) throw new Error('Password must contain a lowercase letter');
  if (!/[0-9]/.test(newPassword)) throw new Error('Password must contain a number');
  if (!/[^A-Za-z0-9]/.test(newPassword)) throw new Error('Password must contain a special character');

  const user = await User.findById(id).select('+passwordResetToken +passwordResetExpiry');
  if (!user) throw new Error('Invalid or expired reset link');
  if (!user.passwordResetToken || !user.passwordResetExpiry) throw new Error('Invalid or expired reset link');
  if (new Date() > user.passwordResetExpiry) throw new Error('This reset link has expired. Please ask an admin to send a new one.');

  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const valid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordResetToken, 'hex'));
  if (!valid) throw new Error('Invalid or expired reset link');

  // Consume the token immediately (one-time use)
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.passwordChangeStartedAt = null;
  await user.save();

  return { user: user.toObject({ virtuals: false }) };
};

// H6: setPassword — apply same complexity rules as changePassword, require adminId for audit
exports.setPassword = async (id, newPassword, adminId) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  if (user.role === 'SUPER_ADMIN') throw new Error('Cannot set Super Admin password this way');
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Password must be at least 8 characters');
  // bcrypt only uses the first 72 UTF-8 bytes of a password.
  if (Buffer.byteLength(newPassword, 'utf8') > 72) {
    throw new Error('Password must not exceed 72 UTF-8 bytes');
  }
  if (!/[A-Z]/.test(newPassword)) throw new Error('Password must contain an uppercase letter');
  if (!/[a-z]/.test(newPassword)) throw new Error('Password must contain a lowercase letter');
  if (!/[0-9]/.test(newPassword)) throw new Error('Password must contain a number');
  if (!/[^A-Za-z0-9]/.test(newPassword)) throw new Error('Password must contain a special character');

  user.passwordChangeStartedAt = null;
  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();

  sendPasswordChangedEmail({
    to: user.email,
    name: user.name,
    byAdmin: true,
  }).catch((err) => console.error('Admin set-password email failed:', err.message));

  return { user: user.toObject({ virtuals: false }) };
};

exports.changeEmail = async (id, newEmail, adminId) => {
  if (typeof newEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
    throw new Error('Please enter a valid email address');
  }
  const cleanEmail = newEmail.trim().toLowerCase();

  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  if (user.email.toLowerCase() === cleanEmail) {
    throw new Error('New email must be different from current email');
  }

  const existing = await User.findOne({ email: cleanEmail });
  if (existing && String(existing._id) !== String(user._id)) {
    throw new Error('This email address is already in use by another account');
  }

  const oldEmail = user.email;
  user.email = cleanEmail;
  await user.save();

  sendEmailChangedEmail({
    oldEmail,
    newEmail: cleanEmail,
    name: user.name,
    byAdmin: true,
  }).catch((err) => console.error('Admin change email notification failed:', err.message));

  return user.toObject({ virtuals: false });
};