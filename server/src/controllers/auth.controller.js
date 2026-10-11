import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function signup(req, res) {
  const { username, displayName, password } = req.body || {};
  if (![username, displayName, password].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Enter a username, display name, and secret phrase' });
  }
  let client;
  try {
    const hash = await bcrypt.hash(password, 12);
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, display_name`,
      [username.trim(), displayName.trim(), hash]
    );
    const user = result.rows[0];
    await client.query(
      `INSERT INTO location_permissions (user_id, sharing_enabled) VALUES ($1, false)`,
      [user.id]
    );
    const session = await client.query('INSERT INTO sessions (user_id) VALUES ($1) RETURNING id', [user.id]);
    const sessionId = session.rows[0].id;
    const token = jwt.sign({ userId: user.id, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await client.query('COMMIT');
    res.status(201).json({ token, sessionId, user });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    console.error('Signup failed:', err.code || err.message);
    res.status(500).json({ error: 'Signup failed' });
  } finally {
    client?.release();
  }
}

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (![username, password].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Enter your username and secret phrase' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const session = await pool.query('INSERT INTO sessions (user_id) VALUES ($1) RETURNING id', [user.id]);
    const sessionId = session.rows[0].id;
    const token = jwt.sign({ userId: user.id, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, sessionId, user: { id: user.id, username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error('Login failed:', err.code || err.message);
    res.status(500).json({ error: 'Sign in is temporarily unavailable. Please try again.' });
  }
}
