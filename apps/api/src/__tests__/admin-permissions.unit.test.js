const test = require('node:test');
const assert = require('node:assert');
const { requireAdminPermission } = require('../modules/auth/auth.middleware');

test('Admin permissions gate - requireAdminPermission', async (t) => {
  let status = null;
  let body = null;
  let nextCalled = false;
  
  const res = {
    status: (s) => { status = s; return { json: (b) => { body = b; } }; }
  };
  const next = () => { nextCalled = true; };

  const middleware = requireAdminPermission('users:create');

  // 1. Passes non-admin through
  await t.test('passes non-admin through', () => {
    nextCalled = false;
    middleware({ user: { role: 'T1_VOLUNTEER' } }, res, next);
    assert.equal(nextCalled, true);
    
    nextCalled = false;
    middleware({ user: { role: 'SUPER_ADMIN' } }, res, next);
    assert.equal(nextCalled, true);
  });

  // 2. Admin with NO custom grants falls back to defaults
  await t.test('admin with no customGrants falls back to defaults', () => {
    nextCalled = false;
    // users:create IS in default Admin permissions
    middleware({ user: { role: 'ADMIN' } }, res, next);
    assert.equal(nextCalled, true);
  });

  // 3. Admin with empty customGrants is denied
  await t.test('admin with empty customGrants is denied', () => {
    nextCalled = false;
    status = null;
    middleware({ user: { role: 'ADMIN', customGrants: [] } }, res, next);
    assert.equal(nextCalled, false);
    assert.equal(status, 403);
  });

  // 4. Admin with specific customGrants is allowed
  await t.test('admin with specific customGrants is allowed', () => {
    nextCalled = false;
    middleware({ user: { role: 'ADMIN', customGrants: ['users:create', 'events:read'] } }, res, next);
    assert.equal(nextCalled, true);
  });
  
  // 5. Admin with specific customGrants but missing the required one is denied
  await t.test('admin missing required permission is denied', () => {
    nextCalled = false;
    status = null;
    middleware({ user: { role: 'ADMIN', customGrants: ['events:read'] } }, res, next);
    assert.equal(nextCalled, false);
    assert.equal(status, 403);
    assert.match(body.message, /Missing permission/);
  });
});
