// BACKEND/src/controllers/taskcontroller.js
// ⬇️ FIXED PATHS: we're in src/controllers, your models are in /models
const Task = require('../../models/Task');
const Attendance = require('../../models/Attendance');

// GET /api/tasks/eligible-workers?date=YYYY-MM-DD&field=:fieldName
exports.eligibleWorkers = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const field = (req.query.field || '').trim();

    const q = { date, status: { $in: ['present', 'late'] } };
    if (field) q.field = field;

    const attendees = await Attendance.find(q).select('workerId workerName field').lean();
    const tasked = await Task.find({ date }).select('workerId status').lean();
    const taskedSet = new Set(tasked.map(t => String(t.workerId)));

    const items = attendees
      .filter(a => a.workerId && !taskedSet.has(String(a.workerId)))
      .map(a => ({ workerId: a.workerId, workerName: a.workerName || '', field: a.field || '' }));

    res.json({ items });
  } catch (e) {
    console.error('[eligibleWorkers]', e);
    res.status(500).json({ message: 'Failed to load eligible workers' });
  }
};

// GET /api/tasks/today?date=YYYY-MM-DD&field=:fieldName
exports.listToday = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const field = (req.query.field || '').trim();

    const q = { date };
    if (field) q.field = field;

    const items = await Task.find(q).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    console.error('[listToday]', e);
    res.status(500).json({ message: 'Failed to load tasks' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const {
      date, field = '', workerId, workerName = '',
      taskType, customTask = '', dueTime = '17:30',
      priority = 'normal', notes = ''
    } = req.body || {};

    if (!date || !workerId || !taskType) {
      return res.status(400).json({ message: 'date, workerId and taskType are required' });
    }

    const existing = await Task.findOne({ date, workerId, status: { $ne: 'cancelled' } }).lean();
    if (existing) return res.status(409).json({ message: 'Worker already has a task today' });

    const doc = await Task.create({
      date, field, workerId, workerName,
      taskType, customTask: taskType === 'other' ? (customTask || '') : '',
      dueTime, priority, notes
    });

    res.status(201).json({ item: doc });
  } catch (e) {
    console.error('[createTask]', e);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = {};
    const allowed = ['taskType', 'customTask', 'dueTime', 'priority', 'notes', 'status', 'field'];
    for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
    if (payload.taskType !== 'other') payload.customTask = '';

    const updated = await Task.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Task not found' });

    res.json({ item: updated });
  } catch (e) {
    console.error('[updateTask]', e);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const id = req.params.id;
    const del = await Task.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Task not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[deleteTask]', e);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};
