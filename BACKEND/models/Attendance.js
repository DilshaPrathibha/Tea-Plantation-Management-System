// BACKEND/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, trim: true },         // from QR or manual
    workerName: { type: String, trim: true, default: '' },           // optional convenience
    date: { type: String, required: true, trim: true },              // YYYY-MM-DD
    checkInTime: { type: String, trim: true, default: '' },          // HH:mm
    checkOutTime: { type: String, trim: true, default: '' },         // HH:mm
    field: { type: String, trim: true, default: '' },                // estate/section/block
    status: { type: String, trim: true, default: 'present' },        // present/absent/leave
    notes: { type: String, trim: true, default: '' },                // remarks
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      email: String,
      role: String
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ workerId: 1, date: 1 }, { unique: false });
module.exports = mongoose.model('Attendance', attendanceSchema);
