const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../admin.model');
const emailService = require('../../../services/email.service');
const AuditLog = require('../../../models/AuditLog.model');

test('account provisioning authorization', async (t) => {
  const email = t.mock.method(emailService, 'sendWelcomeEmail', async () => ({ success: true }));
  const lookup = t.mock.method(User, 'findOne', async () => null);
  const create = t.mock.method(User, 'create', async (data) => ({
    ...data,
    toObject: () => ({ ...data }),
  }));
  const service = require('../admin.service');
  const data = { name: 'Test User', email: 'new@example.com' };
  const students = ['T1_VOLUNTEER', 'T2_ASSOCIATE', 'T3_EXECUTIVE'];

  await t.test('rejects unauthorized grants before lookup, persistence or email', async () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN']) {
      await assert.rejects(service.createUser({ ...data, role }, { role: 'ADMIN' }), { statusCode: 403 });
    }
    for (const requester of [undefined, {}, ...students.map((role) => ({ role })), { role: 'UNKNOWN' }]) {
      await assert.rejects(service.createUser(data, requester), { statusCode: 403 });
    }
    for (const role of ['UNKNOWN', 'toString', { $ne: null }]) {
      await assert.rejects(service.createUser({ ...data, role }, { role: 'SUPER_ADMIN' }), { statusCode: 403 });
    }
    assert.equal(lookup.mock.callCount(), 0);
    assert.equal(create.mock.callCount(), 0);
    assert.equal(email.mock.callCount(), 0);
  });

  await t.test('preserves permitted roles and the default volunteer role', async () => {
    for (const requesterRole of ['ADMIN', 'SUPER_ADMIN']) {
      const roles = requesterRole === 'ADMIN' ? students : [...students, 'ADMIN', 'SUPER_ADMIN'];
      for (const role of [...roles, undefined]) {
        const result = await service.createUser({ ...data, role }, { role: requesterRole });
        assert.equal(result.user.role, role || 'T1_VOLUNTEER');
        assert.equal(result.user.isActive, true);
        assert.equal(result.user.mustChangePassword, true);
        assert.ok(result.tempPassword);
        assert.notEqual(result.user.password, result.tempPassword);
      }
    }
  });

  await t.test('HTTP route uses the current database role and returns 403 for escalation', async (t) => {
    const previousSecret = process.env.JWT_SECRET;
    const secret = 'provisioning-regression-test-secret-only';
    process.env.JWT_SECRET = secret;
    t.after(() => {
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    });
    t.mock.method(User, 'findById', (id) => ({
      select: async () => ({ isActive: true, role: id === 'super' ? 'SUPER_ADMIN' : 'ADMIN' }),
    }));
    t.mock.method(AuditLog, 'create', async () => ({}));
    const app = express();
    app.use(express.json());
    app.use('/api/v1/admin', require('../admin.routes'));
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())));
    await once(server, 'listening');

    const before = create.mock.callCount();
    // A previously privileged token must not override the requester's current DB role.
    const adminToken = jwt.sign({ sub: 'admin', role: 'SUPER_ADMIN' }, secret);
    for (const role of ['SUPER_ADMIN', 'ADMIN']) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ ...data, role }),
      });
      assert.equal(response.status, 403);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.tempPassword, undefined);
    }
    assert.equal(create.mock.callCount(), before);

    const superToken = jwt.sign({ sub: 'super', role: 'ADMIN' }, secret);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({ ...data, role: 'ADMIN' }),
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.role, 'ADMIN');
    assert.equal(create.mock.callCount(), before + 1);
  });
});
