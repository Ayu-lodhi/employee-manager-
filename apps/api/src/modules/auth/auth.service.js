const jwt = require('jsonwebtoken');
const User = require('../admin/admin.model');

const JWT_SECRET = process.env.JWT_SECRET || 'tbi_super_secret_key_change_in_production';
const JWT_EXPIRY = '7d';      // DEV: 7 days. Change to '15m' in production.
const REFRESH_EXPIRY = '30d';

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');

  const isValid = password === user.password;
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