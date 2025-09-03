const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskName: { type: String, trim: true, required: true },
    taskDescription: { type: String, trim: true, default: '' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    weatherSnapshot: {
      condition: String,
      tempC: Number,
      humidity: Number,
      windMs: Number,
      workAllowed: Boolean,
      alerts: [String]
    }
  },
  { timestamps: true }
);

// Index for quick checks on worker availability
taskSchema.index({ workerId: 1, date: 1 }, { unique: true }); // Prevent multiple tasks per worker per day

module.exports = mongoose.model('Task', taskSchema);