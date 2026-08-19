// This middleware guards routes. It runs BEFORE the actual route handler.
// If there's no logged-in session, it stops the request right here (401).
// If there IS a session, it lets the request continue (next()).
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

module.exports = requireAuth;
