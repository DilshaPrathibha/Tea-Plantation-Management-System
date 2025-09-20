// BACKEND/src/controllers/admincontroller.js
const User = require('../../models/user');

function generateTempPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

// ---- empId generation helpers ----
const ROLE_PREFIX = {
  worker: 'W',
  production_manager: 'PM',
  inventory_manager: 'IM',
  field_supervisor: 'FS',
  admin: 'AD',
};
const PAD_WIDTH = (role) => (role === 'worker' ? 3 : 2);

async function nextEmpIdForRole(role) {
  const prefix = ROLE_PREFIX[role] || 'U';
  const re = new RegExp('^' + prefix + '(\\d+)$', 'i');

  const doc = await User
    .find({ role, empId: { $regex: '^' + prefix, $options: 'i' } })
    .select('empId')
    .lean();

  let max = 0;
  for (const r of doc) {
    const m = r.empId && String(r.empId).match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  const next = max + 1;
  const pad = PAD_WIDTH(role);
  return prefix + String(next).padStart(pad, '0');
}

function isValidEmpIdForRole(empId, role) {
  const prefix = ROLE_PREFIX[role] || 'U';
  const pad = PAD_WIDTH(role);
  const re = new RegExp('^' + prefix + '\\d{' + pad + ',}$', 'i'); // allow >= pad
  return re.test(empId || '');
}

// ----------------------------------

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, empId } = req.body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) return res.status(400).json({ message: 'email required' });
    if (!name) return res.status(400).json({ message: 'name required' });

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const finalRole = role || 'worker';

    // Determine empId (use provided if valid+unique; otherwise auto-generate)
    let finalEmpId = (empId || '').trim().toUpperCase();
    if (!isValidEmpIdForRole(finalEmpId, finalRole)) {
      finalEmpId = await nextEmpIdForRole(finalRole);
    } else {
      const dup = await User.findOne({ empId: finalEmpId });
      if (dup) finalEmpId = await nextEmpIdForRole(finalRole);
    }

    const tempPassword = password && password.trim().length >= 6 ? password : generateTempPassword();

    const user = new User({
      name,
      email: normalizedEmail,
      password: tempPassword, // hashed by pre('save')
      role: finalRole,
      phone: phone || '',
      empId: finalEmpId
    });
    await user.save();

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empId: user.empId,
        phone: user.phone,
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
// Enhancements: q (search), sortBy, sortDir
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const { q = '', sortBy = 'createdAt', sortDir = 'desc' } = req.query;

    // search filter
    const filter = {};
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { name: rx },
        { email: rx },
        { role: rx },
        { empId: rx },
        { phone: rx },
      ];
    }

    // sort whitelist (estate/department removed)
    const ALLOWED_SORT = new Set(['createdAt', 'name', 'email', 'role', 'empId', 'phone']);
    const sortField = ALLOWED_SORT.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const dir = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;
    const sort = { [sortField]: dir, _id: -1 };

    const [items, total] = await Promise.all([
      User.find(filter, 'name email role empId phone createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
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
    const { name, email, role, phone, password, empId } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email !== undefined) {
      const normalizedEmail = (email || '').toLowerCase().trim();
      if (!normalizedEmail) return res.status(400).json({ message: 'invalid email' });
      const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: 'Email already exists' });
      user.email = normalizedEmail;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;

    // Optional: allow admin to set empId explicitly (must be valid+unique for the user's role)
    if (empId !== undefined) {
      const trimmed = (empId || '').trim().toUpperCase();
      if (trimmed && !isValidEmpIdForRole(trimmed, user.role)) {
        return res.status(400).json({ message: 'empId format invalid for role' });
      }
      if (trimmed) {
        const dup = await User.findOne({ empId: trimmed, _id: { $ne: id } });
        if (dup) return res.status(409).json({ message: 'empId already exists' });
        user.empId = trimmed;
      } else {
        user.empId = await nextEmpIdForRole(user.role);
      }
    }

    if (password && password.trim().length >= 6) {
      user.password = password; // hashed by pre('save')
    }

    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empId: user.empId,
        phone: user.phone,
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
