import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { pool } from '../config/db.js';
const router = Router();

router.get('/me/permissions', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT sharing_enabled AS "sharingEnabled", visible_to AS "visibleTo" FROM location_permissions WHERE user_id = $1',
    [req.userId]
  );
  res.json(result.rows[0] || { sharingEnabled: false, visibleTo: 'friends' });
});

router.patch('/me/permissions', requireAuth, async (req, res) => {
  const { sharingEnabled, visibleTo } = req.body || {};
  if (typeof sharingEnabled !== 'boolean' || !['everyone', 'friends', 'nobody'].includes(visibleTo)) {
    return res.status(400).json({ error: 'Choose a valid sharing setting' });
  }
  await pool.query(
    `UPDATE location_permissions SET sharing_enabled = $1, visible_to = $2, updated_at = now()
     WHERE user_id = $3`,
    [sharingEnabled, visibleTo, req.userId]
  );
  if (!sharingEnabled || visibleTo === 'nobody') {
    await pool.query('DELETE FROM locations WHERE user_id = $1', [req.userId]);
  }
  const io = req.app.get('io');
  io.emit('location:removed', { userId: req.userId });
  io.to(`user:${req.userId}`).emit('sharing:changed', { sharingEnabled, visibleTo });
  io.emit('map:refresh');
  res.json({ sharingEnabled, visibleTo });
});

export default router;
