# TBI Platform — Performance, Efficiency & Control Audit

**Date**: 2026-10-03  
**Branch**: `improve/performance-and-control`  
**Repository**: `employee-manager-` (TBI Workforce Platform)  

---

## Executive Summary
This audit inspects the current speed, efficiency, and control mechanisms across `apps/api`, `apps/web`, and `apps/workers`. While the system enforces strong security primitives (MFA, password expiration, single-session enforcement, role checks), critical bottlenecks exist around un-cached database queries, in-memory rate limiting, stubbed background workers, synchronous email delivery, unindexed MongoDB collections, missing request tracking, and un-split client bundles.

---

## Audit Findings by Area

### 1. Rate Limiting: In-Memory vs. Multi-Instance
* **Implementation**: [`apps/api/src/middleware/rateLimit.middleware.js:1-59`](file:///e:/project%20emp/tbi/apps/api/src/middleware/rateLimit.middleware.js#L1-L59)
* **Status**: Purely in-memory using JavaScript `Map` instances (`requests` and `userCreateRequests`).
* **Multi-Instance Support**: **NO**. Rate limits do not synchronize across API instances (e.g. ECS Fargate containers or Docker replicas behind an ALB). Each replica tracks its own isolated counter, allowing clients to bypass limits by rotating across nodes.
* **Failure Mode**: Server restarts reset counters immediately. Memory usage grows with unique IP count.

---

### 2. Auth & RBAC Guard: Database & Redis Calls per Request
* **Implementation**: [`apps/api/src/modules/auth/auth.middleware.js:6-52`](file:///e:/project%20emp/tbi/apps/api/src/modules/auth/auth.middleware.js#L6-L52), [`apps/api/src/core/middleware/rbac.middleware.js:10-40`](file:///e:/project%20emp/tbi/apps/api/src/core/middleware/rbac.middleware.js#L10-L40)
* **Calls per Request**:
  1. `await repository.findById(decoded.sub)` ([`auth.middleware.js:8`](file:///e:/project%20emp/tbi/apps/api/src/modules/auth/auth.middleware.js#L8)) — **1 MongoDB read** on every authenticated request.
  2. `await User.updateOne({ _id: user._id }, { $set: { lastActivity: now } })` ([`auth.middleware.js:44`](file:///e:/project%20emp/tbi/apps/api/src/modules/auth/auth.middleware.js#L44)) — **1 MongoDB write** on every authenticated request.
  3. **0 Redis calls**: Redis is currently bypassed in `auth.middleware.js` during standard request verification.
* **Caching**: **None**. User identity, role, and resolved permissions are fetched and evaluated fresh on every single request. No caching is implemented for permission resolution.

---

### 3. MongoDB: Missing Indexes, `.lean()`, Projection, and Startup Index Sync
* **Startup Index Sync in Production**:
  - [`apps/api/src/server.js:77-84`](file:///e:/project%20emp/tbi/apps/api/src/server.js#L77-L84): Runs `await Attendance.syncIndexes()` and `await AttendanceLink.syncIndexes()` inside `server.js` startup connection handler.
  - [`apps/api/src/core/database/connection.js:8`](file:///e:/project%20emp/tbi/apps/api/src/core/database/connection.js#L8): Configures `autoIndex: true`. In production Mongoose clusters, building indexes at application boot causes severe performance degradation and lock contention.
* **Missing Indexes**:
  - `Review` ([`apps/api/src/modules/reviews/reviews.model.js:3-13`](file:///e:/project%20emp/tbi/apps/api/src/modules/reviews/reviews.model.js#L3-L13)): Zero indexes on `reviewedBy`, `studentId`, `eventId`, or `createdAt`, despite sort and filter queries.
  - `Certificate` ([`apps/api/src/modules/certificates/certificates.model.js:3-11`](file:///e:/project%20emp/tbi/apps/api/src/modules/certificates/certificates.model.js#L3-L11)): Missing composite index on `{ studentId: 1, issuedAt: -1 }`.
  - `Application` ([`apps/api/src/modules/applications/applications.model.js:3-29`](file:///e:/project%20emp/tbi/apps/api/src/modules/applications/applications.model.js#L3-L29)): Zero indexes on `studentId`, `teamId`, `status`, or `appliedAt`.
  - `Team` ([`apps/api/src/modules/teams/teams.model.js:3-15`](file:///e:/project%20emp/tbi/apps/api/src/modules/teams/teams.model.js#L3-L15)): Zero indexes on `leadId`, `members`, or `eventId`.
* **Missing `.lean()` & Field Projections**:
  - [`apps/api/src/core/BaseRepository.js:29-39`](file:///e:/project%20emp/tbi/apps/api/src/core/BaseRepository.js#L29-L39): `findAll` returns fully hydrated Mongoose documents without `.lean()`.
  - Read queries in `reviews.controller.js:5`, `certificates.controller.js:6-15`, `teams.service.js:45`, and `applications.service.js:162-172` lack `.lean()` and select all fields.
* **Pagination**:
  - Read endpoints such as `reviews.controller.js`, `teams.service.js`, and `certificates.controller.js` query all documents with unbounded collections or static hardcoded `.limit(200)` without page parameterization.

---

### 4. Workers: Heavy Work Isolation, Idempotency, and Retries
* **Heavy Work Location**:
  - **Email Sending**: Runs synchronously inside the API service process ([`apps/api/src/services/email.service.js`](file:///e:/project%20emp/tbi/apps/api/src/services/email.service.js), [`apps/api/src/modules/auth/auth.service.js`](file:///e:/project%20emp/tbi/apps/api/src/modules/auth/auth.service.js)). Network latency from SMTP/Ethereal blocks the Node.js event loop on the web server.
  - **PDF Certificate Generation**: Stubbed in `apps/api/src/modules/certificates/pdfGenerator.js:8-12`.
* **BullMQ Worker Process**:
  - [`apps/workers/src/workers/notification.worker.js:1-6`](file:///e:/project%20emp/tbi/apps/workers/src/workers/notification.worker.js#L1-L6) and [`apps/workers/src/workers/certificate.worker.js:1-6`](file:///e:/project%20emp/tbi/apps/workers/src/workers/certificate.worker.js#L1-L6) are stubs containing only `console.log` statements.
  - No active BullMQ Worker instances, no concurrency limits, no idempotency checks, no exponential backoff configuration, and no dead-letter queue (DLQ) / failed-job logging path.

---

### 5. Socket.io Architecture & Event Rate Limiting
* **Attachment**: Attached to the **same** HTTP server instance as Express ([`apps/api/src/server.js:89-91`](file:///e:/project%20emp/tbi/apps/api/src/server.js#L89-L91)).
* **Event Rate Limiting**: **None**. [`apps/api/src/config/socket.js:103-125`](file:///e:/project%20emp/tbi/apps/api/src/config/socket.js#L103-L125) handles `chat:join` and `chat:leave` without per-socket or per-user rate limiting or flood controls.

---

### 6. MongoDB Deployment: Atlas vs. Local Docker Replica Set
* **Evidence for Both**:
  1. **Atlas**:
     - [`apps/api/src/server.js:70`](file:///e:/project%20emp/tbi/apps/api/src/server.js#L70): Fallback URI targets MongoDB Atlas shard cluster (`ac-gkiqwag-shard-00-00.wiv7fca.mongodb.net:27017`).
     - [`infrastructure/terraform/main.tf:36-39`](file:///e:/project%20emp/tbi/infrastructure/terraform/main.tf#L36-L39): Module `mongodb_atlas` provisions MongoDB Atlas in production.
  2. **Local Docker Replica Set**:
     - [`docker-compose.yml:4-16`](file:///e:/project%20emp/tbi/docker-compose.yml#L4-L16): Defines local `mongodb` service with `image: mongo:7.0`, port `27017`, and `command: ["--replSet", "rs0", "--bind_ip_all"]`.
     - [`apps/api/.env.example:4`](file:///e:/project%20emp/tbi/apps/api/.env.example#L4): `MONGODB_URI=mongodb://localhost:27017/tbi_db?replicaSet=rs0`.
* **Conclusion**: Local development uses a local Docker MongoDB 7.0 container configured as a single-node replica set (`rs0`) for transaction support, whereas staging/production uses MongoDB Atlas.

---

### 7. Workers Database Access & Socket Handshake Auth Reuse
* **Workers Read/Write**: [`apps/workers/package.json:12`](file:///e:/project%20emp/tbi/apps/workers/package.json#L12) declares `mongoose: ^8.5.0`, but workers currently do not initialize a database connection or execute queries.
* **Socket Handshake Auth**: **Reused**. [`apps/api/src/config/socket.js:36`](file:///e:/project%20emp/tbi/apps/api/src/config/socket.js#L36) and [`apps/api/src/config/socket.js:70`](file:///e:/project%20emp/tbi/apps/api/src/config/socket.js#L70) directly import and execute `authenticateToken` from `apps/api/src/modules/auth/auth.middleware.js`.

---

### 8. Operational Controls: Env Validation, Shutdown, Health, Request IDs & Audit Logs
* **Environment Validation**: Missing. [`apps/api/src/server.js:4`](file:///e:/project%20emp/tbi/apps/api/src/server.js#L4) loads `dotenv` without a schema validator (Joi/Zod) to ensure required variables exist before startup.
* **Graceful Shutdown**: Missing. No `SIGTERM` or `SIGINT` handlers exist in `apps/api/src/server.js` or `apps/workers/src/index.js`.
* **Health Check**: Missing. Root route `GET /` returns static metadata ([`apps/api/src/server.js:55-61`](file:///e:/project%20emp/tbi/apps/api/src/server.js#L55-L61)) without validating database or Redis health.
* **Request IDs**: Missing. Incoming requests lack unique correlation/request IDs in headers and logs.
* **Audit Logging for Permissions**: Missing. While [`apps/api/src/models/AuditLog.model.js`](file:///e:/project%20emp/tbi/apps/api/src/models/AuditLog.model.js) exists, permission and role updates do not record audit entries.

---

### 9. Frontend: Route Code Splitting & Client-Side Caching
* **Route Code Splitting**: **None**. [`apps/web/src/App.jsx:1-15`](file:///e:/project%20emp/tbi/apps/web/src/App.jsx#L1-L15) statically imports all 32 pages from `./pages`, producing a single monolithic 965 kB JS chunk (`index-CqDSSIrM.js`).
* **Client-Side API Caching**: **None**. [`apps/web/src/api.js:26-64`](file:///e:/project%20emp/tbi/apps/web/src/api.js#L26-L64) performs an uncached `fetch` on every request.

---

## Phase Implementation Plan

| Phase | Focus Areas | Action Items |
|---|---|---|
| **Phase 2 — Speed** | Redis rate limiter, permission caching, Mongo optimization, compression, frontend lazy routes | Move rate limiter to Redis with in-memory fallback; cache resolved permissions in Redis with instant invalidation; add Mongo indexes & `.lean()`; add API compression & safe cache headers; route-split frontend |
| **Phase 3 — Efficiency** | Worker execution, BullMQ idempotency, retries | Wire BullMQ workers for emails & certificates; implement idempotency keys, retries with backoff & DLQ; preserve tri-concern Redis isolation |
| **Phase 4 — Control** | Env schema validation, permission audit log, queue dashboard, `/health`, graceful shutdown, request IDs | Add Joi/Zod env validation at boot; audit log for permission changes; admin-protected queue dashboard; `/health` checking Mongo & 3 Redis instances; SIGTERM handlers; request ID middleware; socket rate limiting |
| **Phase 5 — Architecture** | Archify diagram update | Update runtime diagram to reflect Atlas vs Docker, outside external services, socket in-process placement, and cleaner routing |
