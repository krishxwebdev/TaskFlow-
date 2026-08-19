// JWT-based auth middleware — replaces express-session.
// The frontend sends a token in the Authorization header with every request.
// We verify it and attach the user info to req.user.
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    req.user = decoded; // { id, username }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

module.exports = requireAuth;
