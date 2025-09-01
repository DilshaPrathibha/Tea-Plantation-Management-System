// Utility to generate toolId: TL-YYYYMM-XXXX
async function generateToolId() {
  const now = new Date();
  const prefix = `TL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
  let tries = 0;
  let toolId;
  while (tries < 5) {
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    toolId = `${prefix}-${seq}`;
    // Check uniqueness
    const exists = await mongoose.models.Tool.findOne({ toolId });
    if (!exists) return toolId;
    tries++;
  }
  throw new Error('Could not generate unique toolId after several attempts');
}
const mongoose = require('mongoose');


const toolSchema = new mongoose.Schema({
  toolId: { type: String, required: true, unique: true, trim: true },
  toolType: {
    type: String,
    enum: ['knife', 'sprayer', 'harvester', 'hoe', 'other'],
    required: true
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  condition: {
    type: String,
    enum: ['new', 'good', 'needs_repair'],
    default: 'good',
    required: true
  },
  note: { type: String, default: '' },
  // Legacy fields for backward compatibility
  name: { type: String },
  quantity: { type: Number },
  description: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

toolSchema.virtual('status').get(function() {
  if (this.condition === 'needs_repair') return 'needs_repair';
  if (this.assignedTo) return 'assigned';
  return 'available';
});

// Auto-generate toolId if missing
toolSchema.pre('validate', async function(next) {
  if (!this.toolId) {
    try {
      this.toolId = await generateToolId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Tool', toolSchema);
