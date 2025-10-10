// BACKEND/models/notification.js
const mongoose = require('mongoose');

const SUPPORTED_ROLES = ['worker', 'admin', 'field_supervisor', 'production_manager', 'inventory_manager'];

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    audience: {
      type: [String],
      default: ['worker'],
      set: (value) => {
        if (Array.isArray(value)) {
          const filtered = value.filter((role) => SUPPORTED_ROLES.includes(role));
          return filtered.length ? [...new Set(filtered)] : ['worker'];
        }
        if (typeof value === 'string' && value.trim()) {
          const trimmed = value.trim();
          return SUPPORTED_ROLES.includes(trimmed) ? [trimmed] : ['worker'];
        }
        return ['worker'];
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
