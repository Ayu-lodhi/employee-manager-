const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../admin/admin.model');

// Fail hard at startup if JWT_SECRET is missing or too short
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET is missing or too short (min 32 chars). Set it in .env.');
}
const JWT_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');

  if (!user.password || !user.password.startsWith('$2')) {
    throw new Error('Invalid credentials');
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const accessToken = jwt.sign(
    { sub: user._id, role: user.role, purpose: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { sub: user._id, purpose: 'refresh' },
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

  if (!user.password || !user.password.startsWith('$2')) {
    throw new Error('Current password is invalid — contact support');
  }
  const isValid = await bcrypt.compare(oldPassword, user.password);
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
