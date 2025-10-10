const mongoose = require('mongoose');

const productionBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true },
    fieldId: { type: String, default: '' },
    fieldName: { type: String, default: '' },
    pluckingDate: { type: Date, required: true },
    teaWeight: { type: Number, required: true },
    qualityGrade: { type: String, required: true },
    supervisor: { type: String, required: true },
    notes: { type: String },
    status: { type: String, default: 'pending' },
    varianceReason: { type: String, default: '' },
    varianceNote: { type: String, default: '' },
    pluckingTotal: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);
