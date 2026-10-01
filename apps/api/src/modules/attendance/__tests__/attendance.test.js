const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const express = require('express');
const Attendance = require('../attendance.model');
const Team = require('../../teams/teams.model');
const User = require('../../admin/admin.model');
const service = require('../attendance.service');
const { ValidationError } = require('../../../core/errors/typedErrors');
const { ROLES } = require('../../../../../../packages/shared-constants/roles.js');

function mockHistory(t, records = []) {
  const team = t.mock.method(Team, 'findById', () => ({
    populate: async () => ({ name: 'Fixture team', members: [{}, {}] }),
  }));
  const attendance = t.mock.method(Attendance, 'find', async () => records);
  return { team, attendance };
}

test('history rejects invalid intervals before database access', async (t) => {
  const { team, attendance } = mockHistory(t);
  for (const days of [
    0, -1, 1.5, 31, 1000000, Number.MAX_SAFE_INTEGER, Infinity, NaN,
    '', '0', '-1', '1.5', '31', '1000000', '7junk', '1e6', '0x10', ' 7 ',
    'Infinity', '9'.repeat(400), null, true, [], ['7'], ['7', '30'], {}, { value: '7' },
  ]) {
    await assert.rejects(service.getTeamAttendanceHistory('team', days), ValidationError);
  }
  assert.equal(team.mock.callCount(), 0);
  assert.equal(attendance.mock.callCount(), 0);
});

test('history preserves the default, boundaries, empty days and aggregate results', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-01T12:00:00Z') });
  const { attendance } = mockHistory(t, [
    { date: '2026-10-01', status: 'present' },
    { date: '2026-10-01', status: 'late' },
    { date: '2026-09-30', status: 'absent' },
    { date: '2026-09-30', status: 'on_leave' },
  ]);
  for (const input of [undefined, 1, '7', 30, '30']) {
    const days = input === undefined ? 7 : Number(input);
    const result = await service.getTeamAttendanceHistory('team', input);
    assert.equal(result.days, days);
    assert.equal(result.history.length, days);
    assert.equal(result.overallPercentage, Math.round(100 / days));
    assert.equal(result.history.at(-1).date, '2026-10-01');
    assert.equal(result.history.at(-1).percentage, 100);
    assert.equal(result.history.at(-1).attended, 2);
    if (days > 1) {
      assert.equal(result.history.at(-2).absent, 1);
      assert.equal(result.history.at(-2).onLeave, 1);
      assert.equal(result.history[0].attended, 0);
    }
    const start = new Date('2026-10-01T12:00:00Z');
    start.setDate(start.getDate() - (days - 1));
    const startKey = start.toISOString().split('T')[0];
    assert.equal(result.history[0].date, startKey);
    assert.deepEqual(attendance.mock.calls.at(-1).arguments[0], {
      teamId: 'team', date: { $gte: startKey },
    });
  }
});

test('mounted history route validates raw query input and retains access controls', async (t) => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'attendance-test-secret-not-for-production';
  t.after(() => {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  });
  const tokens = require('../../auth/auth.tokens');
  const user = {
    _id: '111111111111111111111111', name: 'Fixture lead',
    email: 'lead@example.test', role: ROLES.T3_EXECUTIVE,
    isActive: true, password: 'fixture-password-hash',
  };
  t.mock.method(User, 'findById', () => ({ select: async () => user }));
  const { team, attendance } = mockHistory(t);
  const app = express();
  app.use('/api/v1/attendance', require('../attendance.routes'));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/attendance/team/history`;
  const token = tokens.sign(user, 'access', '5m');
  const request = (query, authenticated = true) => fetch(base + query, {
    headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
  });

  assert.equal((await request('?teamId=team', false)).status, 401);
  user.role = ROLES.T1_VOLUNTEER;
  assert.equal((await request('?teamId=team')).status, 403);
  user.role = ROLES.T3_EXECUTIVE;
  assert.equal((await request('?days=7')).status, 400);
  for (const query of [
    'days=', 'days=0', 'days=-1', 'days=1.5', 'days=31', 'days=1000000',
    'days=7junk', 'days=1e6', 'days=0x10', 'days=Infinity',
    'days=7&days=30', 'days[]=7', 'days[value]=7',
  ]) {
    const response = await request(`?teamId=team&${query}`);
    assert.equal(response.status, 400, query);
    assert.deepEqual(await response.json(), {
      success: false, message: 'days must be an integer between 1 and 30',
    });
  }
  assert.equal(team.mock.callCount(), 0);
  assert.equal(attendance.mock.callCount(), 0);

  for (const [query, days] of [['', 7], ['&days=1', 1], ['&days=7', 7], ['&days=30', 30]]) {
    const response = await request(`?teamId=team${query}`);
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.days, days);
    assert.equal(data.history.length, days);
    assert.equal(data.overallPercentage, 0);
    assert.ok(data.history.every(day => day.attended === 0));
  }
});
