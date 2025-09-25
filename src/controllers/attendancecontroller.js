// BACKEND/src/controllers/attendancecontroller.js
const Attendance = require('../../models/Attendance');
const User = require('../../models/user'); // NOTE: case-sensitive on Linux!

/** Time helpers (Sri Lanka local) */
const TZ = 'Asia/Colombo';
function nowInTZ() {
  const d = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); // YYYY-MM-DD
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d); // HH:mm
  return { date, time };
}
const todayStr = () => nowInTZ().date;
const nowHHMM = () => nowInTZ().time;

// workday start threshold (change if needed)
const SHIFT_START_HHMM = '08:30';

function isValidHHMM(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.trim());
}

/* ===================== CRUD ===================== */

// POST /api/attendance
async function createAttendance(req, res) {
  try {
    const {
      workerId,
      workerName = '',
      date = todayStr(),
      checkInTime = '',
      checkOutTime = '',
      expectedOutTime = '',
      field = '',
      status = 'present',
      notes = ''
    } = req.body || {};
    if (!workerId) return res.status(400).json({ message: 'workerId is required' });

    const doc = await Attendance.create({
      workerId: String(workerId).trim().toUpperCase(),
      workerName,
      date,
      checkInTime,
      checkOutTime,
      expectedOutTime: isValidHHMM(expectedOutTime) ? expectedOutTime : '',
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
}

// GET /api/attendance  (filters: q, status, dateFrom, dateTo, workerId)
async function listAttendance(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const skip = (page - 1) * limit;

    const { q = '', status, dateFrom, dateTo, workerId } = req.query;
    const filter = {};
    if (workerId) filter.workerId = String(workerId).toUpperCase();

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = String(dateFrom);
      if (dateTo) filter.date.$lte = String(dateTo);
    }
    if (status) filter.status = String(status);

    if (q) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ workerId: rx }, { workerName: rx }, { field: rx }];
    }

    const [items, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter)
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[attendance list]', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/attendance/:id
async function getAttendance(req, res) {
  try {
    const item = await Attendance.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ item });
  } catch (e) {
    console.error('[attendance get]', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/attendance/:id
async function updateAttendance(req, res) {
  try {
    const update = {};
    [
      'workerId', 'workerName', 'date', 'checkInTime',
      'checkOutTime', 'expectedOutTime', 'field', 'status', 'notes'
    ].forEach(k => {
      if (req.body[k] !== undefined) {
        if (k === 'workerId') update[k] = String(req.body[k]).toUpperCase();
        else if (k === 'expectedOutTime') update[k] = isValidHHMM(req.body[k]) ? req.body[k] : '';
        else update[k] = req.body[k];
      }
    });

    const item = await Attendance.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ item });
  } catch (e) {
    console.error('[attendance update]', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/attendance/:id
async function deleteAttendance(req, res) {
  try {
    const del = await Attendance.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[attendance delete]', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ===================== QR auto-fill ===================== */

// POST /api/attendance/checkin  { workerId, field?, expectedOutTime? }
async function checkInAuto(req, res) {
  try {
    const workerId = String(req.body?.workerId || '').trim().toUpperCase();
    if (!workerId) return res.status(400).json({ message: 'workerId is required' });

    const { date, time } = nowInTZ();
    const user = await User.findOne({ empId: workerId }).lean();

    const workerName = user?.name || '';
    // prefer supervisor-selected field from body, fallback to user's estate or existing
    const selectedField = String(req.body?.field || '').trim();
    const field = selectedField || user?.estate || '';

    // HH:mm validation for expected out
    const expectedOutTime = isValidHHMM(req.body?.expectedOutTime) ? req.body.expectedOutTime : '';

    // auto status based on current time (late if after SHIFT_START_HHMM)
    const status = time > SHIFT_START_HHMM ? 'late' : 'present';

    let doc = await Attendance.findOne({ workerId, date });
    if (doc) {
      if (!doc.checkInTime) doc.checkInTime = time;
      if (workerName) doc.workerName = workerName;
      if (field) doc.field = field;
      if (expectedOutTime) doc.expectedOutTime = expectedOutTime;
      doc.status = status || doc.status || 'present';
      if (req.user) {
        doc.createdBy = {
          _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role
        };
      }
      await doc.save();
    } else {
      doc = await Attendance.create({
        workerId,
        workerName,
        field,
        date,
        checkInTime: time,
        checkOutTime: '',
        expectedOutTime,
        status,
        notes: '',
        createdBy: req.user
          ? { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
          : undefined
      });
    }

    return res.json(doc);
  } catch (e) {
    console.error('[attendance checkInAuto]', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/attendance/checkout  { workerId }
async function checkOutAuto(req, res) {
  try {
    const workerId = String(req.body?.workerId || '').trim().toUpperCase();
    if (!workerId) return res.status(400).json({ message: 'workerId is required' });

    const { date, time } = nowInTZ();
    const user = await User.findOne({ empId: workerId }).lean();
    const workerName = user?.name || '';
    const fieldFromBody = String(req.body?.field || '').trim();
    const field = fieldFromBody || user?.estate || '';

    const doc = await Attendance.findOneAndUpdate(
      { workerId, date },
      {
        $set: {
          workerId,
          workerName,
          field,
          date,
          status: 'present',
          checkOutTime: time,
          'createdBy._id': req.user?._id,
          'createdBy.name': req.user?.name,
          'createdBy.email': req.user?.email,
          'createdBy.role': req.user?.role
        }
      },
      { new: true, upsert: true }
    );

    return res.json(doc);
  } catch (e) {
    console.error('[attendance checkOutAuto]', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createAttendance,
  listAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  checkInAuto,
  checkOutAuto,
};
