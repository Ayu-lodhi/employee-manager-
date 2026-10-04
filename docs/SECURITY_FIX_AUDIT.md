# Security Fix Audit — Phase 1

## Issue 1: Hardcoded Secrets in Source

### CONFIRMED ✓

#### JWT Secret Fallback
- **File:** `apps/api/src/modules/auth/auth.tokens.js`, line 4
- **Code:** `const JWT_SECRET = process.env.JWT_SECRET || 'tbi_super_secret_key_change_in_production_min_32_chars';`
- **Issue:** Falls back to hardcoded string when `JWT_SECRET` env var is missing
- **Used by:** 
  - Line 16: `authState()` — HMAC-SHA256 key
  - Line 23: `sign()` — JWT signing key
  - Line 26: `verify()` — JWT verification key
- **Critical:** If `JWT_SECRET` is not set, all tokens are signed with the hardcoded fallback value

#### MongoDB URI Fallback (with embedded credentials)
- **File:** `apps/api/src/server.js`, line 95
- **Code:** `const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://ayushlodhi88_db_user:9IzJqRATQYl1hERt@ac-gkiqwag-shard-00-00.wiv7fca.mongodb.net:27017,...'`
- **Issue:** Falls back to a hardcoded connection string with embedded credentials
- **Used by:** Line 98, `mongoose.connect(MONGODB_URI, ...)`
- **Critical:** Credentials are exposed in the source code

#### Environment Validation (envValidation.js)
- **File:** `apps/api/src/core/config/envValidation.js`
- **Status:** Validates at startup if `MONGODB_URI` and `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are present
- **Problem:** `auth.tokens.js` reads `process.env.JWT_SECRET` (different name), not the validated `JWT_ACCESS_SECRET`
- **Name Mismatch:** Validation requires `JWT_ACCESS_SECRET` (min 16 chars), but `auth.tokens.js` reads `JWT_SECRET` (different variable name)
- **Result:** Validation passes but tokens still use hardcoded fallback

#### Alternative Config System (env.config.js)
- **File:** `apps/api/src/core/config/env.config.js`
- **Status:** Contains fallbacks for all secrets including `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `MONGODB_URI`
- **Imports:** Used in **both apps/api and apps/web** (ES6 modules):
  - `apps/api/src/core/database/connection.js` (imports `ENV.MONGODB_URI`)
  - `apps/api/src/core/middleware/auth.middleware.js` (imports `ENV.JWT_ACCESS_SECRET`)
  - `apps/api/src/core/config/redis-*.client.js` (all import from env.config.js)
  - Same pattern in `apps/web/server/` (duplicate env.config.js)
- **Fallback Values:**
  - `MONGODB_URI`: `mongodb://localhost:27017/tbi_platform`
  - `JWT_ACCESS_SECRET`: `dev_secret_jwt_access_must_be_long`
  - `JWT_REFRESH_SECRET`: `dev_secret_jwt_refresh_must_be_long`
  - Plus Redis URLs with localhost fallbacks

