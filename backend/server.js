require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todo');

const app = express();

// --- CORS: allow both local dev and the deployed Vercel frontend ---
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,  // set this on Render to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // needed for cross-domain cookies
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/todo', todoRoutes);

app.get('/', (req, res) => res.send('TaskFlow API is running ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TaskFlow backend running on http://localhost:${PORT}`));
