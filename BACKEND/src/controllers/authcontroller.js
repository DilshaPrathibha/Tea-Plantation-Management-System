// BACKEND/src/controllers/authcontroller.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'dev_fallback_secret',
    { expiresIn: '1d' }
  );

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error('[LOGIN] error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
