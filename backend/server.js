require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todo');
const initDb = require('./config/initDb');

const app = express();

// --- CORS: allow both local dev and the deployed Vercel frontend ---
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Store sessions in PostgreSQL instead of memory —
// this fixes the MemoryStore warning and survives server restarts.
app.use(session({
  store: new pgSession({
    pool,                     // reuse the existing db connection pool
    tableName: 'user_sessions',
    createTableIfMissing: true,  // auto-creates the sessions table
  }),
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/todo', todoRoutes);

app.get('/', (req, res) => res.send('TaskFlow API is running ✅'));

const PORT = process.env.PORT || 5000;

// Initialize DB tables first, then start the server
initDb().then(() => {
  app.listen(PORT, () => console.log(`TaskFlow backend running on http://localhost:${PORT}`));
});
