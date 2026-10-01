const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const { initSocket, emitToRoom, closeChatRoom } = require('../socket');
const chatService = require('../../modules/chat/chat.service');
const controller = require('../../modules/chat/chat.controller');
const ChatRoom = require('../../modules/chat/chatRoom.model');
const User = require('../../modules/admin/admin.model');
const Message = require('../../modules/chat/chat.model');

const roomId = 'abcdef0123456789abcdef01';
const memberId = '111111111111111111111111';
const otherId = '222222222222222222222222';
const secret = 'socket-authorization-test-secret-only';

test('chat socket authorization and delivery', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  const server = http.createServer();
  const io = initSocket(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => io.close(resolve));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const users = new Set([memberId, otherId]);
  let room = { members: [memberId], name: 'Private room', save: async () => {} };
  const userLookup = t.mock.method(User, 'exists', async (filter) => {
    assert.equal(filter.isActive, true);
    return users.has(filter._id) ? { _id: filter._id } : null;
  });
  const roomLookup = t.mock.method(ChatRoom, 'exists', async (filter) =>
    room && filter._id === roomId && room.members.includes(filter.members) ? { _id: roomId } : null);
  t.mock.method(ChatRoom, 'findById', async (id) => id === roomId ? room : null);
  t.mock.method(Message, 'create', async (data) => ({ ...data, _id: 'message-id' }));

  async function connect(userId, token = jwt.sign({ sub: userId }, secret)) {
    const client = new WebSocket(`ws://127.0.0.1:${server.address().port}/socket.io/?EIO=4&transport=websocket`);
    t.after(() => client.close());
    return await new Promise((resolve, reject) => {
      client.addEventListener('error', reject, { once: true });
      client.addEventListener('message', ({ data }) => {
        if (data.startsWith('0')) client.send(`40${JSON.stringify({ token, userId: memberId })}`);
        if (data.startsWith('40')) {
          const socket = io.sockets.sockets.get(JSON.parse(data.slice(2)).sid);
          const events = [];
          socket.onAnyOutgoing((...args) => events.push(args));
          resolve({ socket, events });
        }
        if (data.startsWith('44')) reject(new Error(JSON.parse(data.slice(2)).message));
        if (data === '2') client.send('3');
      });
    });
  }
  const member = await connect(memberId);
  const other = await connect(otherId);
  const join = (client, id = roomId) => client.socket.listeners('chat:join')[0](id);
  const leave = (client, id = roomId) => client.socket.listeners('chat:leave')[0](id);
  const subscribed = (client) => client.socket.rooms.has(`chat:${roomId}`);

  await t.test('requires a valid JWT and uses its subject, not the handshake userId', async () => {
    await assert.rejects(connect(otherId, 'invalid-token'), /Invalid or expired token/);
    assert.equal(other.socket.userId, otherId);
  });

  await t.test('rejects a nonmember whom HTTP reads also reject', async () => {
    await assert.rejects(chatService.getMessages(roomId, otherId), /not a member/);
    await join(other);
    assert.equal(subscribed(other), false);
  });

  await t.test('rejects malformed, missing and nonexistent room IDs', async () => {
    const queries = roomLookup.mock.callCount();
    for (const id of [undefined, null, {}, { $ne: null }, '', 'chat:' + roomId, 'user:' + memberId, 'invalid']) {
      await other.socket.listeners('chat:join')[0](id);
    }
    assert.equal(roomLookup.mock.callCount(), queries);
    await join(other, '333333333333333333333333');
    assert.equal(subscribed(other), false);
  });

  await t.test('delivers HTTP-created messages only to active members, across multiple sockets', async () => {
    const second = await connect(memberId);
    await join(member, roomId.toUpperCase());
    await join(second);
    assert.equal(subscribed(member), true);
    let status;
    let response;
    await controller.sendMessage({ params: { id: roomId }, body: { text: 'Private message' }, user: { sub: memberId } }, {
      status(code) { status = code; return this; },
      json(data) { response = data; },
    });
    assert.equal(status, 201);
    assert.equal(response.success, true);
    assert.equal(member.events.at(-1)[1].text, 'Private message');
    assert.equal(second.events.at(-1)[1].text, 'Private message');
    assert.deepEqual(other.events, []);
    leave(second);
  });

  await t.test('removes stale memberships before subsequent private delivery', async () => {
    room.members = [];
    const count = member.events.length;
    await emitToRoom(`chat:${roomId}`, 'chat:new_message', { text: 'After removal' });
    assert.equal(member.events.length, count);
    assert.equal(subscribed(member), false);
    await join(member);
    assert.equal(subscribed(member), false);
    room.members = [memberId];
  });

  await t.test('denies inactive/deleted accounts both on join and after subscription', async () => {
    await join(member);
    users.delete(memberId);
    const count = member.events.length;
    await emitToRoom(roomId, 'chat:message_deleted', { messageId: 'private-id' });
    assert.equal(member.events.length, count);
    assert.equal(subscribed(member), false);
    await join(member);
    assert.equal(subscribed(member), false);
    users.add(memberId);
  });

  await t.test('fails closed on database errors for joins and delivery', async () => {
    await join(member);
    userLookup.mock.mockImplementationOnce(async () => { throw new Error('database unavailable'); });
    const count = member.events.length;
    await emitToRoom(roomId, 'chat:new_message', { text: 'Must not leak' });
    assert.equal(member.events.length, count);
    assert.equal(subscribed(member), false);
    roomLookup.mock.mockImplementationOnce(async () => { throw new Error('database unavailable'); });
    await join(member);
    assert.equal(subscribed(member), false);
  });

  await t.test('leaving while authorization is pending cancels the join', async () => {
    let finish;
    roomLookup.mock.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const pending = join(member);
    await new Promise(setImmediate);
    leave(member);
    finish({ _id: roomId });
    await pending;
    assert.equal(subscribed(member), false);
  });

  await t.test('ordinary leave stops delivery', async () => {
    await join(member);
    leave(member);
    const count = member.events.length;
    await emitToRoom(roomId, 'chat:new_message', { text: 'After leave' });
    assert.equal(member.events.length, count);
  });

  await t.test('room deletion sends only its ID and clears subscriptions', async () => {
    await join(member);
    room = null;
    closeChatRoom(roomId);
    assert.deepEqual(member.events.at(-1), ['chat:room_deleted', { roomId }]);
    assert.equal(subscribed(member), false);
    const count = member.events.length;
    await emitToRoom(roomId, 'chat:new_message', { text: 'After deletion' });
    await join(member);
    assert.equal(subscribed(member), false);
    assert.equal(member.events.length, count);
  });
});
