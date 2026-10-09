const test = require('node:test');
const assert = require('node:assert/strict');

const superAdminRoutes = require('../modules/super-admin/superAdmin.routes');
const User = require('../modules/admin/admin.model');

// Find route handlers directly from the express router stack
function findHandler(router, method, path) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]) {
      const handlers = layer.route.stack;
      return handlers[handlers.length - 1].handle;
    }
  }
  throw new Error(`Route ${method} ${path} not found`);
}

test('Super Admin routes parity port', async (t) => {
  const getSessions = findHandler(superAdminRoutes, 'get', '/sessions');
  const deleteSession = findHandler(superAdminRoutes, 'delete', '/sessions/:id');

  await t.test('GET /sessions returns active sessions', async () => {
    const origFind = User.find;
    User.find = () => ({
      select: () => ({
        sort: async () => [{ name: 'Test', activeSessionId: 'sess123' }]
      })
    });

    let resBody = null;
    const req = {};
    const res = { json: (body) => { resBody = body; } };
    
    await getSessions(req, res);
    assert.equal(resBody.success, true);
    assert.equal(resBody.data[0].activeSessionId, 'sess123');

    User.find = origFind;
  });

  await t.test('DELETE /sessions/:id terminates session', async () => {
    const origUpdate = User.findByIdAndUpdate;
    const AuditLog = require('../models/AuditLog.model');
    const origCreate = AuditLog.create;

    User.findByIdAndUpdate = () => ({
      select: async () => ({ name: 'Test', activeSessionId: null, email: 'test@example.com', role: 'ADMIN', _id: 'user_id' })
    });

    let createdAuditLog = null;
    AuditLog.create = async (data) => {
      createdAuditLog = data;
    };

    let resBody = null;
    let resStatus = null;
    const req = {
      params: { id: 'user_id' },
      user: { id: 'super_admin_id', name: 'Super Admin' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: (body) => { resBody = body; }
    };

    await deleteSession(req, res);
    assert.equal(resBody.success, true);
    assert.equal(resBody.data.activeSessionId, null);
    assert.equal(createdAuditLog.action, 'TERMINATE_SESSION');

    User.findByIdAndUpdate = origUpdate;
    AuditLog.create = origCreate;
  });
});
