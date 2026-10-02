# CHANGELOG-decisions.md

Registry of approved changes, per the Change Approval & Logging Protocol in `rules.md`. Entries below this line are backfilled from decisions made earlier in this project’s design discussion, before the protocol itself was added.

---

### [2026-09-17] RBAC model: permission-based, not simple role-string
- **What**: RBAC enforcement uses granular permission codes (role-default grants + per-user `ACCESS_GRANT` overrides), not a flat role-string check.
- **Reason**: Chosen over simple role-based checking to support per-user exceptions (e.g. a T2 granted one T3-level permission without a full promotion) without duplicating role strings across services.
- **Where**: `apps/api/src/core/middleware/rbac.middleware.js`, `apps/api/src/core/config/rbac.config.js`, `packages/shared-constants/permissions.js`, `docs/database/ER-DIAGRAM.md`

### [2026-09-17] Drop redundant tier field from auth logic
- **What**: Single role field (`T1_VOLUNTEER` / `T2_ASSOCIATE` / `T3_EXECUTIVE` / `ADMIN` / `SUPER_ADMIN`) is the only field used in auth decisions; `tiers.js` becomes display-label-only.
- **Reason**: Chosen over keeping tier as an independent field, to remove a redundant encoding that could desync from role.
- **Where**: `packages/shared-constants/tiers.js`, `apps/api/src/modules/users/users.model.js`, `apps/web/src/core/router/RoleRoute.jsx`, `docs/database/migrations/004-remove-tier-from-auth-logic.md`

### [2026-09-17] Geofenced QR attendance deferred to v2
- **What**: Geofence validation removed from MVP scope.
- **Reason**: Chosen over keeping it in scope, given browser geolocation reliability concerns for a web-only (no native app) v1 and no prior PRD/diagram coverage.
- **Where**: `apps/web/src/modules/attendance/components/` (`GeoFenceAlert.jsx` removed), `apps/api/src/modules/attendance/qr.service.js`, `phases.md` (v2 backlog)

### [2026-09-17] MFA required for Admin and Super Admin
- **What**: TOTP-based MFA added as a mandatory step for the two highest-privilege roles.
- **Reason**: Identified as the single highest-severity open security gap (privileged accounts were password-only).
- **Where**: `apps/api/src/modules/auth/mfa.service.js`, `apps/api/src/core/middleware/mfa.middleware.js`, `apps/web/src/modules/auth/pages/MFASetup.jsx`, `docs/security/mfa-policy.md`

### [2026-09-17] Explicit cache invalidation on write
- **What**: Every mutating service call explicitly deletes the relevant Redis cache key, rather than relying on TTL alone.
- **Reason**: Closes a stale-read window (up to 1hr) discovered in the shift-approval flow.
- **Where**: `apps/api/src/core/cache/cacheInvalidator.js`, called from `shifts.service.js`, `applications.service.js`

### [2026-09-17] Shared session-termination path for Deactivate and Revoke
- **What**: Both the Admin’s “Deactivate” action and the Super Admin’s “Revoke” action call one shared utility to kill active sessions/tokens.
- **Reason**: Avoids divergent behavior between the two actions on whether sessions are actually invalidated.
- **Where**: `apps/api/src/core/session/sessionTerminator.js`, `apps/api/src/modules/admin/admin.service.js`, `apps/api/src/modules/super-admin/revocation.service.js`

### [2026-09-17] Redis split into three logically isolated concerns
- **What**: `cache+sessions`, `pub/sub` (chat), and `BullMQ queue` each get their own Redis client/config, rather than sharing one general-purpose connection.
- **Reason**: Avoids noisy-neighbor contention between chat message bursts and ordinary API session checks during peak event load.
- **Where**: `apps/api/src/core/config/redis-cache.client.js`, `redis-pubsub.client.js`, `redis-queue.client.js`, `infrastructure/terraform/modules/elasticache/`

### [2026-09-17] MongoDB Atlas brought under Terraform, sharding added
- **What**: MongoDB Atlas provisioning (previously manual/unmanaged) is now IaC, with a sharding module for write-scaling.
- **Reason**: Addresses the identified write-scaling gap for event-day check-in bursts (read replicas alone don’t help write throughput).
- **Where**: `infrastructure/terraform/modules/mongodb-atlas/`, `docs/architecture/15-mongodb-sharding-strategy.md`

### [2026-09-17] Scheduled pre-warm autoscaling added
- **What**: A scheduled scaling policy bumps ECS desired task count ahead of known event start times, in addition to reactive CPU-target autoscaling.
- **Reason**: Reactive autoscaling alone can lag a known, scheduled traffic spike (mass QR check-in at event start).
- **Where**: `infrastructure/terraform/modules/autoscaling/scheduled-scaling.tf`, `apps/workers/src/jobs/definitions/preScaleForEvent.job.js`

### [2026-09-17] Full directory tree embedded directly in architecture.md
- **What**: Section 3 (“Folder & File Structure”) now contains the complete, fully-annotated directory tree inline, instead of a condensed top-level view with a pointer to a separate file.
- **Reason**: Chosen over keeping it as an external-file pointer, per explicit clarification that the full structure should live inside `architecture.md` itself.
- **Where**: `docs/architecture.md` (Section 3)

