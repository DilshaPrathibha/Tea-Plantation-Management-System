// BACKEND/src/controllers/attendancecontroller.js
const Attendance = require('../../models/Attendance');

const todayStr = () => new Date().toISOString().slice(0, 10);

// POST /api/attendance
exports.createAttendance = async (req, res) => {
  try {
    const {
      workerId,
      workerName = '',
      date = todayStr(),
      checkInTime = '',
      checkOutTime = '',
      field = '',
      status = 'present',
      notes = ''
    } = req.body || {};

    if (!workerId) return res.status(400).json({ message: 'workerId is required' });

    const doc = await Attendance.create({
      workerId: String(workerId).trim(),
      workerName,
      date,
      checkInTime,
      checkOutTime,
      field,
      status,
      notes,
      createdBy: req.user ? {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      } : undefined
    });

    res.status(201).json({ item: doc });
  } catch (e) {
    console.error('[attendance create]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance
exports.listAttendance = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.date) q.date = String(req.query.date);
    if (req.query.workerId) q.workerId = String(req.query.workerId);

    const [items, total] = await Promise.all([
      Attendance.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(q)
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[attendance list]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/:id
exports.getAttendance = async (req, res) => {
  try {
    const item = await Attendance.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ item });
  } catch (e) {
    console.error('[attendance get]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    const update = {};
    [
      'workerId', 'workerName', 'date', 'checkInTime',
      'checkOutTime', 'field', 'status', 'notes'
    ].forEach(k => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const item = await Attendance.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ item });
  } catch (e) {
    console.error('[attendance update]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const del = await Attendance.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[attendance delete]', e);
    res.status(500).json({ message: 'Server error' });
  }
};
