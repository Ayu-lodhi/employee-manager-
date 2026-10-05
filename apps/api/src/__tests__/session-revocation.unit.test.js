const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'unit_test_access_secret_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'unit_test_refresh_secret_32_characters_long';

const authService = require('../modules/auth/auth.service');
const { authenticateToken } = require('../modules/auth/auth.middleware');
const tokens = require('../modules/auth/auth.tokens');
const repository = require('../modules/auth/auth.repository');
const User = require('../modules/admin/admin.model');
const bcrypt = require('bcryptjs');

function setupMockUser() {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'T1',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz12345678901234567890123456',
    isActive: true,
    activeSessionId: null,
    lastActivity: null,
    mustChangePassword: false,
    passwordChangeStartedAt: null,
  };

  const origFindByEmail = repository.findByEmail;
  const origFindById = repository.findById;
  const origFindByIdAndUpdate = User.findByIdAndUpdate;
  const origUpdateOne = User.updateOne;
  const origBcryptCompare = bcrypt.compare;
  const originalState = mongoose.connection.readyState;

  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
  repository.findByEmail = async (email) => (email === user.email ? user : null);
  repository.findById = async (id) => (id === user._id ? user : null);
  bcrypt.compare = async () => true;

  User.findByIdAndUpdate = async (id, update) => {
    if (id === user._id) {
      if (update.$set) {
        Object.assign(user, update.$set);
      }
      return { ...user };
    }
    return null;
  };

  User.updateOne = async (filter, update) => {
    if (filter._id === user._id && update.$set) {
      Object.assign(user, update.$set);
    }
    return { acknowledged: true, modifiedCount: 1 };
  };

  const cleanup = () => {
    repository.findByEmail = origFindByEmail;
    repository.findById = origFindById;
    User.findByIdAndUpdate = origFindByIdAndUpdate;
    User.updateOne = origUpdateOne;
    bcrypt.compare = origBcryptCompare;
    Object.defineProperty(mongoose.connection, 'readyState', { value: originalState, configurable: true });
  };

  return { user, cleanup };
}

test('Session Revocation - 1. Normal request with valid token returns user', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    const loginRes = await authService.login('test@example.com', 'password');
    const auth = await authenticateToken(loginRes.accessToken);
    assert.equal(auth.sub, user._id);
    assert.equal(auth.email, user.email);
  } finally {
    cleanup();
  }
});

test('Session Revocation - 2. Second login invalidates first token (returns 401)', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    const login1 = await authService.login('test@example.com', 'password');
    const login2 = await authService.login('test@example.com', 'password');

    // First token must fail with 401
    await assert.rejects(
      async () => {
        await authenticateToken(login1.accessToken);
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Session ended. Please log in again.');
        return true;
      }
    );

    // Second token must succeed
    const auth2 = await authenticateToken(login2.accessToken);
    assert.equal(auth2.sub, user._id);
  } finally {
    cleanup();
  }
});

test('Session Revocation - 3. Logout then reuse old token returns 401', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    const login = await authService.login('test@example.com', 'password');
    assert.ok(user.activeSessionId);

    // Logout
    await authService.logout(user._id);
    assert.equal(user.activeSessionId, null);

    // Old token must fail with 401
    await assert.rejects(
      async () => {
        await authenticateToken(login.accessToken);
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Session ended. Please log in again.');
        return true;
      }
    );
  } finally {
    cleanup();
  }
});

test('Session Revocation - 4. Super-admin terminates session then old token returns 401', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    const login = await authService.login('test@example.com', 'password');
    assert.ok(user.activeSessionId);

    // Super admin terminates session (simulating DELETE /super-admin/sessions/:id)
    await User.findByIdAndUpdate(user._id, { $set: { activeSessionId: null, lastActivity: null } });
    assert.equal(user.activeSessionId, null);

    // Old token must fail with 401
    await assert.rejects(
      async () => {
        await authenticateToken(login.accessToken);
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Session ended. Please log in again.');
        return true;
      }
    );
  } finally {
    cleanup();
  }
});

test('Session Revocation - 5. Access token with no sid is rejected (returns 401)', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    await authService.login('test@example.com', 'password');
    assert.ok(user.activeSessionId);

    // Sign access token without sid
    const tokenNoSid = tokens.sign(user, 'access', '15m', { role: user.role });

    await assert.rejects(
      async () => {
        await authenticateToken(tokenNoSid);
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Session ended. Please log in again.');
        return true;
      }
    );
  } finally {
    cleanup();
  }
});

test('Session Revocation - 6. Tokens for other purposes (password-change) are unaffected', async () => {
  const { user, cleanup } = setupMockUser();
  try {
    user.mustChangePassword = true;
    user.passwordChangeStartedAt = new Date();

    const changeToken = tokens.sign(user, 'password-change', '5m', {
      isMfaVerified: true,
      sid: 'temp-session',
    });

    // authenticateToken with allowPasswordChange = true
    const decoded = await authenticateToken(changeToken, true);
    assert.equal(decoded.sub, user._id);
    assert.equal(decoded.purpose, 'password-change');
  } finally {
    cleanup();
  }
});
