const mongoose = require('mongoose');

const productionBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  fieldId: { type: String, required: true },
  fieldName: { type: String, required: true },
  pluckingDate: { type: Date, required: true },
  teaWeight: { type: Number, required: true },
  qualityGrade: { type: String, required: true },
  supervisor: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);