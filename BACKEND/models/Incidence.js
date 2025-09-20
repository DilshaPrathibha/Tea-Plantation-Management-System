const mongoose = require('mongoose');

const incidenceSchema = new mongoose.Schema(
  {
    reporterName: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Injury', 'Equipment Damage', 'Environmental Hazard', 'Other'],
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true 
    },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['Pending', 'Under Review', 'Action Taken', 'Resolved'],
      default: 'Pending'
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incidence', incidenceSchema);