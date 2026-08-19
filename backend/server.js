require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todo');

const app = express();

// --- Middleware (these run on EVERY request, in order) ---

// Allow the React app (running on a different port, e.g. 5173) to call this API
// and to send/receive cookies (needed for sessions).
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON bodies into req.body
app.use(express.json());

// Session management: on first request, creates a signed cookie in the browser.
// On every future request, that cookie is checked and req.session is restored.
// This is what keeps a user "logged in" across page loads.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set to true only when serving over HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// --- Routes ---
app.use('/api/auth', authRoutes);   // /api/auth/login, /api/auth/logout, /api/auth/me
app.use('/todo', todoRoutes);       // /todo, /todo/:id, /todo/:id/status

// Simple health check
app.get('/', (req, res) => res.send('TaskFlow API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TaskFlow backend running on http://localhost:${PORT}`));
