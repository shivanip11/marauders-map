// server/src/sockets/location.js
import { pool } from '../config/db.js';
import { redisClient } from '../config/redis.js';

export function registerLocationHandlers(io, socket) {
  socket.on('location:update', async (payload) => {
    const { sessionId, lat, lng, sequenceNumber, recordedAt } = payload;

    const lastSeq = await redisClient.get(`seq:${sessionId}`);
    if (lastSeq !== null && sequenceNumber <= Number(lastSeq)) {
      // Stale/out-of-order update — discard it, do not broadcast, do not persist
      return;
    }
    await redisClient.set(`seq:${sessionId}`, sequenceNumber);

    await pool.query(
      `INSERT INTO locations (session_id, user_id, geom, sequence_number, recorded_at)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)
       ON CONFLICT (session_id) DO UPDATE
         SET geom = EXCLUDED.geom,
             sequence_number = EXCLUDED.sequence_number,
             recorded_at = EXCLUDED.recorded_at,
             received_at = now()
       WHERE locations.sequence_number < EXCLUDED.sequence_number`,
      [sessionId, socket.userId, lng, lat, sequenceNumber, recordedAt]
    );

    socket.on('map:subscribe', async ({ targetUserIds }) => {
  const allowed = await filterByPermission(socket.userId, targetUserIds);
  allowed.forEach((id) => socket.join(`viewers:${id}`));
});
  });
}