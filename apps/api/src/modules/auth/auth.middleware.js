const repository = require('./auth.repository');
const tokens = require('./auth.tokens');

// Shared by every mounted HTTP router and the Socket.io handshake.
const authenticateToken = async (token) => {
  const decoded = tokens.verify(token, 'access');
  const user = await repository.findById(decoded.sub);
  if (!user?.isActive || decoded.authState !== tokens.authState(user)) {
    throw new Error('Account or credentials changed; sign in again');
  }
  if (await tokens.requiresMfa(user.role) && decoded.isMfaVerified !== true) {
    throw new Error('MFA verification required for privileged operations');
  }
  return { ...decoded, name: user.name, email: user.email, role: user.role };
};
exports.authenticateToken = authenticateToken;

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    req.user = await authenticateToken(authHeader.slice(7));
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token or MFA verification required' });
  }
};

// Role-based access control
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};