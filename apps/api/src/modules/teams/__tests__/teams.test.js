const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const express = require('express');
const mongoose = require('mongoose');
const Team = require('../teams.model');
const User = require('../../admin/admin.model');
const { ROLES } = require('../../../../../../packages/shared-constants/roles.js');

const id = (digit) => new mongoose.Types.ObjectId(digit.repeat(24));
const metadataKeys = ['_id', 'name', 'eventId', 'eventTitle', 'description', 'memberCount', 'chatActive', 'createdAt'];

// Exercise real routing, authentication, service code and Mongoose population.
// Only database collection operations are replaced with synthetic fixtures.
test('team reads protect contact rosters', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'teams-test-secret-not-for-production';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const tokens = require('../../auth/auth.tokens');
  const requester = {
    _id: id('1'), name: 'Requester', email: 'requester@example.test',
    role: ROLES.T1_VOLUNTEER, isActive: true, password: 'fixture-hash',
  };
  const lead = { ...requester, _id: id('2'), name: 'Lead', email: 'lead@example.test' };
  const member = { ...requester, _id: id('3'), name: 'Member', email: 'member@example.test' };
  const users = [requester, lead, member];
  const team = {
    _id: id('a'), name: 'Discoverable team', eventId: id('c'), eventTitle: 'Event',
    description: 'Team description', leadId: lead._id, leadName: lead.name,
    members: [member._id], memberCount: 1, chatActive: true,
    chatRoomId: 'private-team-room', createdAt: new Date('2026-10-01T00:00:00Z'),
  };
  const ownTeam = { ...team, _id: id('b'), name: 'Own team', members: [requester._id] };
  const teams = [team, ownTeam];
  const contactQueries = [];
  const project = (doc, projection) => {
    if (!projection || !Object.values(projection).some(value => value === 1)) return { ...doc };
    return Object.fromEntries(Object.entries(doc).filter(([key]) => key === '_id' || projection[key] === 1));
  };
  t.mock.method(User.collection, 'findOne', async (query) =>
    users.find(user => user._id.equals(query._id)) || null);
  t.mock.method(User.collection, 'find', (query, options) => {
    contactQueries.push(query);
    return { toArray: async () => users.filter(user =>
      query._id.$in.some(userId => user._id.equals(userId)) &&
      (query.isActive === undefined || user.isActive === query.isActive)
    ).map(user => project(user, options.projection)) };
  });
  t.mock.method(Team.collection, 'findOne', async (query, options) => {
    const found = teams.find(item => item._id.equals(query._id));
    return found ? project(found, options.projection) : null;
  });
  t.mock.method(Team.collection, 'find', (query, options) => ({
    toArray: async () => teams.filter(item => !query.$or || query.$or.some(condition =>
      condition.leadId ? item.leadId?.equals(condition.leadId) :
        item.members.some(memberId => memberId.equals(condition.members))
    )).map(item => project(item, options.projection)),
  }));

  const app = express();
  app.use('/api/v1/teams', require('../teams.routes'));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/v1/teams`;
  const request = async (path = '', token = tokens.sign(requester, 'access', '5m', { isMfaVerified: true })) => {
    const response = await fetch(`${url}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: response.status, body: await response.json() };
  };
  const assertMetadata = (data) => {
    assert.deepEqual(Object.keys(data).sort(), [...metadataKeys].sort());
    assert.equal(data.name, team.name);
    assert.equal(data.eventId, String(team.eventId));
    assert.equal(data.memberCount, 1);
  };
  const assertRoster = (data) => {
    assert.equal(data.leadId.email, lead.email);
    assert.equal(data.members[0].email, member.email);
    assert.deepEqual(Object.keys(data.members[0]).sort(), ['_id', 'email', 'name', 'role']);
  };

  await t.test('outsiders of every ordinary role get metadata from list and detail', async () => {
    for (const role of [ROLES.T1_VOLUNTEER, ROLES.T2_ASSOCIATE, ROLES.T3_EXECUTIVE]) {
      requester.role = role;
      assertMetadata((await request()).body.data.find(item => item._id === String(team._id)));
      contactQueries.length = 0;
      const detail = await request(`/${team._id}`);
      assert.equal(detail.status, 200);
      assertMetadata(detail.body.data);
      assert.equal(contactQueries.length, 0, 'outsider detail must not query contacts');
    }
  });
  await t.test('mixed listing populates only teams the requester belongs to', async () => {
    contactQueries.length = 0;
    const { body } = await request();
    assertMetadata(body.data[0]);
    assert.equal(body.data[1].members[0].email, requester.email);
    assert.ok(contactQueries.length > 0);
    assert.ok(contactQueries.every(query => !query._id.$in.some(value => value.equals(member._id))));
  });
  await t.test('current members and leads get rosters in list and detail', async () => {
    for (const relation of ['member', 'lead']) {
      if (relation === 'member') team.members.push(requester._id);
      else team.leadId = requester._id;
      try {
        for (const path of ['', `/${team._id}`]) {
          const { body } = await request(path);
          const data = path ? body.data : body.data[0];
          assert.equal(data.members[0].email, member.email);
          assert.equal(data.leadId.email, relation === 'lead' ? requester.email : lead.email);
        }
      } finally {
        team.members = [member._id];
        team.leadId = lead._id;
      }
    }
    // Subsequent requests must re-evaluate membership, including the cached lead name.
    assertMetadata((await request(`/${team._id}`)).body.data);
    assertMetadata((await request()).body.data[0]);
  });
  await t.test('both administrator roles retain roster access', async () => {
    for (const role of [ROLES.ADMIN, ROLES.SUPER_ADMIN]) {
      requester.role = role;
      assertRoster((await request()).body.data[0]);
      assertRoster((await request(`/${team._id}`)).body.data);
    }
    requester.role = ROLES.T1_VOLUNTEER;
  });
  await t.test('empty teams and missing teams are handled safely', async () => {
    team.leadId = null;
    team.members = [];
    try {
      assertMetadata((await request(`/${team._id}`)).body.data);
    } finally {
      team.leadId = lead._id;
      team.members = [member._id];
    }
    assert.equal((await request(`/${id('f')}`)).status, 404);
    assert.equal((await request('/invalid-id')).status, 404);
  });
  await t.test('existing own-team and member endpoint controls remain enforced', async () => {
    const mine = await request('/me');
    assert.equal(mine.body.data.length, 1);
    assert.equal(mine.body.data[0].members[0].email, requester.email);
    assert.equal((await request(`/${team._id}/members`)).status, 400);
    const ownMembers = await request(`/${ownTeam._id}/members`);
    assert.equal(ownMembers.status, 200);
    assert.equal(ownMembers.body.data[0].email, lead.email);
  });
  await t.test('missing tokens and inactive accounts are rejected', async () => {
    for (const path of ['', `/${team._id}`]) {
      assert.equal((await request(path, null)).status, 401);
      requester.isActive = false;
      try {
        assert.equal((await request(path)).status, 401);
      } finally {
        requester.isActive = true;
      }
    }
  });
});
