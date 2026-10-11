import { pool } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const OFFLINE_GRACE_MS = 25000;

export async function markOnline(socket) {
  const { userId, sessionId } = socket.data;
  const result = await pool.query(
    `UPDATE sessions SET socket_id = $1, last_seen_at = now()
     WHERE id = $2 AND user_id = $3 RETURNING id`,
    [socket.id, sessionId, userId]
  );
  if (!result.rowCount) throw new Error('Session not found. Sign in again.');
  await redisClient.set(`presence:${sessionId}`, String(Date.now()), { EX: 30 });
}

export function registerPresenceHandlers(io, socket) {
  const { sessionId, userId } = socket.data;
  socket.on('heartbeat', async () => {
    try {
      await pool.query(
        'UPDATE sessions SET last_seen_at = now() WHERE id = $1 AND socket_id = $2',
        [sessionId, socket.id]
      );
      await redisClient.set(`presence:${sessionId}`, String(Date.now()), { EX: 30 });
    } catch (err) {
      console.error('Heartbeat failed:', err.code || err.message);
    }
  });

  socket.on('disconnect', () => {
    const timer = setTimeout(async () => {
      try {
        // A reconnected session has a different socket id and must stay online.
        const result = await pool.query(
          'UPDATE sessions SET socket_id = NULL WHERE id = $1 AND socket_id = $2 RETURNING id',
          [sessionId, socket.id]
        );
        if (!result.rowCount) return;
        await redisClient.del(`presence:${sessionId}`);
        const active = await pool.query(
          `SELECT id FROM sessions WHERE user_id = $1 AND socket_id IS NOT NULL
           AND last_seen_at > now() - interval '30 seconds' LIMIT 1`,
          [userId]
        );
        if (!active.rowCount) io.emit('user:offline', { userId });
        else io.emit('map:refresh');
      } catch (err) {
        console.error('Offline cleanup failed:', err.code || err.message);
      }
    }, OFFLINE_GRACE_MS);
    timer.unref();
  });
}
