const jwt = require('jsonwebtoken');
const { createHmac, randomUUID } = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'tbi_super_secret_key_change_in_production_min_32_chars';

exports.requiresMfa = async (role) => {
  if (process.env.ENFORCE_MFA !== 'true') return false;
  try {
    const { PRIVILEGED_ROLES } = await import('../../../../../packages/shared-constants/roles.js');
    return PRIVILEGED_ROLES.includes(role);
  } catch {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }
};

// Bind password proof and MFA proof to the current account credentials.
exports.authState = (user) => createHmac('sha256', JWT_SECRET)
  .update(JSON.stringify([String(user._id), user.password, user.mfa?.version || null,
    !!user.mustChangePassword, user.passwordChangeStartedAt || null]))
  .digest('hex');

exports.sign = (user, purpose, expiresIn, claims = {}) => jwt.sign({
  sub: String(user._id), purpose, authState: exports.authState(user), ...claims,
}, JWT_SECRET, { algorithm: 'HS256', expiresIn, jwtid: randomUUID() });

exports.verify = (token, purpose) => {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  if (![purpose].flat().includes(decoded.purpose) || typeof decoded.sub !== 'string') throw new Error('Invalid token purpose');
  return decoded;
};
