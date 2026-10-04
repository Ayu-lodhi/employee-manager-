# Profile Authorization Matrix
**Phase 2 — Written before implementation (tests must fail first)**

## Endpoint Definitions

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/profile/me` | Own full profile |
| `PATCH /api/v1/profile/me` | Edit own profile fields (allow-listed) |
| `POST /api/v1/profile/me/avatar` | Upload own avatar |
| `GET /api/v1/profile/me/completion` | Own completion % + missing list |
| `GET /api/v1/profile/me/progress` | Own progress score + breakdown |
| `GET /api/v1/profile/:userId` | View another user's profile |
| `GET /api/v1/profile/team` | T3 executive: list their team members |
| `GET /api/v1/admin/users` | Admin/Super Admin: searchable user list |
| `PATCH /api/v1/admin/users/:userId/tier` | Admin/Super Admin: change a user's tier |

## Authorization Matrix

| Actor | `GET /me` | `PATCH /me` | `POST /me/avatar` | `GET /me/completion` | `GET /me/progress` | `GET /:userId` (other user) | `GET /team` | `GET /admin/users` | `PATCH /admin/users/:id/tier` |
|-------|-----------|-------------|-------------------|---------------------|-------------------|-----------------------------|-------------|-------------------|-------------------------------|
| **Anonymous** | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| **Invalid token** | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| **Expired token** | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| **Tampered token** | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| **Revoked session** | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |
| **T1_VOLUNTEER (own)** | 200 | 200 | 200 | 200 | 200 | 403 | 403 | 403 | 403 |
| **T2_ASSOCIATE (own)** | 200 | 200 | 200 | 200 | 200 | 403 | 403 | 403 | 403 |
| **T3_EXECUTIVE (own)** | 200 | 200 | 200 | 200 | 200 | — | — | 403 | 403 |
| **T3 exec → member** | — | — | — | — | — | 200 (work fields only) | 200 (own members) | 403 | 403 |
| **T3 exec → non-member** | — | — | — | — | — | 403 | — | 403 | 403 |
| **T3 exec → admin/superadmin** | — | — | — | — | — | 403 | — | 403 | 403 |
| **ADMIN (own)** | 200 | 200 | 200 | 200 | 200 | 200 (full) | — | 200 | 403 (self) |
| **ADMIN → T1/T2/T3 target** | — | — | — | — | — | 200 (full) | — | — | 200 |
| **ADMIN → ADMIN target** | — | — | — | — | — | 200 (full) | — | — | 403 |
| **ADMIN → SUPER_ADMIN target** | — | — | — | — | — | 200 (full) | — | — | 403 |
| **SUPER_ADMIN (own)** | 200 | 200 | 200 | 200 | 200 | 200 (full) | — | 200 | 403 (self) |
| **SUPER_ADMIN → ADMIN target** | — | — | — | — | — | 200 (full) | — | — | 200 |
| **SUPER_ADMIN → any** | — | — | — | — | — | 200 (full) | — | — | 200 |
| **Unknown userId format** | — | — | — | — | — | 400 | — | — | 400 |
| **Non-existent userId** | — | — | — | — | — | 404 | — | — | 404 |

## Field-Level Privacy

| Field | Owner | T3 Exec (member) | Admin | Super Admin |
|-------|-------|-----------------|-------|-------------|
| name | ✅ | ✅ | ✅ | ✅ |
| headline/course | ✅ | ✅ | ✅ | ✅ |
| university | ✅ | ✅ | ✅ | ✅ |
| city | ✅ | ✅ | ✅ | ✅ |
| skills | ✅ | ✅ | ✅ | ✅ |
| education | ✅ | ✅ | ✅ | ✅ |
| projects | ✅ | ✅ | ✅ | ✅ |
| linkedinUrl | ✅ | ✅ | ✅ | ✅ |
| avatarUrl | ✅ | ✅ | ✅ | ✅ |
| completionPercent | ✅ | ❌ | ✅ | ✅ |
| progressScore | ✅ | ✅ | ✅ | ✅ |
| **gender** | ✅ | ❌ | ✅ | ✅ |
| **birthday** | ✅ | ❌ | ✅ | ✅ |
| **mobile/phone** | ✅ | ❌ | ✅ | ✅ |
| **mobileVerified** | ✅ | ❌ | ✅ | ✅ |
| **email** | ✅ | ❌ | ✅ | ✅ |
| **emailVerified** | ✅ | ❌ | ✅ | ✅ |

## Tier Change Rules

| Caller | Target | New Tier | Result |
|--------|--------|---------|--------|
| ADMIN | T1/T2/T3 | T1/T2/T3 | 200 ✅ |
| ADMIN | ADMIN | any | 403 ❌ |
| ADMIN | SUPER_ADMIN | any | 403 ❌ |
| ADMIN | self | any | 403 ❌ |
| SUPER_ADMIN | T1/T2/T3 | T1/T2/T3 | 200 ✅ |
| SUPER_ADMIN | ADMIN | T1/T2/T3 | 200 ✅ |
| SUPER_ADMIN | self | any | 403 ❌ |
| T3/T2/T1 | any | any | 403 ❌ |
| any | any | T4/admin/superadmin/empty/array/number | 400 ❌ |

## IDOR Prevention

Every `GET /profile/:userId` and `PATCH /admin/users/:userId/tier` checks:
1. Caller's identity from JWT (`req.user.sub`) — never from request body
2. Target userId from URL param — validated as valid ObjectId
3. Authorization based on caller role and target role — deny by default

A user cannot escalate by tampering the userId in URL, body, or query — the server  
always uses `req.user.sub` as the caller identity and checks against the real user record.

## Mass Assignment Protection

`PATCH /profile/me` allow-list:
```
headline, university, city, gender, birthday, mobile, skills, education,
projects, linkedinUrl, bio, availability
```

Fields that can NEVER be set by any user via `PATCH /profile/me`:
```
role, tier, permissions, grants, emailVerified, mobileVerified,
completionPercent, progressScore, progress, userId, _id, isAdmin,
isActive, password, activeSessionId, mustChangePassword
```

## LinkedIn Validation Rules

**Accept:**
- `https://www.linkedin.com/in/some-name`
- `https://linkedin.com/in/x`
- `https://in.linkedin.com/in/x`

**Reject:**
- `http://` (must be https)
- `javascript:alert(1)`, `data:text/html,...`
- `https://linkedin.com.evil.com/in/x`
- `https://evil.com/linkedin.com`
- `https://notlinkedin.com/in/x`
- `https://linkedin.com@evil.com`
- URLs with credentials (`user:pass@`)
- Non-URL strings
- Overlong URLs (> 2048 chars)
- Unicode look-alike hosts

**Implementation:** Regex + URL parse check — hostname must be exactly `linkedin.com`  
or end with `.linkedin.com`. Path must start with `/in/`.
