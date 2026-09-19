# memory.md — Project Memory Snapshot

**Read this file first, before scanning the repo.** It is a self-contained, current snapshot of the project — what’s being built, what’s been decided, and what’s still open. Only fall back to the detailed docs (`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `designe.md`, `CHANGELOG-decisions.md`) when this file doesn’t have the detail a task needs. Any agent that consults a detailed doc for something missing here must add a condensed version of what it learned back into this file — see the Update Protocol at the bottom.

*Last updated: 2026-09-17*

---

## 1. Project Summary

**TBI Student Engagement & Event Workforce Management System** — an admin-provisioned web platform replacing WhatsApp / spreadsheets / email for running a Technology Business Incubator’s event workforce:
**Event creation → Team assembly → Auto-created chat rooms → Student applications → Approval → QR attendance → Certificates → Analytics.**

No public signup. All accounts are created by an Admin or Super Admin.

---

## 2. Current Phase

**Phase 0 — Foundation & Scaffolding** (Monorepo setup, core framework skeleton, empty module scaffolds matching standard module shape, CI skeleton, Docker Compose). PRD, architecture, directory structure, engineering rules, and phased delivery plan are finalized.

---

## 3. Roles & Access Model (Finalized — Do Not Re-derive)

- **Five roles, one role field, single source of truth**: `T1_VOLUNTEER`, `T2_ASSOCIATE`, `T3_EXECUTIVE`, `ADMIN`, `SUPER_ADMIN`.
- `tiers.js` exists but is **display-labels only** — never used in any auth/RBAC decision.
- **RBAC is permission-based, not role-string based**: role-default permission grants + per-user `ACCESS_GRANT` overrides, enforced via `rbac.middleware.js`.
- **MFA (TOTP) is required for Admin and Super Admin** — not optional, not for other roles.
- **Deactivate** (Admin, reversible) and **Revoke** (Super Admin, permanent, reason required) both call one shared `sessionTerminator.js` — no divergent session-kill behavior between the two.

---

## 4. Architecture Facts (Finalized — Do Not Re-derive)

- **Stack**: React (Vite) frontend, Node.js / Express backend (modular monolith: `core/` + `modules/`), MongoDB Atlas (primary + read replicas + sharding for write scaling), Redis split into 3 isolated concerns (`cache+sessions` / `pub-sub` / `BullMQ queue`), Socket.io for chat, BullMQ for background jobs, AWS ECS Fargate + Terraform IaC.
- **Two distinct password-expiry policies** — don’t conflate them: temp password expires in **7 days** (pre-first-login), active accounts rotate every **90 days**.
- **Cache writes always call `cacheInvalidator.js` explicitly** — never rely on TTL alone for write-path correctness.
- **Event creation is atomic**: event + teams + chat room created together in one transaction.
- **Application approval is event-driven**: approval triggers an `applicationApproved.listener.js`, which auto-adds the student to the team chat room — this is not hardcoded into the approval controller.
- **Chat has per-connection message rate limiting**, separate from REST API rate limiting.
- **Scheduled pre-warm autoscaling exists** in addition to reactive CPU-target autoscaling, to cover known event start-time traffic spikes.
- Full annotated directory tree lives in `architecture.md` Section 3.

---

## 5. Explicitly Out of Scope for v1 (Do Not Build Unless Re-opened)

- Geofenced QR attendance (deferred to v2 — `GeoFenceAlert.jsx` removed).
- Native mobile apps (web responsive only).
- Payment integration.
- Blockchain certificate verification.
- Multi-tenant support.
- AI-based recommendations.

---

## 6. Key Decisions Log (Condensed — Full Detail in CHANGELOG-decisions.md)

| Date | Decision |
|---|---|
| 2026-09-17 | **RBAC: permission-based, not simple role-string**: role-default grants + per-user `ACCESS_GRANT` overrides |
| 2026-09-17 | **Dropped redundant tier field from auth logic**: single `role` field; `tiers.js` is display-label only |
| 2026-09-17 | **Geofenced attendance deferred to v2**: browser geolocation unreliable for web v1 |
| 2026-09-17 | **MFA required for Admin/Super Admin**: TOTP-based MFA for privileged accounts |
| 2026-09-17 | **Explicit cache invalidation on write**: call `cacheInvalidator.js` on mutations, not TTL alone |
| 2026-09-17 | **Shared session-termination path for Deactivate/Revoke**: `sessionTerminator.js` kills sessions |
| 2026-09-17 | **Redis split into 3 isolated concerns**: cache+sessions, pub/sub, BullMQ queue |
| 2026-09-17 | **MongoDB Atlas brought under Terraform, sharding added**: write-scaling for event-day bursts |
| 2026-09-17 | **Scheduled pre-warm autoscaling added**: ECS task pre-warming before event start times |
| 2026-09-17 | **Full directory tree embedded directly in architecture.md**: comprehensive annotated tree inline |

---

## 7. Open Items / Known Gaps (Not Yet Resolved — Flag Before Assuming)

- **MongoDB shard key not yet chosen**: Needs a dedicated design pass; a bad shard key (e.g. `_id`) could create hot shards during event-day check-in write bursts.
- **No distributed tracing / APM**: Only Winston logs + Sentry errors; no cross-service request tracing (`api` → `worker` → `socket`).
- **No documented RPO/RTO targets** in the disaster-recovery documentation.
- **No feature-flag mechanism** for staged rollouts.
- **No named circuit-breaker / bulkhead pattern** for external calls (SendGrid / Twilio / S3) — unconfirmed whether an outage in one can back up unrelated queues.
- **MongoDB Atlas encryption-at-rest**: Assumed via Atlas defaults, not explicitly verified/configured in Terraform.
- **i18n scope (`en`/`hi`)**: Scaffolded in frontend, but not explicitly confirmed for MVP launch.
- **Bulk-import endpoint rate limiting**: Aligned with single-add validation logic, but explicit numeric rate limit to be benchmarked.

---

## 8. Update Protocol

- Every approved change logged in `CHANGELOG-decisions.md` must also be reflected here in the same pass — add to Section 6, and update Sections 3/4/5 if the decision changes a standing fact.
- If an open item in Section 7 gets resolved, move it into Section 6 and remove it from Section 7.
- If this file and a detailed doc (`architecture.md`, `rules.md`, etc.) ever disagree, the detailed doc is the source of truth — fix this file to match, don't assume this file is right.
