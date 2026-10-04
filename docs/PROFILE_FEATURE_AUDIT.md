# Profile Feature Audit
**Phase 1 — Read-Only Analysis**

## 1. Roles, Tiers, and RBAC

### Role Enum (defined in `apps/api/src/modules/admin/admin.model.js` L16-20)
```
SUPER_ADMIN  → highest authority; can change any user including admins
ADMIN        → can manage T1/T2/T3 users; cannot touch SUPER_ADMIN or other admins
T3_EXECUTIVE → team lead; can view their team members' profiles
T2_ASSOCIATE → member; own profile only
T1_VOLUNTEER → member; own profile only
```

### RBAC Enforcement (auth.middleware.js)
- **`protect`** (L70): verifies JWT, session ID match, inactivity timeout, MFA if required
- **`restrictTo(...roles)`** (L75-88): checks `req.user.role` against an allowlist → 403 if not in list
- **`requireTeam(teamName)`** (L91-138): checks if user's role/teamId matches a named team
- **`authenticateToken`** (L6-51): single-session enforcement via `user.activeSessionId === decoded.sid`; fails closed on DB error (throws, caught by `protect`)
- Permission cache: `apps/api/src/core/cache/permissionCache.js` — `invalidateUserPermissions()` must be called after role/tier changes

### Key security properties
- Single-session: `activeSessionId` in User doc must match token `sid` — revoked session → 401 immediately
- Inactivity timeout: `SESSION_TIMEOUT_MINUTES` env var (default 30 min)
- MFA required for `SUPER_ADMIN` and `ADMIN` roles (see `auth.tokens.js`)
- Fail-closed: any DB error in `authenticateToken` causes 401

## 2. T3 Executive → Team Members Link

**Answer (confirmed by user):** A T3 executive is the `leadId` of one or more `Team` documents.  
Their "team members" = the `members[]` array of ALL teams where `team.leadId === caller._id`.

```
Team schema (teams.model.js L3-15):
  leadId: ObjectId ref User   ← T3 executive's _id
  members: [ObjectId ref User]  ← the team members they can view
```

**Profile view scope for T3:**
```js
const teams = await Team.find({ leadId: callerId }, 'members');
const allowedMemberIds = teams.flatMap(t => t.members.map(id => id.toString()));
```
A removed member (no longer in any of the T3's team `members[]`) loses access immediately  
because the check is done on every request.

## 3. Existing User Model Profile Fields

`apps/api/src/modules/admin/admin.model.js`:
- `name` — editable
- `email` — editable (own flow only via change-email route)
- `phone` — editable
- `skills` — basic string, editable
- `bio` — editable
- `availability` — editable

**Missing (need new Profile model):**
- headline/course, university, city, gender, birthday, mobileVerified, emailVerified
- education entries, projects, linkedinUrl, avatarKey/avatarUrl
- completionPercent, progressScore, progressHistory

**Decision: Use a separate `Profile` model** (one-to-one with User via `userId`).
This avoids touching the existing User model at all, satisfying the additive-only rule.

## 4. File Uploads / Storage

- S3 is configured (`AWS_S3_CERTIFICATES_BUCKET` env var in `.env.example`)
- `apps/api/src/services/email.service.js` uses AWS SDK
- Certificates module uses S3 for PDF storage
- **For avatar uploads**: will use the same S3 bucket pattern (separate avatar bucket/prefix)
- Package `sharp` is NOT currently installed — must be added as dependency for image re-encoding

## 5. Audit Log Mechanism

Two audit logging paths:
1. **`auditLog(action)` middleware** (`middleware/audit.middleware.js`): writes to `AuditLog` model after successful response (2xx only), attached to specific routes
2. **`recordPermissionAudit(entry)`** utility (`core/utils/auditLogger.js`): writes to same model, called programmatically, sanitizes sensitive fields

**AuditLog model** fields: `action`, `performedBy`, `performedByName`, `targetId`, `targetType`, `ipAddress`, `details`, `timestamp`.

**On role/tier change** (existing pattern in `admin.service.js`):
- `disconnectUserSockets(userId)` — terminates WebSocket connections
- `invalidateUserPermissions(userId)` — deletes Redis permission cache key `perm:{userId}`
- `recordPermissionAudit(...)` — writes audit entry
- The new tier-change endpoint will call the same three functions.

## 6. Progress Score Data Sources

| Signal | Model | Key Fields |
|--------|-------|-----------|
| Attendance | `Attendance` | `user` (ObjectId), `date` (YYYY-MM-DD), `status` (present/late/absent/on_leave/half_day) |
| Events joined | `Application` (inferred) + `Event` | Need to check applications model |
| Team participation | `Team` | `members[]` + whether active |
| Certificates | `Certificate` | `studentId`, `issuedAt` |
| Review ratings | `Review` | `studentId`, `rating` (1-5) |

Rolling window: 90 days (configurable).

## 7. Test Framework & Dependency Audit

**Existing Standard:** Node.js native `node:test` + `node:assert/strict` + native `fetch` against HTTP server (see `src/__tests__/phase4-control.test.js`).

**Audit Note on devDependencies:**
`mongodb-memory-server` and `supertest` were tentatively added during early planning for isolated in-memory testing. However, a dependency audit confirmed that no test files in `apps/api` use either package. In keeping with minimal supply-chain attack surface and repository standards:
- Both packages were removed from `apps/api/package.json`.
- Profile test suites will utilize native Node.js primitives (`node:test`, `node:assert/strict`, `fetch`) matching the codebase convention without extra external dependencies.
- Any future in-memory DB or HTTP test tooling should only be introduced in the exact commit introducing the tests that require it.

**Test conventions to follow:**
- `process.env.NODE_ENV = 'test'` at top
- `test.before` / `test.after` for server lifecycle
- One file per concern under `src/__tests__/profile/`

## 8. Frontend

- **Router:** React Router v6, all routes in `apps/web/src/App.jsx` (or equivalent)
- **API calls:** `api.js` — axios-based client with JWT Bearer token in header
- **Styling:** Tailwind CSS with existing class conventions
- **Pages:** `apps/web/src/pages.jsx` (monolithic) — new pages go in `apps/web/src/pages/profile/`
- **No frontend test framework** detected — will skip frontend unit tests per rules

## Security Findings (Audit Only — Not Changed)

> None found that require a stop. The existing code enforces all required controls.
> The `auditLog` middleware (L26) logs `req.body` which may include sensitive profile data —
> this is recorded as a finding but not changed (existing behavior, out of scope for this task).
