const { Schema, model, Types } = require('mongoose');

const ToolSchema = new Schema({
  toolId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, trim: true },
  toolType: { type: String, required: true, trim: true },
  assignedTo: { type: Types.ObjectId, ref: 'User', default: null },
  condition: { type: String, enum: ['new', 'good', 'needs_repair', 'retired'], default: 'good' },
  note: { type: String, trim: true, maxlength: 100 },
  quantity: { type: Number, default: 1, min: 0 },
  description: { type: String, trim: true },
  // Add other fields as needed
}, { timestamps: true });

module.exports = model('Tool', ToolSchema);