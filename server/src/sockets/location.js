import { pool } from '../config/db.js';

async function sendSnapshot(socket) {
  const result = await pool.query(
    `SELECT DISTINCT ON (l.user_id) l.user_id AS "userId", l.session_id AS "sessionId",
       ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lng,
       u.display_name AS name, l.sequence_number AS "sequenceNumber", l.recorded_at AS "recordedAt"
     FROM locations l
     JOIN users u ON u.id = l.user_id
     JOIN sessions s ON s.id = l.session_id
     JOIN location_permissions p ON p.user_id = l.user_id
     WHERE l.user_id <> $1 AND p.sharing_enabled
       AND s.socket_id IS NOT NULL AND s.last_seen_at > now() - interval '30 seconds'
       AND (p.visible_to = 'everyone' OR (p.visible_to = 'friends' AND EXISTS (
         SELECT 1 FROM friendships f WHERE f.status = 'accepted'
           AND ((f.user_id = l.user_id AND f.friend_id = $1)
             OR (f.friend_id = l.user_id AND f.user_id = $1))
       )))
     ORDER BY l.user_id, l.received_at DESC`,
    [socket.data.userId]
  );
  socket.emit('map:snapshot', result.rows);
}

export function registerLocationHandlers(io, socket) {
  socket.on('map:subscribe', async () => {
    try {
      await sendSnapshot(socket);
    } catch (err) {
      console.error('Map subscription failed:', err.code || err.message);
      socket.emit('map:error', { error: 'Could not load other map users. Please reconnect.' });
    }
  });

  socket.on('location:update', async (payload, acknowledge) => {
    const reply = (value) => { if (typeof acknowledge === 'function') acknowledge(value); };
    const { userId, sessionId } = socket.data;
    const { lat, lng, sequenceNumber, recordedAt } = payload || {};
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180
      || !Number.isSafeInteger(sequenceNumber) || sequenceNumber < 0
      || typeof recordedAt !== 'string' || !Number.isFinite(Date.parse(recordedAt))
      || (payload.sessionId !== undefined && payload.sessionId !== sessionId)) {
      return reply({ ok: false, error: 'Invalid location update' });
    }
    try {
      // Bind writes to the authenticated session and its sharing permission.
      // Reject late/out-of-order updates atomically in the database.
      const result = await pool.query(
      `INSERT INTO locations (session_id, user_id, lat, lng, sequence_number, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id) DO UPDATE
         SET lat = EXCLUDED.lat,
             lng = EXCLUDED.lng,
             sequence_number = EXCLUDED.sequence_number,
             recorded_at = EXCLUDED.recorded_at,
             received_at = now()
       WHERE locations.sequence_number < EXCLUDED.sequence_number`,
      [sessionId, socket.userId, lat, lng, sequenceNumber, recordedAt]
    );
      if (!result.rowCount) return reply({ ok: true, shared: false });

      const permission = await pool.query(
        `SELECT p.visible_to, u.display_name FROM location_permissions p JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1 AND p.sharing_enabled`, [userId]
      );
      const settings = permission.rows[0];
      if (!settings || settings.visible_to === 'nobody') return reply({ ok: true, shared: false });
      const location = { userId, sessionId, lat, lng, name: settings.display_name, sequenceNumber, recordedAt };
      if (settings.visible_to === 'everyone') {
        io.to('map:viewers').except(`user:${userId}`).emit('location:broadcast', location);
      } else {
        const friends = await pool.query(
          `SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END AS id
           FROM friendships WHERE status = 'accepted' AND (user_id = $1 OR friend_id = $1)`, [userId]
        );
        const rooms = friends.rows.map(({ id }) => `user:${id}`);
        if (rooms.length) io.to(rooms).emit('location:broadcast', location);
      }
      reply({ ok: true, shared: true });
    } catch (err) {
      console.error('Location update failed:', err.code || err.message);
      reply({ ok: false, error: 'Could not share your location. Please try again.' });
    }
  });
}
