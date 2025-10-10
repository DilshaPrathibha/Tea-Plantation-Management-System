// BACKEND/models/Ticket.js
const mongoose = require('mongoose');

const RESPONSE_ROLES = ['admin', 'field_supervisor', 'production_manager', 'inventory_manager', 'worker'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'in_progress', 'replied', 'resolved'];
const CATEGORIES = ['general', 'field_issue', 'inventory', 'production', 'transport', 'other'];

const responseSchema = new mongoose.Schema(
  {
    message: { type: String, trim: true, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: RESPONSE_ROLES, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, trim: true, default: '' },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },

    description: { type: String, trim: true, required: true },

    field: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
    fieldName: { type: String, trim: true, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByRole: { type: String, enum: RESPONSE_ROLES, required: true },

    responses: { type: [responseSchema], default: [] },

    lastStatusChangeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastStatusChangeByName: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
