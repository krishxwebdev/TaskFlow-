const pool = require('../config/db');

// Roles are loaded from PostgreSQL on every request. This makes role revocation
// effective immediately and avoids treating a client-controlled UI flag as auth.
async function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    req.admin = user;
    next();
  } catch (err) {
    console.error('Admin authorization failed:', err);
    res.status(500).json({ error: 'Unable to verify administrator access' });
  }
}

module.exports = requireAdmin;
