const jwt = require('jsonwebtoken');
const User = require('../../models/user');

// Verify JWT and load req.user
exports.verifyToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      console.warn('[verifyToken] No token in request');
      return res.status(401).json({ message: 'No token' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_fallback_secret');
    } catch (e) {
      console.warn('[verifyToken] Invalid token:', e.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    const user = await User.findById(payload.id).select('_id email role name empId');
    if (!user) {
      console.warn('[verifyToken] No user found for token payload:', payload);
      return res.status(401).json({ message: 'Invalid token user' });
    }

    req.user = user;
    console.log('[verifyToken] Authenticated user:', user.email, 'role:', user.role);
    next();
  } catch (e) {
    console.warn('[verifyToken] Unexpected error:', e.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Require a specific role
exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};

// Add this helper without touching existing exports
exports.requireAnyRole = (roles = []) => (req, res, next) => {
  try {
    if (!req.user) {
      console.warn('[requireAnyRole] No req.user');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!roles.includes(req.user.role)) {
      console.warn('[requireAnyRole] User role not allowed:', req.user.role, 'allowed:', roles);
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.log('[requireAnyRole] User authorized:', req.user.email, 'role:', req.user.role);
    next();
  } catch (e) {
    console.warn('[requireAnyRole] Unexpected error:', e.message);
    return res.status(403).json({ message: 'Forbidden' });
  }
};
