const jwt = require('jsonwebtoken');
const { createHmac, randomUUID } = require('node:crypto');

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is required');
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is required');
  }
  return secret;
};

const getSecretForPurpose = (purpose) => (purpose === 'refresh' ? getRefreshSecret() : getAccessSecret());

exports.requiresMfa = async (role) => {
  try {
    const { PRIVILEGED_ROLES } = await import('../../../../../packages/shared-constants/roles.js');
    return PRIVILEGED_ROLES.includes(role);
  } catch {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }
};

// Bind password proof and MFA proof to the current account credentials.
exports.authState = (user) => createHmac('sha256', getAccessSecret())
  .update(JSON.stringify([String(user._id), user.password, user.mfa?.version || null,
    !!user.mustChangePassword, user.passwordChangeStartedAt || null]))
  .digest('hex');

exports.sign = (user, purpose, expiresIn, claims = {}) => jwt.sign({
  sub: String(user._id), purpose, authState: exports.authState(user), ...claims,
}, getSecretForPurpose(purpose), { algorithm: 'HS256', expiresIn, jwtid: randomUUID() });

exports.verify = (token, purpose) => {
  const secret = getSecretForPurpose(purpose);
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (![purpose].flat().includes(decoded.purpose) || typeof decoded.sub !== 'string') throw new Error('Invalid token purpose');
  return decoded;
};
