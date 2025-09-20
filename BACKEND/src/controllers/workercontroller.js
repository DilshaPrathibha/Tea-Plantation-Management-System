// BACKEND/src/controllers/workercontroller.js
const Attendance = require('../../models/Attendance');
const Task = require('../../models/Task');
const Note = require('../../models/note'); // you already have this model

// GET /api/worker/summary?date=YYYY-MM-DD
// Uses req.user (set by verifyToken). Assumes user has {empId, name, email}.
exports.summary = async (req, res) => {
  try {
    const date = (req.query.date || new Date().toISOString().slice(0, 10)).trim();
    const user = req.user || {};
    const workerId = user.empId || user.employeeId || user.empID || ''; // be forgiving
    const workerName = user.name || '';

    if (!workerId) {
      return res.status(400).json({ message: 'Worker EmpID not found on user profile' });
    }

    // Attendance for today (optional harvestKg field is allowed; Mongo is schemaless)
    const att = await Attendance.findOne({ date, workerId }).lean();

    // Today’s tasks for this worker
    const tasks = await Task.find({ date, workerId }).sort({ createdAt: -1 }).lean();

    // Recent notices (admin → workers). Last 14 days, top 20.
    // Adjust the query to your note schema if needed.
    const since = new Date(); since.setDate(since.getDate() - 14);
    const notices = await Note.find({
      createdAt: { $gte: since },
      // keep this generic; many teams use fields like audience/tags
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('title content createdAt author audience tags')
    .lean();

    res.json({
      worker: {
        id: workerId,
        name: workerName,
        email: user.email || '',
      },
      date,
      attendance: att || null,
      // use 0 if not recorded
      pluckedKg: Number(att?.harvestKg || 0),
      tasks,
      notices
    });
  } catch (e) {
    console.error('[worker summary]', e);
    res.status(500).json({ message: 'Failed to load summary' });
  }
};

// POST /api/worker/notify
// body: { title, content }
exports.notify = async (req, res) => {
  try {
    const user = req.user || {};
    const workerId = user.empId || user.employeeId || user.empID || '';
    const name = user.name || 'Worker';
    const { title = 'Worker Notice', content = '' } = req.body || {};

    if (!workerId || !content.trim()) {
      return res.status(400).json({ message: 'Missing worker or content' });
    }

    const doc = await Note.create({
      title: String(title || 'Worker Notice'),
      content: String(content),
      author: name,
      // add some meta in your note document
      tags: ['worker-notice', workerId],
      audience: 'admin'
    });

    res.status(201).json({ item: doc });
  } catch (e) {
    console.error('[worker notify]', e);
    res.status(500).json({ message: 'Failed to post notice' });
  }
};
