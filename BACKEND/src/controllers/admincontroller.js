const User = require('../../models/User');

function generateTempPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, estate, department } = req.body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) return res.status(400).json({ message: 'email required' });
    if (!name) return res.status(400).json({ message: 'name required' });

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const tempPassword = password && password.trim().length >= 6 ? password : generateTempPassword();

    const user = new User({
      name,
      email: normalizedEmail,
      password: tempPassword, // hashed by pre('save')
      role: role || 'worker',
      phone: phone || '',
      estate: estate || '',
      department: department || ''
    });
    await user.save();

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        estate: user.estate,
        department: user.department,
        createdAt: user.createdAt
      },
      temporaryPassword: tempPassword
    });
  } catch (e) {
    console.error('[ADMIN createUser]', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find({}, 'name email role phone estate department createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[ADMIN listUsers]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, role, phone, estate, department, password } = req.body || {};

    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = (email || '').toLowerCase().trim();
    if (role !== undefined) update.role = role;
    if (phone !== undefined) update.phone = phone;
    if (estate !== undefined) update.estate = estate;
    if (department !== undefined) update.department = department;

    if (update.email) {
      const exists = await User.findOne({ email: update.email, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, update);

    if (password && password.trim().length >= 6) {
      user.password = password; // will be hashed by pre('save')
    }

    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        estate: user.estate,
        department: user.department,
        updatedAt: user.updatedAt
      }
    });
  } catch (e) {
    console.error('[ADMIN updateUser]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const temp = generateTempPassword();
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = temp;
    await user.save();
    res.json({ message: 'Password reset', temporaryPassword: temp });
  } catch (e) {
    console.error('[ADMIN resetPassword]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const del = await User.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (e) {
    console.error('[ADMIN deleteUser]', e);
    res.status(500).json({ message: 'Server error' });
  }
};
