let PRIVILEGED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
import('../../../../../packages/shared-constants/roles.js')
  .then((m) => {
    if (m?.PRIVILEGED_ROLES) PRIVILEGED_ROLES = m.PRIVILEGED_ROLES;
  })
  .catch(() => {});

// Match the mounted team's administrative roles and member/lead read access.
exports.canReadTeamContacts = (team, requester) => Boolean(requester?.sub && (
  PRIVILEGED_ROLES.includes(requester.role) ||
  team.leadId?.toString() === requester.sub ||
  team.members.some(memberId => memberId.toString() === requester.sub)
));
