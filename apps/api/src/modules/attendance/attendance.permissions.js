let ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  T3_EXECUTIVE: 'T3_EXECUTIVE',
  T2_ASSOCIATE: 'T2_ASSOCIATE',
  T1_VOLUNTEER: 'T1_VOLUNTEER',
};
let PRIVILEGED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
import('../../../../../packages/shared-constants/roles.js')
  .then((m) => {
    if (m?.ROLES) ROLES = m.ROLES;
    if (m?.PRIVILEGED_ROLES) PRIVILEGED_ROLES = m.PRIVILEGED_ROLES;
  })
  .catch(() => {});
const { AuthorizationError } = require('../../core/errors/typedErrors');

exports.assertTeamAttendanceAccess = (team, requester) => {
  if (requester?.sub && PRIVILEGED_ROLES.includes(requester.role)) return;

  // Match /teams/me: T3 may read teams they lead or belong to.
  if (requester?.sub && requester.role === ROLES.T3_EXECUTIVE) {
    const isLead = team.leadId?.toString() === requester.sub;
    const isMember = team.members.some((member) => member.toString() === requester.sub);
    if (isLead || isMember) return;
  }
  throw new AuthorizationError('Not authorized to read this team attendance');
};
