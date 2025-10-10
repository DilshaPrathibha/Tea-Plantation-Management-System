// BACKEND/models/Field.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teaType: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Sold', 'Archived'], default: 'Active' },
    revenue: { type: String, trim: true, default: '' },
    value: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    images: {
      type: [
        {
          name: { type: String, trim: true, default: '' },
          url: { type: String, required: true, trim: true },
        },
      ],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 5,
        message: 'A field can have at most 5 images',
      },
    },
    lat: { type: Number, default: undefined },
    lng: { type: Number, default: undefined }
  },
  { timestamps: true }
);

// Reuse compiled model to avoid OverwriteModelError on hot reload (Windows/Nodemon)
module.exports = mongoose.models.Field || mongoose.model('Field', fieldSchema);