### Variable Name Conflict Summary
- `envValidation.js` requires: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MONGODB_URI`
- `auth.tokens.js` reads: `JWT_SECRET` (different name)
- `env.config.js` and database/auth middleware in both apps use: `ENV.JWT_ACCESS_SECRET`, `ENV.MONGODB_URI`
- **Active code path:** Mixed — some code uses `auth.tokens.js` (old CommonJS), some uses `env.config.js` (new ES6)

### Conclusion
**Issue #1 is CONFIRMED.** Two separate secret sources with different variable names:
1. Old path: `auth.tokens.js` reads `JWT_SECRET` with fallback (not validated)
2. New path: `env.config.js` and database connection read `JWT_ACCESS_SECRET` and `MONGODB_URI` with fallbacks (not validated at startup)

---

## Issue 2: Session Enforcement Can Fail Open

### CONFIRMED ✓

**File:** `apps/api/src/modules/auth/auth.service.js`, lines 15–47

#### acquireSession() behavior:
```javascript
const acquireSession = async (userId) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const mongoose = require('mongoose');
  if (mongoose.connection?.readyState !== 1) {
    return { updatedUser: null, sessionId };  // ← FAIL OPEN: Returns success even if DB is down
  }
  // ... attempts update, but no error handling if update fails
  const updatedUser = await User.findByIdAndUpdate(userId, { $set: { activeSessionId: sessionId, ... } });
  return { updatedUser, sessionId };
};
```

#### issueSession() behavior:
```javascript
const issueSession = (user, isMfaVerified, sessionId) => {
  // ... generates and returns accessToken and refreshToken regardless
  return {
    mustChangePassword: boolean,
    passwordChangeToken: string,
    // OR
    user: {...},
    accessToken: string,
    refreshToken: string,
  };
};
```

#### Callers and impact:
1. **`login()` (line 73):** `const { updatedUser, sessionId } = await acquireSession(user._id);` then `return issueSession(updatedUser || user, false, sessionId);`
   - If `acquireSession` returns `{ updatedUser: null, sessionId }`, **tokens are still issued** with the user's fallback, but `activeSessionId` is never stored

2. **`verifyMfa()` (line 85):** Same pattern — calls `acquireSession()` then `issueSession()`

3. **Result:** If MongoDB is unavailable:
   - Session ID is generated but never persisted
   - Valid tokens are issued anyway
   - Single-session enforcement is bypassed
   - A second login attempt will be accepted (existing token remains valid)

### Conclusion
**Issue #2 is CONFIRMED.** `acquireSession()` returns success-like result even when the database is down, and `issueSession()` blindly generates tokens regardless of session persistence.

---

## Issue 3: Auth Verification Should Fail Closed

### CONFIRMED ✓

**File:** `apps/api/src/modules/auth/auth.middleware.js`, lines 6–51

#### authenticateToken() behavior:
```javascript
const authenticateToken = async (token, allowPasswordChange = false) => {
  const decoded = tokens.verify(token, ...);
  const user = await repository.findById(decoded.sub);
  if (!user?.isActive || decoded.authState !== tokens.authState(user)) {
    throw new Error('Account or credentials changed; sign in again');
  }
  // ... session ID check, timeout check, lastActivity update
  if (mongoose.connection?.readyState !== 1) {
    return { ...decoded, name: user.name, email: user.email, role: user.role };  // ← Returns user without DB confirmation
  }
  // Updates lastActivity if DB connected
  return { ...decoded, name: user.name, email: user.email, role: user.role };
};
```

#### Issues:
1. Line 8: `repository.findById(decoded.sub)` can throw if database is down, but error is not explicitly caught in this function
2. Lines 32–48: If MongoDB is not connected, `lastActivity` update is skipped silently (no error thrown)
3. Result: A request with a valid token but an unverifiable user state is allowed through if the database is temporarily unavailable

### Conclusion
**Issue #3 is CONFIRMED.** If the user or session state cannot be loaded (DB error/disconnection), the middleware does not fail closed; it attempts to continue or returns incomplete verification.

---

## Issue 4: Regex Built from teamName (unsafe)

### CONFIRMED ✓

**File:** `apps/api/src/modules/auth/auth.middleware.js`, line 123

```javascript
exports.requireTeam = (teamName) => {
  return async (req, res, next) => {
    const role = req.user.role || '';
    const isTeamMatch = (teamName === 'T3' && (role === 'T3_EXECUTIVE' || role === 'T3')) ||
                        (req.user.team && req.user.team.toUpperCase() === teamName.toUpperCase());
    
    if (isTeamMatch) return next();
    
    if (req.user.teamId) {
      try {
        const Team = require('../teams/teams.model');
        const team = await Team.findById(req.user.teamId);
        if (team && (team.name.toUpperCase().includes(teamName.toUpperCase()) || 
                     team.name.toUpperCase() === teamName.toUpperCase())) {
          return next();
        }
      } catch (err) {
        // Fall through
      }
    }
    
    try {
      const Team = require('../teams/teams.model');
      const memberTeam = await Team.findOne({
        name: new RegExp(`^${teamName}$`, 'i'),  // ← UNSAFE: teamName is not escaped
        $or: [{ members: req.user.sub }, { leadId: req.user.sub }]
      });
      if (memberTeam) return next();
    } catch (err) {
      // Fall through
    }
    
    return res.status(403).json({...});
  };
};
```

#### Matching behavior (current):
1. Exact match: role or `user.team` vs `teamName` (case-insensitive)
2. MongoDB regex: `^${teamName}$` case-insensitive (start/end anchored, exact match within name field)
3. Prefix/contains match: `team.name.toUpperCase().includes(teamName.toUpperCase())`

#### Risk:
- Line 123: `new RegExp(\`^${teamName}$\`, 'i')` — if `teamName` contains regex metacharacters (`.*`, `[`, `]`, `(`, `)`, etc.), they are interpreted as patterns
- Example: If `teamName = "T.*"`, it matches any team name starting with `T` followed by anything
- **Current Usage:** Only called with hardcoded strings from routes (e.g., `requireTeam('T3')`), so risk is LOW but the pattern is unsafe if reused

### Conclusion
**Issue #4 is CONFIRMED (but low risk).** The regex is dynamically built from `teamName`, which is unsafe if ever fed user-controlled values.

---

## Issue 5: Raw Error Details Returned to Clients

### CONFIRMED ✓

**File:** `apps/api/src/server.js`, lines 89–92

```javascript
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message });
});
```

#### Current behavior:
- All errors return `err.message` directly to the client
- If an error contains secrets (e.g., "Database connection failed: mongodb://...@host"), that message is exposed
- In production, internal stack traces and implementation details leak to clients

#### Example leaks:
- Database errors: "Error: connect ECONNREFUSED 127.0.0.1:27017"
- Auth errors: "ReferenceError: isAdmin is not defined" (exposes variable names)
- File system errors: "Error: ENOENT: no such file or directory, open '/tmp/secret.txt'"

### Conclusion
**Issue #5 is CONFIRMED.** Raw error messages are returned to clients for all errors, potentially leaking sensitive information.

---

## Issue 6: Sensitive Data in Queue Logs

### CONFIRMED ✓

**File:** `apps/api/src/core/queues/queue.service.js`

#### Logging with full email addresses:
- Line 110–115: `enqueueEmail()` logs:
  ```javascript
  logger.info('Email job enqueued to BullMQ worker', {
    jobId: job.id,
    name: jobName,
    to: payload.to,  // ← Full email address logged
    requestId: jobData.requestId,
  });
  ```

- Line 155–159: `enqueueCertificateGeneration()` logs:
  ```javascript
  logger.info('Certificate generation job enqueued to BullMQ worker', {
    jobId: job.id,
    certificateId: payload.certificateId,
    requestId: jobData.requestId,
  });
  ```

#### Auth module logs:
**File:** `apps/api/src/modules/auth/auth.service.js` — No direct token/password logging found in main service, but `auth.middleware.js` logs at line 66:
```javascript
catch (error) {
  return res.status(error.statusCode || 401).json({
    success: false,
    message: error.message || 'Invalid token or required authentication step incomplete',
  });
}
```

#### Verdict:
- Queue logs expose full email addresses (PII)
- No tokens, passwords, or OTPs logged in the service code itself
- Error messages in responses may leak details

### Conclusion
**Issue #6 is CONFIRMED (partial).** Queue service logs full email addresses; no token logging found in service code, but error responses may expose sensitive info (covered by Issue #5).

---

## Additional Findings (Not in Scope, Reported Only)

1. **env.config.js used in both API and Web apps** — means ES6 modules coexist with CommonJS (`auth.tokens.js`)
2. **No tests found** for the current behavior baseline
3. **GitHub secret patterns** — hardcoded credentials in the repository (already exposed; must be rotated by you)

---

## Variable Name Summary for Phase 2

| Purpose | envValidation.js | auth.tokens.js | env.config.js | Notes |
|---------|-----------------|---------------|--------------| -----|
| JWT signing | `JWT_ACCESS_SECRET` (min 16) | `JWT_SECRET` (hardcoded fallback) | `JWT_ACCESS_SECRET` (dev fallback) | **Mismatch:** Different variable names |
| MongoDB | `MONGODB_URI` (required) | N/A | `MONGODB_URI` (localhost fallback) | **Mismatch:** Only validated in one place |
| Redis Cache | `REDIS_CACHE_URL` (required) | N/A | `REDIS_CACHE_URL` (localhost fallback) | Validated and used |
| Redis PubSub | `REDIS_PUBSUB_URL` (required) | N/A | `REDIS_PUBSUB_URL` (localhost fallback) | Validated and used |
| Redis Queue | `REDIS_QUEUE_URL` (required) | N/A | `REDIS_QUEUE_URL` (localhost fallback) | Validated and used |

---

## End of Phase 1 Audit
