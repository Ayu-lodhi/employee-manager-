# RULES.md — Engineering & AI Guardrails

## 0. Memory Protocol — Read This Before Anything Else

**Session start rule**: The moment Antigravity (or any agent) begins work on this project — a new session, a new task, resuming after any gap — its first action is to read `memory.md` in full and treat it as the base of everything it does next. Not the repo, not the other docs, not prior chat context: **`memory.md` first, always, every time work begins.**

`memory.md` is a self-contained snapshot of the project — summary, current phase, finalized role/architecture facts, out-of-scope items, condensed decision log, and open gaps. Any agent (AI or human) starting work on this project reads `memory.md` first, instead of re-scanning the full repository or full doc set.

- Only consult a detailed doc (`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `designe.md`, `CHANGELOG-decisions.md`) when `memory.md` doesn’t have the specific detail a task needs.
- If a detailed doc is consulted and something useful is learned that isn’t already in `memory.md`, add a condensed version of it back into `memory.md` before finishing the task.
- Every change logged in `CHANGELOG-decisions.md` per the protocol below must also be reflected in `memory.md` in the same pass — the two must never drift out of sync.
- If `memory.md` and a detailed doc ever disagree, the detailed doc wins — fix `memory.md` to match, don’t trust `memory.md` blindly.

---

## 1. What to Use

- **Auth**: JWT (short-lived access token + refresh token), bcrypt (12 rounds) for passwords, TOTP for MFA.
- **RBAC**: Permission-based only. Never check `role === '...'` directly in business logic — always go through `rbac.middleware.js`, which resolves role-default grants + per-user access-grant overrides.
- **Data access**: Mongoose, always through a `*.repository.js` — controllers and services never call Mongoose models directly.
- **Error handling**: `ApiError` / `ApiResponse` / `asyncHandler` wrapper on every route handler; typed errors only (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`).
- **Logging**: Winston structured logger only — never `console.log` in committed code.
- **Background jobs**: BullMQ, every worker must be idempotent (check `idempotency.util.js` before side-effecting).
- **Caching**: `cacheService.js` for reads, `cacheInvalidator.js` explicitly called on every write that touches a cached key — never rely on TTL alone for write-path correctness.
- **Sessions**: `sessionTerminator.js` for any action that must kill active sessions (Deactivate, Revoke) — one shared code path, not two.
- **Constants**: `roles.js` and `permissions.js` from `packages/shared-constants` are the single source of truth for both frontend and backend — never redefine role/permission strings locally in a module.
- **Testing**: Every module touching auth, RBAC, revocation, transactions, or concurrency must ship with a corresponding test in `__tests__/` before merge — this is not optional for red-zone files.

---

## 2. What to Avoid

- **Hardcoded role/tier strings anywhere outside shared-constants** (e.g. `if (user.role === 'T2')`) — use the permission check, not a role comparison, unless in the middleware itself.
- **A separate tier field used for auth decisions** — `tiers.js` is display-labels only.
- **Storing JWTs in localStorage on the frontend** — use `httpOnly` secure cookies or in-memory storage with refresh rotation.
- **Synchronous/blocking bcrypt calls on the request thread** — always `await bcrypt.hash(...)`, never the sync variant.
- **Direct Mongoose queries inside controllers or React components** — always through the repository/service layer.
- **Skipping cacheInvalidator.js on a write path "because TTL will handle it"** — this created a real stale-read bug in an earlier design pass and must not recur.
- **Adding a new external library without checking it’s actively maintained and doesn’t duplicate something already in `packages/shared-utils`**.
- **Committing `.env` files, API keys, or any secret** — use `.env.example` as the template, real values only in AWS Secrets Manager.
- **Logging passwords, tokens, OTPs, or full PII** (mask email/phone in logs).
- **Cross-module imports that reach into another module’s repository or model directly** — go through that module’s public `*.service.js` or `*.index.js` only.
- **Disabling an ESLint rule inline without a one-line comment explaining why**.

---

## 3. Change Approval & Logging Protocol

Applies to every change — code, architecture, schema, or docs — proposed by an AI assistant (or any contributor working from this doc set), no exceptions:

1. **Ask before making the change**: Present the change as a multiple-choice question (MCQ) — the options being considered, not just a yes/no on one option. Never make the change first and explain it after.
2. **Wait for the person’s selection**: Do not proceed on an assumed default, even if one option seems obviously best.
3. **Register the change once approved**: Log it in `docs/CHANGELOG-decisions.md` with:
   - **What changed** (one line)
   - **Reason** — why this option was chosen over the others offered
   - **Where** — exact file(s)/module(s)/doc(s) it was made in
   - **Date**

### Log entry format:
```markdown
### [YYYY-MM-DD] <short title>
- What: <one-line description of the change>
- Reason: <why this option, chosen from the MCQ>
- Where: <file path(s) / module(s) / doc(s)>
```

This applies retroactively too — any change already made in this conversation without going through this protocol should be backfilled into the changelog the next time that area is touched.

---

## 4. Guardrails Specifically for AI Coding Assistants

- **Red-Zone Files**: Before touching any file marked Red-Zone in the directory tree (auth, RBAC, revocation, transactions, provisioning, MFA), flag the change explicitly for human review rather than merging autonomously.
- **Schema Discipline**: Never invent a new database field or collection without also updating `packages/shared-types` and the ER diagram in `docs/database/`.
- **Atomic Transactions**: Never bypass `BaseRepository.js`'s transaction handling for a multi-document write (e.g. event + team + chat room creation) — if a new atomic operation is needed, extend `BaseRepository`, don’t write a one-off `Model.save()` sequence.
- **Permission Registration**: When adding a new permission-gated action, add the permission code to `shared-constants/permissions.js` first, then wire the check — don't inline a new ad-hoc check in the controller.
- **Worker Jobs**: When adding a new scheduled job, register it in `apps/workers/src/jobs/scheduler.js` — don’t spin up a separate cron mechanism.
- **Core Blast Radius**: Any change to `core/` (framework-level code) should come with a note on which modules it affects, since `core/` is shared by every feature module.
- **Security Posture**: If a request implies bypassing rate limiting, MFA, or RBAC "just for testing" in a way that could ship to production, decline and suggest a feature flag or a dedicated test fixture instead.
- **Module Architecture**: Match the existing module shape (`*.routes.js`, `*.controller.js`, `*.service.js`, `*.repository.js`, `*.model.js`, `*.validator.js`, `*.permissions.js`, `*.index.js`, `__tests__/`) when creating a new module — don't introduce a divergent structure for a single feature.
