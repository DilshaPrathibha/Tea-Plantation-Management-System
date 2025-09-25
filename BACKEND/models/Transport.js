const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  driverName: { type: String, required: true },
  batchId: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: Date, default: Date.now },
  estimatedArrival: { type: Date },
  actualArrival: { type: Date },
  status: { type: String, default: 'scheduled' },
  notes: { type: String },
  // Add GPS tracking fields
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);