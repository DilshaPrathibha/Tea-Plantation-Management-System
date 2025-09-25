// BACKEND/src/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },           // YYYY-MM-DD
    field: { type: String, default: '' },             // Field NAME (not _id)
    workerId: { type: String, required: true },       // EmpID like W001
    workerName: { type: String, default: '' },

    taskType: { type: String, required: true },       // 'tea plucking', 'weeding', 'fertilizing', 'pruning', 'other'
    customTask: { type: String, default: '' },        // filled only if taskType === 'other'
    dueTime: { type: String, default: '17:30' },      // HH:mm (24h)
    priority: { type: String, enum: ['low','normal','high'], default: 'normal' },
    notes: { type: String, default: '' },

    status: { type: String, enum: ['assigned', 'completed', 'cancelled'], default: 'assigned' },
  },
  { timestamps: true }
);

// Do NOT hard-enforce uniqueness; we’ll check in controller to avoid 500s.
TaskSchema.index({ date: 1, workerId: 1 });

module.exports = mongoose.model('Task', TaskSchema);
