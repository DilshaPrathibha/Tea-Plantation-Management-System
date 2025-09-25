const mongoose = require('mongoose');

const transportManagementReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true }, // Add vehicleId field
  generatedDate: { type: Date, default: Date.now },
  period: {
    start: Date,
    end: Date
  },
  transports: [{
    vehicleId: String,
    vehicleType: String,
    driverName: String,
    batchId: String,
    destination: String,
    status: String,
    departureTime: Date,
    estimatedArrival: Date,
    actualArrival: Date
  }],
  summary: {
    totalTransports: Number,
    scheduled: Number,
    inTransit: Number,
    delivered: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('TransportManagementReport', transportManagementReportSchema);