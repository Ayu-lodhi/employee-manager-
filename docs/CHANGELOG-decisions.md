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
