// BACKEND/models/PluckingRecord.js
const mongoose = require('mongoose');

const pluckingRecordSchema = new mongoose.Schema(
  {
    date: { 
      type: Date, 
      required: true 
    },
    field: { 
      type: String, 
      required: true,
      trim: true 
    },
    dailyPricePerKg: { 
      type: Number, 
      required: true,
      min: 0,
      max: 500 
    },
    teaGrade: {
      type: String,
      required: true,
      enum: [
        'Pekoe (P)',
        'Broken Pekoe (BP)',
        'Broken Pekoe Fannings (BPF)',
        'Flowery Broken Orange Pekoe (FBOP)',
        'Flowery Broken Orange Pekoe Fannings (FBOPF)',
        'Orange Pekoe (OP)',
        'Broken Orange Pekoe (BOP)',
        'Broken Orange Pekoe Fannings (BOPF)',
        'Dust Grade (Dust / PD)'
      ]
    },
    workers: [{
      workerId: { type: String, required: true },
      workerName: { type: String, required: true },
      weight: { type: Number, required: true, min: 0 }
    }],
    totalWeight: { 
      type: Number, 
      required: true,
      min: 0 
    },
    totalPayment: { 
      type: Number, 
      required: true,
      min: 0 
    },
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    reporterName: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PluckingRecord', pluckingRecordSchema);
