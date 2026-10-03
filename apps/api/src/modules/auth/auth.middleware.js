const repository = require('./auth.repository');
const tokens = require('./auth.tokens');

// Shared by every mounted HTTP router and the Socket.io handshake.
const authenticateToken = async (token, allowPasswordChange = false) => {
  const decoded = tokens.verify(token, allowPasswordChange ? ['access', 'password-change'] : 'access');
  const user = await repository.findById(decoded.sub);
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
  return { ...decoded, name: user.name, email: user.email, role: user.role };
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
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token or required authentication step incomplete' });
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
        name: new RegExp(`^${teamName}$`, 'i'),
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