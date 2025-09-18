import { Schema, model } from 'mongoose';

const FNIBatchSchema = new Schema({
  qty: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
}, { _id: false });

const FNIItemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['fertilizer', 'insecticide'], required: true },
  unit: { type: String, enum: ['kg', 'L'], required: true },
  openingQty: { type: Number, min: 0, required: true },
  qtyOnHand: { type: Number, min: 0, required: true },
  minQty: { type: Number, min: 0, default: 0 },
  note: { type: String, trim: true },
  batches: { type: [FNIBatchSchema], default: [] }
}, { timestamps: true });

FNIItemSchema.index({ name: 1, category: 1 }, { unique: true });

export default model('FNIItem', FNIItemSchema);
