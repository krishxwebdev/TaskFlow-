const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// POST /api/auth/register
// Creates a brand-new user. We NEVER store the raw password - bcrypt.hash()
// scrambles it one-way (a "hash"). Even if someone stole the database,
// they could not read the original passwords back out.
router.post('/register', async (req, res) => {
  const { username, employeeId, password } = req.body;

  if (!username || !employeeId || !password) {
    return res.status(400).json({ error: 'username, employeeId and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE employee_id = ?', [employeeId]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this Employee ID already exists. Please log in instead.' });
    }

    // 10 = "salt rounds" - how much computational work goes into the hash.
    // Higher = slower to crack, but also slower to compute. 10 is a solid default.
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, employee_id, password_hash) VALUES (?, ?, ?)',
      [username, employeeId, passwordHash]
    );

    req.session.userId = result.insertId;
    req.session.username = username;

    res.status(201).json({ message: 'Registered successfully', user: { id: result.insertId, username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
// Looks up the user by employee_id, then uses bcrypt.compare() to check
// the submitted password against the stored hash. compare() re-hashes the
// input with the same salt and checks if it matches - it never "un-hashes" anything.
router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: 'employeeId and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE employee_id = ?', [employeeId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'No account found with that Employee ID. Please register first.' });
    }

    const user = rows[0];
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

// GET /api/auth/me - "am I already logged in?" (checked on page refresh)
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
