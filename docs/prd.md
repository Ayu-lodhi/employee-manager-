# PRD.md — TBI Student Engagement & Event Workforce Management System

## 1. What to Build

A centralized, admin-provisioned web platform that replaces WhatsApp groups, spreadsheets, and email chains for running TBI's (Technology Business Incubator's) event workforce. It covers the full lifecycle: 
**Event creation → Team assembly → Auto-created chat rooms → Student applications → Approval → QR-based attendance → Certificate generation → Analytics.**

No public signup. Every account is created by an Admin or Super Admin and delivered to the user with a temporary password.

---

## 2. Targeted Users

| Role | Who | Core Need & Scope |
|---|---|---|
| **Super Admin** | System Owner | Full control, audit visibility, administrative user management, revoke access, system health monitoring |
| **Admin** | TBI Manager | Create and manage events, provision users (single + bulk CSV), view platform-wide analytics |
| **T3 — Executive** | Senior Team Lead | Review applications (approve/reject queue), manage attendance marking, access team-level analytics |
| **T2 — Associate** | Team Coordinator | Coordinate shifts, support T1 volunteers, interact in team chat |
| **T1 — Volunteer** | Student / First Responder | Discover events, apply to shifts, real-time chat, QR check-in, collect instant verifiable certificates |

**User Base Projections:**
- ~2,500 users at launch.
- Estimated growth of ~25% per quarter.
- T1 volunteers represent the largest and fastest-growing user group (>85% on mobile browsers).

---

## 3. Features

### 3.1 Auth & Provisioning
- **Admin-Provisioned Accounts Only**: No public self-registration.
- **Default Temporary Password**: Auto-generated format: `TBI@` + 6 random alphanumeric characters (excluding ambiguous characters like `0`, `O`, `l`, `I`, `1`) + 2 digits, hashed with `bcrypt` (12 salt rounds).
- **Forced First-Login Password Change**: Immediate prompt to set a new password on initial authentication.
- **Mandatory MFA (TOTP)**: Required for `ADMIN` and `SUPER_ADMIN` accounts.
- **Two Distinct Password Expiry Policies**:
  - Unused temporary passwords expire in **7 days**.
  - Active accounts require password rotation every **90 days**.
- **Bulk User Import via CSV**: Validated, audited, and processed through the exact same delivery and credentialing path as single-user creation.

### 3.2 Roles & Permissions
- Single `role` field per user: `T1_VOLUNTEER`, `T2_ASSOCIATE`, `T3_EXECUTIVE`, `ADMIN`, `SUPER_ADMIN`.
- **Permission-Based RBAC**: Role-default permission grants with per-user `ACCESS_GRANT` overrides for specific granular capabilities without requiring full promotion.
- **Immutable Audit Logging**: Every role change, access grant override, account deactivation, and revocation is recorded with actor ID, timestamp, target ID, and reason.

### 3.3 Events, Teams & Shifts
- **Atomic Event Creation**: An event, its associated teams, and corresponding team chat rooms are created atomically in a single transaction.
- **Shift Definitions**: Capacity limits per shift with atomic reservation counters to guard against oversubscription and double-booking races.

### 3.4 Applications
- **Shift Applications**: Students apply to specific shifts within an event.
- **Review Queue**: T2/T3 team leads review, approve, or reject applications.
- **Event-Driven Chat Enrollment**: Approval automatically triggers `applicationApproved.listener.js`, which asynchronously adds the student to the event's team chat room without tightly coupling the approval HTTP controller.

### 3.5 Real-Time Chat
- **Auto-Created Team Chat Rooms**: Bound to teams upon creation.
- **Lifecycle Management**: Automatically archived into read-only mode upon event closure.
- **Abuse Prevention**: Dedicated per-connection WebSocket message rate limiting independent of REST API limits.

### 3.6 Attendance
- **QR-Code Check-in**: Dynamic, tamper-resistant QR code scanned and verified on event day.
- **Admin/Lead Verification**: Immediate check-in verification for event coordinators.
- *Note*: Geofencing verification is deferred to v2.

### 3.7 Certificates
- **Automated Generation**: High-performance PDF certificate generation with embedded verification QR codes.
- **Templates**: 3 standard templates (Participation, Excellence, Leadership).
- **Concurrency Protection**: Optimistic locking to prevent duplicate certificate generation under parallel requests.
- **Public Verification**: Fast public verification endpoint accessible without login.

### 3.8 Reviews & Analytics
- **Post-Event Feedback**: Multi-criteria review and rating system for events and volunteers.
- **Multi-Level Dashboards**:
  - Super Admin: System health, active sessions, platform throughput.
  - Admin: Event turnaround, volunteer utilization, platform stats.
  - T3 Lead: Team performance, shift coverage, attendance rates.
  - Public/Student: Volunteer leaderboard and recognition.

### 3.9 Notifications
- **Unified Delivery Service**: Multi-channel delivery (Email via SES/SendGrid, SMS via Twilio/MSG91, in-app push).
- **Reliability**: Asynchronous, idempotent background workers with deduplication keys and retry exponential backoff.

---

## 4. Security Measures

- **Perimeter Security**: AWS WAF rules, AWS Shield DDoS protection, CloudFront CDN, strict TLS 1.3 encryption.
- **Authentication (AuthN)**: Short-lived JWT access tokens + rotating refresh tokens, token blacklist in Redis for immediate session revocation, session validation middleware.
- **Authorization (AuthZ)**: Granular permission-based RBAC evaluated server-side on every request via `rbac.middleware.js`. No client-side or role-string trust.
- **Multi-Factor Authentication (MFA)**: TOTP enrollment and challenge mandatory for `ADMIN` and `SUPER_ADMIN`.
- **Password Security**: `bcrypt` with 12 rounds, forced password change on first login, dual-tier expiry policy.
- **Data Protection**: AES-256 encryption at rest, TLS 1.3 in transit, strict PII masking in logs (emails, phone numbers, auth tokens). Real secrets managed via AWS Secrets Manager.
- **Infrastructure Security**: Isolated AWS VPC private subnets, least-privilege IAM policies, security groups/NACLs, automated vulnerability scanning (Snyk/Trivy) in CI/CD.
- **Unified Session Termination**: Shared `sessionTerminator.js` executed for both Admin "Deactivate" and Super Admin "Revoke" operations to ensure zero persistent sessions.
- **Rate Limiting**: Distributed Redis-backed rate limiting across all API endpoints, with dedicated connection-level rate limiting for WebSocket chat.

---

## 5. Non-Goals for v1

- Native mobile applications (Web responsive only, optimized for mobile browsers).
- Payment gateway integration (All initial events are unpaid/internal).
- Blockchain-based certificate verification (Cryptographically signed DB records and QR URLs are sufficient).
- Multi-tenant architecture (Single dedicated TBI deployment).
- Geofenced attendance verification (Deferred to v2 due to web browser location reliability).
- AI-driven volunteer matching or recommendation engines.

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| **Active Users on Platform** | 1,000+ within 6 months |
| **Application-to-Approval Time** | < 4 hours |
| **Attendance Verification Time** | < 5 minutes on event day |
| **Certificate Generation Time** | Instantaneous / real-time download |
| **Admin Time Saved** | 20+ hours / week |
| **System Uptime** | 99.9% availability |
| **Peak Concurrent Users** | 10,000+ without degradation |
