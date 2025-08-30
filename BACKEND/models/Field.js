// BACKEND/models/Field.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    location: { type: locationSchema, default: () => ({}) },
    teaType: { type: String, trim: true, default: '' },
    estimatedRevenue: { type: Number, default: 0 },
    propertyValue: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'sold', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Field', fieldSchema);
