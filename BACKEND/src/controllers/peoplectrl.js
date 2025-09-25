// BACKEND/src/controllers/peoplectrl.js
const User = require('../../models/user');

// GET /api/people/search?q=
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ items: [] });

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // workers only
    const items = await User.find(
      {
        role: 'worker',
        $or: [{ empId: rx }, { name: rx }]
      },
      'empId name role estate department'
    )
      .limit(10)
      .sort({ empId: 1 })
      .lean();

    res.json({ items });
  } catch (e) {
    console.error('[people search]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/people/by-empid/:empId
exports.byEmpId = async (req, res) => {
  try {
    const empId = (req.params.empId || '').trim().toUpperCase();
    if (!empId) return res.status(400).json({ message: 'empId required' });

    const user = await User.findOne(
      { empId, role: 'worker' },
      'empId name role estate department'
    ).lean();

    if (!user) return res.status(404).json({ message: 'Not found' });

    res.json({ user });
  } catch (e) {
    console.error('[people byEmpId]', e);
    res.status(500).json({ message: 'Server error' });
  }
};
