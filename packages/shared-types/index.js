/**
 * Shared Type Definitions (JSDoc format for JS/ESM environment)
 *
 * @typedef {Object} UserSession
 * @property {string} userId
 * @property {string} email
 * @property {string} role
 * @property {string[]} permissions
 * @property {boolean} isMfaVerified
 * @property {boolean} isPasswordChangeRequired
 *
 * @typedef {Object} AccessGrant
 * @property {string} permission
 * @property {string} grantedBy
 * @property {Date} grantedAt
 * @property {string} [reason]
 *
 * @typedef {Object} EventShift
 * @property {string} id
 * @property {string} title
 * @property {Date} startTime
 * @property {Date} endTime
 * @property {number} capacity
 * @property {number} filledSlots
 */

export const TypeEnums = Object.freeze({
  CERTIFICATE_TYPES: ['PARTICIPATION', 'EXCELLENCE', 'LEADERSHIP'],
  APPLICATION_STATUS: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  ATTENDANCE_STATUS: ['ABSENT', 'CHECKED_IN', 'EXCUSED'],
  EVENT_STATUS: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']
});