### [2026-09-17] memory.md added as the agent read-first project snapshot
- **What**: New self-contained `memory.md` created (project summary, current phase, finalized role/architecture facts, out-of-scope list, condensed decision log, open gaps); `rules.md` updated with a Memory Protocol (Section 0) requiring agents to read `memory.md` first and keep it in sync with `CHANGELOG-decisions.md`.
- **Reason**: Avoids the coding agent re-reading the full project repeatedly; full self-contained snapshot chosen over a lean pointer-only file.
- **Where**: `docs/memory.md` (new), `docs/rules.md` (Section 0)

### [2026-09-17] Explicit session-start rule added; all docs converted to .docx
- **What**: `rules.md` Section 0 now states an explicit session-start rule — Antigravity must read `memory.md` first at the start of every session/task, before repo or other docs. All 7 markdown docs (`prd`, `architecture`, `rules`, `phases`, `designe`, `memory`, `CHANGELOG-decisions`) converted to `.docx` via pandoc for distribution.
- **Reason**: Makes the “read `memory.md` first” behavior an unambiguous trigger tied to session start, not just a general principle; `.docx` requested for sharing outside the repo.
- **Where**: `docs/rules.md` (Section 0), all `docs/*.docx`

### [2026-09-30] Attendance upsert error handling & stale index fallback
- **What**: Wrapped attendance upsert in try/catch with fallback to plain update on E11000 duplicate key error.
- **Reason**: Gracefully recovers from race conditions or duplicate key collisions from stale indexes during attendance marking without failing the operation.
- **Where**: `apps/api/src/modules/attendance/attendance.service.js`


### [2026-10-01] Enforce MFA in the mounted authentication flow
- What: Privileged login now requires a restricted password challenge and verified TOTP before issuing access; HTTP and Socket.io share access-purpose and MFA enforcement.
- Reason: Confirmed password-only and refresh-token access to administrative operations. Trusted operator enrollment prevents password possession from also enrolling an attacker-controlled factor; the security-fix request authorizes this change.
- Where: `apps/api/src/modules/auth/`, `apps/api/src/modules/admin/admin.model.js`, `apps/api/src/config/socket.js`, `apps/api/scripts/enroll-mfa.js`, `apps/web/src/pages.jsx`, `docs/security/mfa-policy.md`, `docs/database/mfa.md`, `packages/shared-types/index.js`, `.env.example`, API dependency manifests.

### [2026-10-01] Enforce JWT purpose at resource authentication
- What: Login signs access/refresh purpose claims; HTTP protect and socket handshakes require access purpose, with regression tests.
- Reason: Confirmed that a login-issued seven-day refresh token could authenticate as an access token. Enforce signed purpose using the existing key configuration; no refresh endpoint currently exists. Existing tokens without purpose require a new login. Fix authorized by the security investigation request; authentication changes require human review before merge.
- Where: `apps/api/src/modules/auth/auth.service.js`, `apps/api/src/modules/auth/auth.middleware.js`, `apps/api/src/modules/auth/__tests__/auth.test.js`, `apps/api/src/config/socket.js`, `apps/api/src/config/__tests__/socket.test.js`

### [2026-10-01] Reconcile token-purpose and MFA fixes
- What: Resolved overlap with main while retaining MFA enforcement, access-only HTTP/socket authentication, and both regression suites.
- Reason: PR #4 and PR #5 independently changed the same authentication paths. Shared MFA token validation already enforces the token-purpose requirement.
- Where: Auth service/middleware/tests, Socket.io authentication/tests, this changelog, and memory.md.

### [2026-10-01] Preserve application listing team authorization
- What: Validate scalar listing filters, retain the lead's team scope as a separate query condition, and persist required application team ownership with regression coverage.
- Reason: Confirmed that request filters replaced the authorization predicate and the schema discarded ownership. The security-fix request authorizes this change. Legacy records stay outside T3 listings until ownership is restored from trusted evidence; event-based inference is unsafe. Authorization changes require human review before merge.
- Where: `apps/api/src/modules/applications/applications.service.js`, `apps/api/src/modules/applications/applications.model.js`, `apps/api/src/modules/applications/__tests__/applications.test.js`, `packages/shared-types/index.js`, `docs/database/applications.md`, `memory.md`.

### [2026-10-01] Enforce membership for manual attendance
- What: Require the selected student to be a current team member or lead before the attendance upsert or duplicate-key fallback; add HTTP regression coverage.
- Reason: Confirmed that a lead could write attendance for unrelated users, affecting personal history and statistics. Existing self check-in establishes member/lead eligibility; administrators have no membership exception. Fix authorized by the security investigation request; authorization changes require human review before merge.
- Where: `apps/api/src/modules/attendance/attendance.service.js`, `apps/api/src/modules/attendance/__tests__/attendance.test.js`, `memory.md`.

