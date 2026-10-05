const repository = require('./auth.repository');
const tokens = require('./auth.tokens');
const User = require('../admin/admin.model');

const ensureDbConnected = async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection?.readyState === 1) return;

  if (mongoose.connection?.readyState === 0 || mongoose.connection?.readyState === 3) {
    const uri = process.env.MONGODB_URI;
    if (uri) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      } catch (_) {}
    }
  }

  if (mongoose.connection?.readyState === 2) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 4000);
      mongoose.connection.once('open', () => {
        clearTimeout(timer);
        resolve();
      });
      mongoose.connection.once('error', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  if (mongoose.connection?.readyState !== 1) {
    const error = new Error('Service temporarily unavailable');
    error.statusCode = 503;
    throw error;
  }
};

// Shared by every mounted HTTP router and the Socket.io handshake.
const authenticateToken = async (token, allowPasswordChange = false) => {
  const decoded = tokens.verify(token, allowPasswordChange ? ['access', 'password-change'] : 'access');
  let user;
  try {
    await ensureDbConnected();
    user = await repository.findById(decoded.sub);
  } catch (err) {
    if (err.statusCode) throw err;
    const dbErr = new Error('Service temporarily unavailable');
    dbErr.statusCode = 503;
    throw dbErr;
  }
  if (!user?.isActive || decoded.authState !== tokens.authState(user)) {
    throw new Error('Account or credentials changed; sign in again');
  }
  if (user.mustChangePassword ? decoded.purpose !== 'password-change' : decoded.purpose !== 'access') {
    throw new Error('Password replacement required; sign in again');
  }
  if (decoded.purpose === 'password-change' && !user.passwordChangeStartedAt) {
    throw new Error('Password replacement was not started');
  }
  if (await tokens.requiresMfa(user.role) && decoded.isMfaVerified !== true) {
    throw new Error('MFA verification required for privileged operations');
  }

  // 1. Verify that the session/token sessionId matches user.activeSessionId
  if (decoded.purpose === 'access' && (!user.activeSessionId || !decoded.sid || decoded.sid !== user.activeSessionId)) {
    const error = new Error('Session ended. Please log in again.');
    error.statusCode = 401;
    throw error;
  }

  // 2. Inactivity timeout check (SESSION_TIMEOUT_MINUTES, default 30)
  const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30;
  const timeoutMs = timeoutMinutes * 60 * 1000;
  if (user.lastActivity && (Date.now() - new Date(user.lastActivity).getTime() > timeoutMs)) {
    const error = new Error('Session timed out');
    error.statusCode = 401;
    throw error;
  }

  // 3. Otherwise update lastActivity to now (to keep the session alive)
  const now = new Date();
  user.lastActivity = now;
  const mongoose = require('mongoose');
  if (mongoose.connection?.readyState === 1 && User && typeof User.updateOne === 'function') {
    try {
      await User.updateOne({ _id: user._id }, { $set: { lastActivity: now } });
    } catch (err) {
      console.error('Failed to update lastActivity:', err.message);
    }
  }

  return { ...decoded, id: decoded.sub, _id: decoded.sub, name: user.name, email: user.email, role: user.role };
};
exports.authenticateToken = authenticateToken;

const protectWith = (allowPasswordChange) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    req.user = await authenticateToken(authHeader.slice(7), allowPasswordChange);
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Invalid token or required authentication step incomplete',
    });
  }
};

exports.protect = protectWith(false);
// Only the password replacement route accepts this restricted purpose.
exports.protectPasswordChange = protectWith(true);

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

const escapeRegExp = (s) => (typeof s === 'string' ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

// Team-based access control
exports.requireTeam = (teamName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const role = req.user.role || '';
    const isTeamMatch =
      (teamName === 'T3' && (role === 'T3_EXECUTIVE' || role === 'T3')) ||
      (req.user.team && req.user.team.toUpperCase() === teamName.toUpperCase());

    if (isTeamMatch) {
      return next();
    }

    // Check if user has teamId assigned to a team named teamName
    if (req.user.teamId) {
      try {
        const Team = require('../teams/teams.model');
        const team = await Team.findById(req.user.teamId);
        if (team && (team.name.toUpperCase().includes(teamName.toUpperCase()) || team.name.toUpperCase() === teamName.toUpperCase())) {
          return next();
        }
      } catch (err) {
        // Fall through
      }
    }

    // Also check if user is a member of any Team named teamName
    try {
      const Team = require('../teams/teams.model');
      const memberTeam = await Team.findOne({
        name: new RegExp(`^${escapeRegExp(teamName)}$`, 'i'),
        $or: [{ members: req.user.sub }, { leadId: req.user.sub }]
      });
      if (memberTeam) {
        return next();
      }
    } catch (err) {
      // Fall through
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. ${teamName} team membership required.`,
    });
  };
};