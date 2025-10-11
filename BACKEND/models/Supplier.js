const { Schema, model } = require('mongoose');

const SupplierSchema = new Schema({
  supplierId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['fertilizer', 'insecticide', 'tools', 'equipment', 'other'], 
    trim: true 
  },
  contactNumber: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'suspended'], 
    default: 'active' 
  },
  notes: { type: String, trim: true, maxlength: 500 },
  // Additional supplier-specific fields
  paymentTerms: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },
  taxId: { type: String, trim: true },
  website: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  emergencyContact: { type: String, trim: true },
}, { timestamps: true });

module.exports = model('Supplier', SupplierSchema);