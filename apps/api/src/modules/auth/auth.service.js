const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../admin/admin.model');

const JWT_SECRET = process.env.JWT_SECRET || 'tbi_super_secret_key_change_in_production';
const JWT_EXPIRY = '7d';      // DEV: 7 days. Change to '15m' in production.
const REFRESH_EXPIRY = '30d';

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');

  const isValid = user.password && user.password.startsWith('$2')
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
  if (!isValid) throw new Error('Invalid credentials');

  const accessToken = jwt.sign(
    { sub: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { sub: user._id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken,
    refreshToken,
  };
};

exports.getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new Error('User not found');

  const isValid = user.password && user.password.startsWith('$2')
    ? await bcrypt.compare(oldPassword, user.password)
    : oldPassword === user.password;
  if (!isValid) throw new Error('Current password is incorrect');

  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(newPassword)) throw new Error('Password must contain an uppercase letter');
  if (!/[a-z]/.test(newPassword)) throw new Error('Password must contain a lowercase letter');
  if (!/[0-9]/.test(newPassword)) throw new Error('Password must contain a number');
  if (!/[^A-Za-z0-9]/.test(newPassword)) throw new Error('Password must contain a special character');

  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;  // Allow access now
  await user.save();

  return { success: true };
};