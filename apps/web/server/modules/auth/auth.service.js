const bcrypt = require('bcryptjs');
const User = require('../admin/admin.model');

const repository = require('./auth.repository');
const tokens = require('./auth.tokens');
const mfa = require('./mfa.service');

exports.login = async (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') throw new Error('Invalid credentials');
  let user = await repository.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('Account is deactivated');

  if (!user.password || !user.password.startsWith('$2')) {
    throw new Error('Invalid credentials');
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const requiresMfa = await tokens.requiresMfa(user.role);
  if (requiresMfa && !user.mfa) throw new Error('MFA enrollment required; contact your system operator');
  if (user.mustChangePassword) {
    if (user.passwordChangeStartedAt) throw new Error('Temporary password already used; ask an administrator to reset it');
    user = await repository.consumeTemporaryPassword(user);
    if (!user) throw new Error('Credentials changed or temporary password already used; ask an administrator to reset it');
  }

  if (requiresMfa) {
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
  if (user.mustChangePassword) {
    const remaining = Math.floor((new Date(user.passwordChangeStartedAt).getTime() + 300000 - Date.now()) / 1000);
    if (!user.passwordChangeStartedAt || remaining <= 0) throw new Error('Password replacement expired; ask an administrator to reset it');
    return {
      mustChangePassword: true,
      passwordChangeToken: tokens.sign(user, 'password-change', remaining, { isMfaVerified }),
    };
  }
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

exports.changePassword = async (credential, oldPassword, newPassword) => {
  const user = await repository.findById(credential.sub);
  if (!user?.isActive || credential.authState !== tokens.authState(user)) {
    throw new Error('Credentials changed; sign in again');
  }

  if (!user.password || !user.password.startsWith('$2')) {
    throw new Error('Current password is invalid — contact support');
  }
  if (user.mustChangePassword) {
    if (credential.purpose !== 'password-change' || !user.passwordChangeStartedAt) {
      throw new Error('Password replacement required');
    }
  } else {
    if (credential.purpose !== 'access' || typeof oldPassword !== 'string' ||
        !(await bcrypt.compare(oldPassword, user.password))) throw new Error('Current password is incorrect');
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(newPassword)) throw new Error('Password must contain an uppercase letter');
  if (!/[a-z]/.test(newPassword)) throw new Error('Password must contain a lowercase letter');
  if (!/[0-9]/.test(newPassword)) throw new Error('Password must contain a number');
  if (!/[^A-Za-z0-9]/.test(newPassword)) throw new Error('Password must contain a special character');

  if (await bcrypt.compare(newPassword, user.password)) throw new Error('New password must differ from the current password');
  const updated = await repository.replacePassword(user, await bcrypt.hash(newPassword, 12));
  if (!updated) throw new Error('Credentials changed; sign in again');

  return { success: true };
};