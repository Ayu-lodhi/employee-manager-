const jwt = require('jsonwebtoken');
const User = require('../admin/admin.model');

// Fail hard at startup if JWT_SECRET is missing or too short
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET is missing or too short (min 32 chars). Set it in .env.');
}

// Verify JWT token + check user is still active in DB
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Check account is still active (catches revoked users with unexpired tokens)
    const user = await User.findById(decoded.sub).select('isActive role name email');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated or not found' });
    }

    req.user = { ...decoded, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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
