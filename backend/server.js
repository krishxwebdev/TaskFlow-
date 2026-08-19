require('dotenv').config();
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
const express = require('express');
const cors = require('cors');
const initDb = require('./config/initDb');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todo');
const adminRoutes = require('./routes/admin');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/todo', todoRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('TaskFlow API is running ✅'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => console.log(`TaskFlow backend running on http://localhost:${PORT}`));
  });
}

module.exports = app;
