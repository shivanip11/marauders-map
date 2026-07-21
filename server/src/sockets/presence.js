import { pool } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const HEARTBEAT_INTERVAL_MS = 10000;   // client pings every 10s
const OFFLINE_GRACE_MS = 25000;         // wait 25s of silence before declaring offline

export function registerPresenceHandlers(io, socket) {
  const sessionId = socket.handshake.auth.sessionId;

  markOnline(socket.userId, sessionId, socket.id);

  socket.on('heartbeat', () => {
    redisClient.set(`presence:${sessionId}`, Date.now(), { EX: 30 });
  });

  socket.on('disconnect', async () => {
    // Don't remove immediately — start a grace timer.
    // If the user reconnects with a new socket before the grace period ends,
    // this timer's eventual "still offline?" check will find them online again and no-op.
    setTimeout(async () => {
      const lastBeat = await redisClient.get(`presence:${sessionId}`);
      const isStale = !lastBeat || Date.now() - Number(lastBeat) > OFFLINE_GRACE_MS;
      if (isStale) {
        await markOffline(sessionId);
        io.emit('user:offline', { sessionId });
      }
    }, OFFLINE_GRACE_MS);
  });
}

async function markOnline(userId, sessionId, socketId) {
  await pool.query(
    `UPDATE sessions SET socket_id = $1, last_seen_at = now() WHERE id = $2`,
    [socketId, sessionId]
  );
  await redisClient.set(`presence:${sessionId}`, Date.now(), { EX: 30 });
}

async function markOffline(sessionId) {
  await pool.query(`UPDATE sessions SET socket_id = NULL WHERE id = $1`, [sessionId]);
  await redisClient.del(`presence:${sessionId}`);
}