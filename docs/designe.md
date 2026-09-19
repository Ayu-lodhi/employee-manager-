# DESIGNE.md — Design Brief for the Frontend Designer

## 1. Who’s Using This

Five roles, five distinct dashboards — the codebase scaffolds a separate layout per role (`SuperAdminLayout`, `AdminLayout`, `T3Layout`, `T2Layout`, `T1Layout`). Design each with a shared visual language but a noticeably different information density:

- **Super Admin / Admin**: Dense, data-heavy — tables, audit logs, forms, metrics, batch actions.
- **T3 Executive**: Moderate density — review queues, team rosters, attendance marking, approvals.
- **T2 Associate**: Lighter — shift coordination, team chat, duty schedules.
- **T1 Volunteer**: Lightest, mobile-first — apply, check in, chat, certificates. **Most T1s will be on a phone browser, not a desktop.**

---

## 2. Tone

**Professional but not corporate-cold** — this is a student community platform, not enterprise SaaS. Approachable, clear, a little energetic. Avoid anything that reads as *"internal tool nobody wanted to use."*

---

## 3. Screens to Design (By Role)

### Auth (All Roles)
- Login screen.
- Forced first-login password change.
- MFA setup + TOTP verification (Admin / Super Admin only).
- Forgot / reset password flow.

### Super Admin
- Dashboard (system health, active sessions at a glance, throughput).
- Admin management (create / deactivate / revoke Admins).
- Audit logs (searchable, filterable by actor, date range, action type).
- Active sessions viewer (session inspection & kill switch).
- System configuration settings.

### Admin
- Dashboard (overall events, active volunteer counts, upcoming shifts).
- Add user / bulk import (CSV drag-and-drop, validation preview).
- User management (role changes, deactivate user, reset password — each with a reason-required modal).
- Event creation wizard (multi-step: Details → Teams → Shifts).
- Event list / detail / edit view.

### T3 Executive
- Team roster overview.
- Review applications (approve / reject queue with batch triage).
- Attendance marking (QR scanning assistant + manual override).
- Team analytics & attendance breakdown.

### T2 Associate
- Shift coordination view (volunteer assignments, roster check).
- Dedicated team chat room.

### T1 Volunteer
- Event discovery / browse (cards, filter by tags, dates).
- My applications (pending, approved, rejected status).
- QR check-in (mobile camera scanner UI, high contrast).
- Team chat (real-time chat with fellow volunteers & lead).
- My certificates / certificate gallery (instant preview & PDF download).
- Public certificate verification page (accessible without login).

### Shared Across Roles
- Chat window (message bubbles, typing indicator, read receipts, member list).
- Notifications panel (read/unread badges, push alerts).
- Profile page (contact details, password rotation, active devices).

---

## 4. Key Flows Worth Storyboarding

1. **First Login**: Temporary password → Forced password change → (Admin/Super Admin only) MFA setup → Direct entry to dashboard. *This is every user’s first impression — make it quick, frictionless, not bureaucratic.*
2. **Apply → Get Approved → Land in Team Chat**: The core loop for a T1 volunteer. *Should feel like a door opening up for them, accompanied by a clear welcome state.*
3. **Event-Day QR Check-in**: Must work lightning-fast, one-handed, in poor lighting and fluctuating mobile network conditions. *This is the highest-pressure real-world moment in the entire product.*
4. **Certificate Delivery**: Replaces a traditional 2-week paper wait with an instant high-res PDF download. *The design should celebrate this achievement (e.g., celebratory micro-animation, confetti/badge highlight), not just be a quiet file drop.*

---

## 5. Component System

Base components exist as standard primitives in the design system:
- **Core Primitives**: `Button`, `Input`, `Modal`, `Table`, `Loader`, `Card`, `Pagination`, `Toast`, `EmptyState`, `ErrorBoundary`.
- Design against this foundational set rather than introducing net-new primitives unless an essential gap is identified.
- **Color Tokens**: Base palette (neutral slate/zinc) + distinct accent/status color per role layout for subtle identification in navigation headers.
- **Type Scale & Spacing**: Strict rem-based scale with responsive adjustments for mobile viewports.
- **Empty States**: Customized empty states for every list view (event list, applications, certificates, chat).
- **Error & Toast States**: Clear, actionable error notifications and feedback banners.

---

## 6. Constraints to Design Within

- **Mobile-First for T1 Screens Especially**: QR check-in, chat, application workflow, and certificate downloads must feel native on mobile web.
- **Localization**: English and Hindi (`en.json`, `hi.json` scaffolded) — avoid baking text into images; UI elements must accommodate variable translated string lengths.
- **Accessibility**: WCAG AA compliance minimum — high contrast ratios, full keyboard navigation for desktop admin screens, screen-reader labels on icon-only buttons.
- **No Geofencing UI for v1**: The QR check-in screen must not prompt for browser location permissions in this phase.
