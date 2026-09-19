# PHASES.md — Delivery Plan

**Principle**: Build the structure first, even where a phase’s features aren’t fully wired up yet. Every module keeps its full standard shape:
`routes / controller / service / repository / model / validator / permissions / __tests__`
from Phase 0 onward, even if most files start as stubs — this keeps every later phase a fill-in, not a refactor.

---

## Phase 0 — Foundation & Scaffolding
**No user-facing features. Goal: a running skeleton.**
- Monorepo setup (pnpm workspaces, turborepo), `packages/` shared libraries.
- `core/` framework: config, middleware pipeline skeleton, health checks, graceful shutdown, base classes (`BaseRepository` / `BaseService` / `BaseController` / `BaseModel`).
- Docker Compose local dev environment (`API` + `web` + `Mongo` + `Redis`).
- CI skeleton (lint, test, build) for `api`, `web`, and `workers`.
- Empty module scaffolds for every planned feature module, matching the standard shape.

---

## Phase 1 — Auth, RBAC & Admin Provisioning
**The highest-risk area — gets built and hardened first.**
- JWT auth, permission-based RBAC middleware, token blacklist in Redis.
- Admin-provisioned account creation (single + bulk CSV import), default password flow.
- Forced first-login password change.
- MFA (TOTP) enrollment & verification for `ADMIN` and `SUPER_ADMIN`.
- Deactivate / Revoke actions with shared `sessionTerminator.js`.
- Audit logging on every admin action.
- Full security test suite for this phase (OWASP Top 10, auth bypass, JWT tampering, RBAC escalation) before moving on.

---

## Phase 2 — Events, Teams & Chat Foundation
- Event creation (atomic: event + teams + chat rooms in one transaction).
- Team management and member assignments.
- Socket.io real-time chat: room authentication, basic messaging, per-connection rate limiting.
- Chat room archiving (read-only mode) on event close.

---

## Phase 3 — Applications & Shifts
- Shift definitions with capacity limits and atomic slot reservation.
- Apply / review / approve-reject flow.
- Approval → auto-add to chat room via event-driven listener (`applicationApproved.listener.js`).
- Concurrency tests: double-approval race conditions, shift-capacity race conditions.

---

## Phase 4 — Attendance
- Dynamic QR code generation + check-in flow.
- Admin and team lead attendance marking & verification.
- *No geofencing in this phase — deferred to v2 backlog.*

---

## Phase 5 — Certificates & Reviews
- PDF certificate generation (Participation, Excellence, Leadership templates).
- Optimistic locking to prevent duplicate certificate generation under parallel requests.
- Public QR certificate verification page.
- Post-event review and rating system.

---

## Phase 6 — Notifications & Analytics
- Unified notification service (email + SMS + in-app push) via idempotent background workers.
- Admin dashboard, team analytics, volunteer leaderboard.

---

## Phase 7 — Hardening & Scale Validation
**Before calling this production-ready:**
- Full k6 load test pass: baseline, spike, stress, soak, and the event-day check-in scenario specifically.
- MongoDB sharding strategy validated under a simulated write burst.
- Redis workload isolation (cache/session vs pub-sub vs queue) load-tested independently.
- Scheduled pre-warm autoscaling validated against a known event start time.
- Full security audit / pen-test pass.
- Disaster recovery drill with documented RPO/RTO targets.

---

## v2 Backlog (Explicitly Out of Phase 0–7)
- Geofenced QR attendance verification.
- Blockchain certificate verification.
- Native mobile apps (iOS / Android).
- Payment gateway integration.
- Multi-tenant support.
- AI-based volunteer recommendations.
