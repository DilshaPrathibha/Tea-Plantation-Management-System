const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, trim: true },   // from QR or manual
    workerName: { type: String, trim: true, default: '' },    // convenience
    date: { type: String, required: true, trim: true },       // YYYY-MM-DD
    checkInTime: { type: String, trim: true, default: '' },   // HH:mm
    expectedOutTime: { type: String, trim: true, default: '' }, // HH:mm (manual entry by supervisor)
    field: { type: String, trim: true, default: '' },         // field/estate
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'late'],
      default: 'present'
    },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
