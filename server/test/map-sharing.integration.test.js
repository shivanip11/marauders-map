import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import express from 'express';
import { createAdapter } from '@socket.io/redis-adapter';

// This is an integration test of both packages; install client and server dependencies.
const { io: connect } = createRequire(new URL('../../client/package.json', import.meta.url))('socket.io-client');
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });

test('authenticated users exchange only permitted locations', { timeout: 65000 }, async (t) => {
  const schema = 'map_test_' + randomUUID().replaceAll('-', '');
  const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  let io, pool, redis;
  const sockets = [];
  const sessions = [];
  const password = randomUUID();
  try {
    // Temporary tables and a separate Redis channel keep tests off the live map.
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.query(`SET search_path TO "${schema}", public`);
    await admin.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
    const databaseUrl = new URL(process.env.DATABASE_URL);
    databaseUrl.searchParams.set('options', `-c search_path=${schema},public`);
    process.env.DATABASE_URL = databaseUrl.href;
    ({ pool } = await import('../src/config/db.js'));
    redis = await import('../src/config/redis.js');
    const { initSocket } = await import('../src/sockets/index.js');
    const { default: authRoutes } = await import('../src/routes/auth.routes.js');
    const { default: userRoutes } = await import('../src/routes/user.routes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    const server = createServer(app);
    io = initSocket(server);
    io.adapter(createAdapter(redis.redisPubClient, redis.redisSubClient, { key: schema }));
    app.set('io', io);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    async function request(path, body, user, method = 'POST') {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(5000),
      });
      return { status: response.status, data: await response.json() };
    }
    async function signup(name) {
      const response = await request('/api/auth/signup', { username: name, displayName: name, password });
      assert.equal(response.status, 201);
      assert.ok(response.data.sessionId);
      sessions.push(response.data.sessionId);
      return response.data;
    }
    function once(socket, event, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { socket.off(event, receive); reject(new Error(`Missing ${event}`)); }, timeout);
        function receive(value) { clearTimeout(timer); resolve(value); }
        socket.once(event, receive);
      });
    }
    async function open(user, sessionId = user.sessionId) {
      const socket = connect(base, { auth: { token: user.token, sessionId }, reconnection: false, autoConnect: false });
      sockets.push(socket);
      const ready = new Promise((resolve, reject) => {
        socket.once('connect', () => resolve(socket));
        socket.once('connect_error', reject);
      });
      socket.connect();
      return ready;
    }
    function update(socket, sequenceNumber, extra = {}) {
      return socket.timeout(5000).emitWithAck('location:update', {
        lat: 51.5, lng: -0.12, sequenceNumber, recordedAt: new Date().toISOString(), ...extra,
      });
    }
    async function snapshot(socket) {
      const result = once(socket, 'map:snapshot');
      socket.emit('map:subscribe');
      return result;
    }
    async function permission(user, sharingEnabled, visibleTo = 'everyone') {
      const response = await request('/api/users/me/permissions', { sharingEnabled, visibleTo }, user, 'PATCH');
      assert.equal(response.status, 200);
    }

    const alice = await signup('Alice');
    const bob = await signup('Bob');
    const outsider = await signup('Outsider');
    const a = await open(alice);
    const b = await open(bob);
    const c = await open(outsider);

    await t.test('login returns a new session and cross-user session spoofing is rejected', async () => {
      const login = await request('/api/auth/login', { username: 'Alice', password });
      assert.equal(login.status, 200);
      assert.notEqual(login.data.sessionId, alice.sessionId);
      sessions.push(login.data.sessionId);
      await assert.rejects(open(alice, bob.sessionId), /sign in again/);
    });
    await t.test('private locations are not saved or exposed', async () => {
      assert.equal((await update(a, 1)).shared, false);
      assert.deepEqual(await snapshot(b), []);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM locations')).rows[0].count, 0);
    });
    await t.test('two opted-in users receive named live locations and snapshots', async () => {
      await permission(alice, true);
      await permission(bob, true);
      const receivedByBob = once(b, 'location:broadcast');
      assert.equal((await update(a, 2)).shared, true);
      assert.equal((await receivedByBob).name, 'Alice');
      const receivedByAlice = once(a, 'location:broadcast');
      assert.equal((await update(b, 1)).shared, true);
      assert.equal((await receivedByAlice).userId, bob.user.id);
      assert.deepEqual((await snapshot(b)).map((p) => p.userId), [alice.user.id]);
    });
    await t.test('invalid, spoofed, and out-of-order updates do not overwrite a position', async () => {
      assert.equal((await update(a, 3, { lat: 200 })).ok, false);
      assert.equal((await update(a, 3, { sessionId: bob.sessionId })).ok, false);
      assert.equal((await update(a, 1, { lat: 1 })).shared, false);
      const saved = await snapshot(b);
      assert.equal(saved[0].lat, 51.5);
    });
    await t.test('friends-only locations exclude unapproved viewers', async () => {
      await pool.query("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'accepted')", [bob.user.id, alice.user.id]);
      await permission(alice, true, 'friends');
      const received = once(b, 'location:broadcast');
      await update(a, 3);
      assert.equal((await received).name, 'Alice');
      assert.ok((await snapshot(b)).some((p) => p.userId === alice.user.id));
      assert.ok(!(await snapshot(c)).some((p) => p.userId === alice.user.id));
    });
    await t.test('stopping sharing removes the marker and prevents later disclosure', async () => {
      const removed = once(b, 'location:removed');
      await permission(alice, false);
      assert.equal((await removed).userId, alice.user.id);
      assert.equal((await update(a, 4)).shared, false);
      assert.ok(!(await snapshot(b)).some((p) => p.userId === alice.user.id));
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM locations WHERE user_id = $1', [alice.user.id])).rows[0].count, 0);
    });
    await t.test('a reconnecting viewer gets stationary users without a fresh GPS update', async () => {
      b.disconnect();
      const reconnected = await open(bob);
      await permission(alice, true);
      await update(a, 5);
      reconnected.disconnect();
      const again = await open(bob);
      assert.ok((await snapshot(again)).some((p) => p.userId === alice.user.id));
      // The disconnect grace check from the old socket must not remove the new one.
      const beats = setInterval(() => { a.emit('heartbeat'); again.emit('heartbeat'); c.emit('heartbeat'); }, 5000);
      try {
        await new Promise((resolve) => setTimeout(resolve, 26000));
        const session = await pool.query('SELECT socket_id FROM sessions WHERE id = $1', [bob.sessionId]);
        assert.equal(session.rows[0].socket_id, again.id);
      } finally { clearInterval(beats); }
    });
  } finally {
    sockets.forEach((socket) => socket.disconnect());
    if (io) await new Promise((resolve) => io.close(resolve));
    if (pool) await pool.end();
    if (redis) {
      if (sessions.length) await redis.redisClient.del(sessions.map((id) => `presence:${id}`));
      await Promise.all([redis.redisClient.close(), redis.redisPubClient.close(), redis.redisSubClient.close()]);
    }
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
