const mongoose = require('mongoose');

const pestDiseaseSchema = new mongoose.Schema(
  {
  reportId: { type: String, unique: true },
    reporterName: { type: String, required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueType: { 
      type: String, 
      enum: ['Pest Infestation', 'Disease', 'Both', 'Other'],
      required: true 
    },
    pestDiseaseName: { type: String, required: true },
    location: { type: String, required: true },
    mapCoordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    date: { type: Date, required: true },
    severity: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true 
    },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    affectedArea: { type: Number, min: 1, max: 5, required: true },
    requestedActions: [{
      type: String,
      enum: ['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other']
    }],
    status: { 
      type: String, 
      enum: ['Pending', 'Monitoring', 'Treatment Ongoing', 'Resolved'],
      default: 'Pending'
    },
    inventoryRequested: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Generate a unique report ID before saving
pestDiseaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('PestDisease').countDocuments();
    this.reportId = `PD${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PestDisease', pestDiseaseSchema);
