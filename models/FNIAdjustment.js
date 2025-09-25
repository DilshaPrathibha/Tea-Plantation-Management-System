const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const FNIAdjustmentSchema = new Schema({
  itemId: { type: Types.ObjectId, ref: 'FNIItem', required: true },
  delta: {
    type: Number,
    required: true,
    validate: {
      validator: v => v !== 0,
      message: 'Delta must be non-zero'
    }
  },
  reason: {
    type: String,
    enum: ['purchase', 'usage', 'wastage', 'correction'],
    default: 'correction'
  },
  note: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('FNIAdjustment', FNIAdjustmentSchema);
