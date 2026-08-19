const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, employeeId, password } = req.body;

  if (!username || !employeeId || !password) {
    return res.status(400).json({ error: 'username, employeeId and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if employee ID already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE employee_id = $1',
      [employeeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this Employee ID already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // PostgreSQL: RETURNING gives us back the inserted row's id
    const result = await pool.query(
      'INSERT INTO users (username, employee_id, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, employeeId, passwordHash]
    );

    const newId = result.rows[0].id;
    req.session.userId = newId;
    req.session.username = username;

    res.status(201).json({ message: 'Registered successfully', user: { id: newId, username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: 'employeeId and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE employee_id = $1',
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with that Employee ID. Please register first.' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me - session check on page refresh
router.get('/me', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username } });
  } else {
    res.json({ loggedIn: false });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
