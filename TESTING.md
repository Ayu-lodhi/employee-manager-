# TESTING.md

**Last updated:** 2026-10-05
**Production commit:** `8a85481`
**Verified against code:** yes

---

## Test Commands

```pwsh
# Unit tests — apps/api (31 tests, zero deps, ~14s)
node --test apps/api/src/__tests__/*.unit.test.js

# Same via npm script
npm test --workspace=tbi-api

# Production build gate (web bundle)
npm run build   # from repo root — alias for vite build in apps/web
```

---

## Latest Test Results (2026-10-05, commit 8a85481)

```
tests 31 | pass 31 | fail 0 | cancelled 0 | skipped 0 | duration 14.2s
```

### Tests by file (`apps/api/src/__tests__/`)

| File | What it covers |
|------|---------------|
| `profile.unit.test.js` | `calculateCompletion`, mass-assignment protection, LinkedIn validator (XSS/SSRF rejection, normalization), future birthday rejection, gender normalization across enum, `fieldOfStudy` casting |
| `routes.unit.test.js` | Route drift check — verifies all expected routes are registered and no unexpected routes leaked |
| `auth.*.test.js` (web/server) | MFA TOTP flow, JWT purpose enforcement, session expiry, socket authentication |
| `password-change.test.js` | Bcrypt 72-byte boundary, mandatory replacement flow |
| `notifications.test.js` | IDOR read protection, delivery log injection prevention |
| `attendance.test.js` | Team membership requirement, history interval bounds, cross-team denial |
| `teams.test.js` | Membership mutation authorization, contact data exposure |
| `timesheets.test.js` | Team binding to authorized team, bracket selector injection |
| `chat.test.js` | Team chat room authorization bypass |
| `email.test.js` | Profile name HTML escaping, STARTTLS enforcement, bulk-import regex ReDoS |
| `bulk-import.test.js` | Email validation length boundary, separator-exclusive regex |

---

## Test Tooling

- **Runner:** Built-in `node:test` (Node 18+) — zero external test deps
- **Assertions:** `node:assert/strict`
- **HTTP:** `node:http` + native `fetch`
- **No:** jest, mocha, supertest, mongodb-memory-server

**Why no external test deps:** Supply-chain security, portability across Windows/Linux/macOS, CI performance (<100ms unit suite overhead).

---

## Coverage Gaps (not yet tested)

- End-to-end browser flows (no Playwright/Cypress)
- Vercel serverless cold-start behavior
- Socket.io real-time events in integration
- Certificate PDF generation (stub — not implemented)
- Workers/BullMQ (stubs — not implemented)
- Redis-based rate limiting (in-memory only, no cross-instance tests)
- MongoDB index performance

---

## Known Test Issues

- Gender normalization test takes ~11s (uses `mongoose.connect` to test real schema setter behavior with in-memory validation) — this is expected.
- `core/cache/cacheInvalidator.js` emits ESM warning when loaded via `require()` in the CJS server context — does not fail tests but causes a warning line in output.
