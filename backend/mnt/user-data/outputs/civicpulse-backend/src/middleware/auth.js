import jwt from 'jsonwebtoken';

// Verifies the JWT sent in the Authorization header and attaches the
// decoded user info to req.user so routes downstream can use it.
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth — attaches user if token present, but doesn't block
// the request if it's missing (useful for routes like GET /issues
// where logged-out users can still view, but logged-in users get
// extra info like "did I already upvote this").
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ignore invalid token, treat as logged out
    }
  }
  next();
}
