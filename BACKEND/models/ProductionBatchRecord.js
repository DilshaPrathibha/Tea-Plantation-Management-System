const mongoose = require('mongoose');

const productionBatchRecordSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  productionDate: { type: Date, required: true },
  fieldName: { type: String, required: true },
  teaWeight: { type: Number, required: true },
  qualityGrade: { type: String, required: true },
  supervisor: { type: String, required: true },
  pluckingRecords: [{
    date: Date,
    field: String,
    totalWeight: Number,
    totalPayment: Number,
    teaGrade: String,
    workerCount: Number
  }],
  status: { type: String, default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProductionBatchRecord', productionBatchRecordSchema);