const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES = '7d'; // token valid for 7 days

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
    const existing = await pool.query(
      'SELECT id FROM users WHERE employee_id = $1', [employeeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this Employee ID already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, employee_id, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
      [username, employeeId, passwordHash]
    );

    const user = result.rows[0];
    // Sign a JWT — this token is sent to the frontend and stored in localStorage
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({ message: 'Registered successfully', token, user: { id: user.id, username: user.username } });
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
      'SELECT * FROM users WHERE employee_id = $1', [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with that Employee ID. Please register first.' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me - validate token on page refresh
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true, user: { id: decoded.id, username: decoded.username } });
  } catch {
    res.json({ loggedIn: false });
  }
});

// POST /api/auth/logout — with JWT, logout is handled on the frontend (just delete the token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
