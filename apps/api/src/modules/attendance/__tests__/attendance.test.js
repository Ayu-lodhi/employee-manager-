const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const express = require('express');
const mongoose = require('mongoose');
const Attendance = require('../attendance.model');
const Team = require('../../teams/teams.model');
const User = require('../../admin/admin.model');
const service = require('../attendance.service');
const { ROLES } = require('../../../../../../packages/shared-constants/roles.js');

const id = (digit) => new mongoose.Types.ObjectId(digit.repeat(24));
const teamId = id('a');
const otherTeamId = id('b');
const studentId = id('2');
const date = new Date().toISOString().split('T')[0];
const paths = ['/team', '/team/stats', '/team/history', '/download'];

// Use the real router, authentication, query parsing, Mongoose casting and
// population. Replace only database operations with synthetic fixtures.
test('team attendance reads enforce the current team relationship', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'attendance-access-test-secret-not-for-production';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const tokens = require('../../auth/auth.tokens');
  const user = {
    _id: id('1'), role: ROLES.T3_EXECUTIVE, isActive: true,
    name: 'Fixture executive', password: 'synthetic-password-hash',
  };
  t.mock.method(User, 'findById', (userId) => ({
    select: async () => String(userId) === String(user._id) ? user : null,
  }));
  const team = { _id: teamId, name: 'Fixture team', leadId: user._id, members: [studentId] };
  const otherTeam = { _id: otherTeamId, name: 'Other team', leadId: studentId, members: [studentId] };
  const teamLookup = t.mock.method(Team.collection, 'findOne', async ({ _id }) => {
    if (_id.equals(teamId)) return team;
    if (_id.equals(otherTeamId)) return otherTeam;
    return null;
  });
  const memberLookup = t.mock.method(User.collection, 'find', () => ({
    toArray: async () => [{ _id: studentId, name: 'Fixture student', email: 'student@example.test', role: ROLES.T1_VOLUNTEER }],
  }));
  const attendanceQueries = [];
  t.mock.method(Attendance.collection, 'find', (query) => {
    attendanceQueries.push(query);
    assert.ok(query.teamId instanceof mongoose.Types.ObjectId);
    return { toArray: async () => [{
      _id: id('3'), teamId: query.teamId, teamName: 'Fixture team', studentId,
      studentName: 'Fixture student', studentEmail: 'student@example.test', date,
      status: 'present', notes: 'Private fixture note', method: 'self',
      checkInTime: new Date(`${date}T08:00:00Z`), durationMinutes: 60,
    }] };
  });
  const app = express();
  app.use('/api/v1/attendance', require('../attendance.routes'));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/attendance`;
  const request = (path, query = `teamId=${teamId}`, token = tokens.sign(user, 'access', '5m', { isMfaVerified: true })) =>
    fetch(`${base}${path}?${query}&date=${date}&from=${date}&to=${date}&days=1`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  const denied = async (query, status = 403, token) => {
    const reads = attendanceQueries.length;
    const populations = memberLookup.mock.callCount();
    for (const path of paths) {
      const response = await request(path, query, token);
      assert.equal(response.status, status, path);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.data, undefined);
    }
    assert.equal(attendanceQueries.length, reads, 'no attendance read on denial');
    assert.equal(memberLookup.mock.callCount(), populations, 'no roster population on denial');
  };
  const allowed = async (selectedTeam = teamId) => {
    for (const path of paths) {
      const response = await request(path, `teamId=${String(selectedTeam).toUpperCase()}`);
      assert.equal(response.status, 200, path);
      const { data } = await response.json();
      assert.ok(attendanceQueries.at(-1).teamId.equals(selectedTeam));
      if (path === '/team') {
        assert.equal(data.roster[0].notes, 'Private fixture note');
        assert.equal(data.roster[0].checkInTime, `${date}T08:00:00.000Z`);
        assert.equal(attendanceQueries.at(-1).date, date);
      } else if (path === '/download') {
        assert.equal(data.recordCount, 1);
        assert.match(data.csv, /Private fixture note/);
        assert.deepEqual(attendanceQueries.at(-1).date, { $gte: date, $lte: date });
      } else if (path === '/team/stats') {
        assert.equal(data.present, 1);
      } else {
        assert.equal(data.history[0].present, 1);
      }
    }
  };

  await t.test('rejects an unrelated team even when the requester leads another team', async () => {
    await denied(`teamId=${otherTeamId}&sub=${studentId}&role=ADMIN`);
  });
  await t.test('allows a lead who is not in the members list', async () => allowed());
  await t.test('allows a T3 member who is not the lead', async () => {
    team.leadId = studentId;
    team.members.push(user._id);
    await allowed();
  });
  await t.test('checks current membership on each request, including teams without a lead', async () => {
    team.members = [studentId];
    team.leadId = null;
    await denied(`teamId=${teamId}`);
    team.leadId = user._id;
  });
  await t.test('preserves both administrator roles across unrelated teams', async () => {
    for (const role of [ROLES.ADMIN, ROLES.SUPER_ADMIN]) {
      user.role = role;
      await allowed(otherTeamId);
    }
    user.role = ROLES.T3_EXECUTIVE;
  });
  await t.test('rejects missing, malformed, repeated and operator team IDs before database access', async () => {
    const lookups = teamLookup.mock.callCount();
    for (const query of ['', 'teamId=', 'teamId=invalid', 'teamId=00000000000000000000000g',
      `teamId=${teamId}&teamId=${otherTeamId}`, `teamId[]=${teamId}`,
      `teamId[$in][]=${teamId}&teamId[$in][]=${otherTeamId}`, 'teamId[$ne]=null']) {
      await denied(query, 400);
    }
    assert.equal(teamLookup.mock.callCount(), lookups);
  });
  await t.test('rejects nonexistent teams without reading attendance', async () => {
    await denied(`teamId=${id('c')}`, 404);
  });
  await t.test('retains authentication, active account and role gates', async () => {
    await denied(`teamId=${teamId}`, 401, null);
    await denied(`teamId=${teamId}`, 401, tokens.sign(user, 'refresh', '5m'));
    user.isActive = false;
    await denied(`teamId=${teamId}`, 401);
    user.isActive = true;
    for (const role of [ROLES.T1_VOLUNTEER, ROLES.T2_ASSOCIATE]) {
      user.role = role;
      await denied(`teamId=${teamId}`);
    }
    user.role = ROLES.T3_EXECUTIVE;
  });
  await t.test('service calls fail closed without an authorized requester', async () => {
    const reads = attendanceQueries.length;
    for (const requester of [undefined, {}, { sub: String(user._id), role: ROLES.T2_ASSOCIATE }]) {
      for (const call of [
        () => service.getTeamAttendance(String(teamId), date, requester),
        () => service.getTeamAttendanceStats(String(teamId), date, requester),
        () => service.getTeamAttendanceHistory(String(teamId), 1, requester),
        () => service.getAttendanceSheet(String(teamId), date, date, requester),
      ]) await assert.rejects(call, { statusCode: 403 });
    }
    assert.equal(attendanceQueries.length, reads);
  });
});
