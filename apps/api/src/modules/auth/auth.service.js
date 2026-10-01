const bcrypt = require('bcryptjs');
const User = require('../admin/admin.model');

const repository = require('./auth.repository');
const tokens = require('./auth.tokens');
const mfa = require('./mfa.service');

exports.login = async (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') throw new Error('Invalid credentials');
  const user = await repository.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');

  if (!user.password || !user.password.startsWith('$2')) {
    throw new Error('Invalid credentials');
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  if (await tokens.requiresMfa(user.role)) {
    if (!user.mfa) throw new Error('MFA enrollment required; contact your system operator');
    return { mfaRequired: true, challengeToken: tokens.sign(user, 'mfa', '5m') };
  }
  return issueSession(user, false);
};

exports.verifyMfa = async (challengeToken, code) => {
  const challenge = tokens.verify(challengeToken, 'mfa');
  const user = await repository.findById(challenge.sub);
  if (!user?.isActive || !user.mfa || !(await tokens.requiresMfa(user.role)) ||
      challenge.authState !== tokens.authState(user)) {
    throw new Error('MFA verification expired; sign in again');
  }
  const verified = await mfa.verify(user, code);
  return issueSession(verified, true);
};

const issueSession = (user, isMfaVerified) => {
  const accessToken = tokens.sign(user, 'access', process.env.JWT_ACCESS_EXPIRY || '15m', {
    role: user.role, isMfaVerified,
  });
  const refreshToken = tokens.sign(user, 'refresh', process.env.JWT_REFRESH_EXPIRY || '7d');

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