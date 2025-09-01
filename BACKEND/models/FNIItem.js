import { Schema, model } from 'mongoose';

const FNIItemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['fertilizer', 'insecticide'], required: true },
  unit: { type: String, enum: ['kg', 'L'], required: true },
  openingQty: { type: Number, min: 0, required: true },
  qtyOnHand: { type: Number, min: 0, required: true },
  minQty: { type: Number, min: 0, default: 0 },
  note: { type: String, trim: true }
}, { timestamps: true });

FNIItemSchema.index({ name: 1, category: 1 }, { unique: true });

export default model('FNIItem', FNIItemSchema);
