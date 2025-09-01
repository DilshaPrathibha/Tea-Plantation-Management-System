import { Schema, model, Types } from 'mongoose';

const ToolSchema = new Schema({
  name: { type: String, required: true, trim: true },
  toolType: { type: String, required: true, trim: true },
  assignedTo: { type: Types.ObjectId, ref: 'User', default: null },
  condition: { type: String, enum: ['good', 'needs_repair'], default: 'good' },
  note: { type: String, trim: true },
  quantity: { type: Number, default: 1, min: 0 },
  description: { type: String, trim: true },
  // Add other fields as needed
}, { timestamps: true });

// This file is being renamed to Tool.js for ESM compatibility.
export default model('Tool', ToolSchema);
