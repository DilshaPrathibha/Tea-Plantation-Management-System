const jwt = require('jsonwebtoken');
const User = require('../../models/user'); 


// Verify JWT and load req.user
exports.verifyToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_fallback_secret');
    const user = await User.findById(payload.id).select('_id email role name');
    if (!user) return res.status(401).json({ message: 'Invalid token user' });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Require a specific role
exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};




