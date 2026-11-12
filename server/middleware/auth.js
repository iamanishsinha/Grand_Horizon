const { db } = require('../database/db');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = db.prepare(`
      SELECT id, username, role, full_name, created_at 
      FROM Users 
      WHERE session_token = ?
    `).get(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

module.exports = { authenticate };