### [2026-10-01] Enforce mandatory password replacement
- What: Consume temporary login atomically; issue only bounded password-change credentials until replacement; enforce the state on HTTP and Socket.io authentication and route the UI into replacement.
- Reason: Confirmed security investigation authorized this fix. Existing MFA/purpose controls did not enforce mandatory replacement or one-time temporary login. Authentication changes require human review before merge.
- Where: apps/api/src/modules/auth/, apps/api/src/modules/admin/admin.model.js and admin.service.js, apps/api/src/config/__tests__/socket.test.js, apps/web/src/pages.jsx and lib/api.js, packages/shared-types/index.js, docs/database/password-replacement.md, docs/security/mfa-policy.md.

### [2026-10-01] Scope team membership mutations to their manager
- What: Pass the authenticated requester into membership services, require team leadership or administrative authority, and validate membership and protected team/event roles before cascade writes.
- Reason: Confirmed unrelated T3 callers could mutate teams, user assignments and event rosters. The security investigation authorizes this fix; human review is required before merge. Preserve the mounted role gate and shared role constants without introducing a broader RBAC migration.
- Where: apps/api/src/modules/teams/teams.controller.js, teams.service.js, __tests__/teams.test.js; memory.md.

### [2026-10-01] Restrict event updates to literal editable fields
- What: Validate event PATCH data against an explicit field/type allowlist at the repository boundary; the active base repository rejects pipeline/operator input and constructs `$set` updates. Add HTTP and repository regression coverage.
- Reason: Confirmed an authenticated administrator could pass a `$function` pipeline through Mongoose validation to database IO. The security investigation authorizes this fix. Preserve the editor fields (including clearing an unselected head) and lifecycle status; membership, derived counters and audit fields are not generic edits.
- Where: `apps/api/src/core/BaseRepository.js`, `apps/api/src/modules/events/events.repository.js`, `events.validator.js`, `__tests__/events.test.js`, `memory.md`. The common-JS base repository currently has only the event repository as a consumer; the separate scaffold in `core/database/` is unaffected.

### [2026-10-02] Limit new passwords to bcrypt's byte boundary
- What: Reject new passwords exceeding 72 UTF-8 bytes before composition checks and hashing in self-service replacement and administrative setting, including deployed server copies; add byte-boundary regression tests.
- Reason: Installed bcryptjs 2.4.3 accepts the 72-byte prefix when required character classes occur only in the discarded suffix. Existing authentication controls do not mitigate this policy bypass. The security investigation authorizes this fix; auth changes require human review before merge.
- Where: `apps/api/src/modules/{auth,admin}/*.service.js`, `apps/web/server/modules/{auth,admin}/*.service.js`, auth `__tests__/password-bytes.test.js` in both server trees, `memory.md`.

### [2026-10-02] Restrict notification read updates to the recipient
- What: Match both notification ID and authenticated recipient in the atomic read-state update; return the same 404 for foreign and missing notifications in API and deployed web server copies. Add HTTP regression coverage.
- Reason: Confirmed authenticated callers could mark another recipient's notification read by ID. Existing authentication and scoped list/bulk updates did not protect the individual update. The security investigation authorizes this fix; authorization changes require human review before merge.
- Where: `apps/api/src/modules/notifications/notifications.controller.js`, `apps/web/server/modules/notifications/notifications.controller.js`, corresponding `__tests__/notifications.test.js`, `memory.md`.

### [2026-10-02] Prevent simulated delivery log injection
- What: Keep only fixed email/SMS queue status messages in both notification service copies; add announcement-flow regression coverage for forged lines, control characters, preserved content and delivery preferences.
- Reason: Confirmed authorized team announcements could inject process-log records through title/message text. The security investigation authorizes the fix. Removing unnecessary recipient/content fields also avoids exposing personal data. The active services have no Winston dependency or implemented shared logger, so this bounded fix retains their existing console sink.
- Where: `apps/api/src/modules/notifications/notifications.service.js`, `apps/web/server/modules/notifications/notifications.service.js`, corresponding `__tests__/delivery.test.js`, `memory.md`.

### [2026-10-02] Bind team timesheet listing to the authorized team
- What: Validate a scalar ObjectId before team lookup and use the authorized team's persisted ID for timesheet reads in both server copies; add HTTP/service regression tests.
- Reason: Confirmed Express bracket selectors and Mongoose operator casting allowed a lead to select foreign-team timesheets after authorization against one led team. The security investigation authorizes this scoped fix; human review is required before merge.
- Where: `apps/api/src/modules/timesheets/timesheets.service.js`, `apps/web/server/modules/timesheets/timesheets.service.js`, corresponding `__tests__/timesheets.test.js`, `memory.md`.

### [2026-10-02] Escape profile names in credential email HTML
- What: Encode profile names in password-reset and welcome HTML in both server copies, with regression coverage.
- Reason: The security investigation confirmed ADMIN-editable names could inject markup into later credential emails. Encode at the HTML sink to preserve stored names and plain-text output; fix authorized by the investigation request.
- Where: `apps/api/src/services/email.service.js`, `apps/web/server/services/email.service.js`, corresponding `__tests__/email.test.js`, `memory.md`.
