import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { pool } from '../config/db.js';
const router = Router();

router.patch('/me/permissions', requireAuth, async (req, res) => {
  const { sharingEnabled, visibleTo } = req.body;
  await pool.query(
    `UPDATE location_permissions SET sharing_enabled = $1, visible_to = $2, updated_at = now()
     WHERE user_id = $3`,
    [sharingEnabled, visibleTo, req.userId]
  );
  res.json({ ok: true });
});

export default router;