# Testing Documentation: apps/api

## Testing Philosophy & Standards

To ensure minimal attack surface, reproducible CI builds, and zero supply-chain bloat, `apps/api` standardizes on **Node.js native test tooling**:

1. **Test Runner:** Built-in `node:test` runner.
2. **Assertions:** Built-in `node:assert/strict`.
3. **HTTP Testing:** Built-in `node:http` and native `fetch` (standard in Node 18+).
4. **Dependencies:** Zero external test packages (`supertest`, `mongodb-memory-server`, `jest`, `mocha` are excluded).

---

## Test Suites

### 1. Unit Tests (`npm test`)
- Command: `npm test` (or `node --test src/__tests__/*.unit.test.js`)
- Runs in-process unit tests that do not require external databases or running services.
- Example: [`src/__tests__/profile.unit.test.js`](file:///e:/project%20emp/tbi/apps/api/src/__tests__/profile.unit.test.js) validates:
  - LinkedIn profile URL structure, security edge cases, credential rejection, and URL normalization.
  - Profile completion scoring algorithm (weight summation assertion, partial scoring, 100% boundary testing).

### 2. Integration / System Tests
- Example: [`src/__tests__/phase4-control.test.js`](file:///e:/project%20emp/tbi/apps/api/src/__tests__/phase4-control.test.js) tests health checks and queue security endpoints against running infrastructure.
- Uses native `node:http` to bind the Express application to an ephemeral port and tests endpoints with native `fetch`.

---

## Why `mongodb-memory-server` and `supertest` Were Omitted
- **Supply-Chain Security:** Adding heavy external test dependencies increases vulnerability exposure and installation overhead.
- **Portability:** Native `node:test` + `fetch` executes deterministically across Windows, Linux, and macOS without downloading architecture-specific database binaries.
- **CI Performance:** Unit tests complete in <100ms with zero extra `node_modules` overhead.
