const jwt = require('jsonwebtoken');
const { createHmac, randomUUID } = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET is missing or too short (min 32 chars). Set it in .env.');
}

exports.requiresMfa = async (role) => {
  const { PRIVILEGED_ROLES } = await import('../../../../../packages/shared-constants/roles.js');
  return PRIVILEGED_ROLES.includes(role);
};

// Bind password proof and MFA proof to the current account credentials.
exports.authState = (user) => createHmac('sha256', JWT_SECRET)
  .update(JSON.stringify([String(user._id), user.password, user.mfa?.version || null]))
  .digest('hex');

exports.sign = (user, purpose, expiresIn, claims = {}) => jwt.sign({
  sub: String(user._id), purpose, authState: exports.authState(user), ...claims,
}, JWT_SECRET, { algorithm: 'HS256', expiresIn, jwtid: randomUUID() });

exports.verify = (token, purpose) => {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  if (decoded.purpose !== purpose || typeof decoded.sub !== 'string') throw new Error('Invalid token purpose');
  return decoded;
};
