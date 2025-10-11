const mongoose = require('mongoose');

const pestDiseaseSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    reporterName: { 
      type: String, 
      required: [true, 'Reporter name is required'],
      trim: true 
    },
    title: { 
      type: String, 
      required: [true, 'Title is required'],
      trim: true 
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'] 
    },
    date: { 
      type: Date, 
      required: [true, 'Date is required'],
      validate: {
        validator: function(value) {
          return value <= new Date();
        },
        message: 'Date cannot be in the future'
      }
    },
    type: { 
      type: String, 
      enum: {
        values: ['Pest Infestation', 'Disease', 'Both', 'Other'],
        message: 'Type must be one of: Pest Infestation, Disease, Both, Other'
      },
      required: [true, 'Issue type is required'] 
    },
    urgency: { 
      type: String, 
      enum: {
        values: ['Low (Routine monitoring)', 'Medium (Schedule treatment)', 'High (Immediate action needed)', 'Emergency (Critical threat)'],
        message: 'Urgency must be one of: Low, Medium, High, Emergency'
      },
      required: [true, 'Urgency level is required'] 
    },
    economicImpact: { 
      type: String, 
      enum: {
        values: ['Minimal (<5% loss)', 'Moderate (5-20% loss)', 'Significant (20-50% loss)', 'Severe (>50% loss)'],
        message: 'Economic impact must be one of: Minimal, Moderate, Significant, Severe'
      },
      required: [true, 'Economic impact level is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      trim: true 
    },
    affectedArea: { 
      type: Number, 
      min: [0.5, 'Affected area must be at least 0.5 perch'],
      max: [2000, 'Affected area cannot exceed 2000 perch'],
      required: [true, 'Affected area is required'] 
    },
    requestedActions: [{
      type: String,
      enum: {
        values: ['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other'],
        message: 'Requested action must be one of: Fertilizer, Insecticide, Fungicide, Manual Intervention, Other'
      }
    }],
    otherAction: { 
      type: String, 
      default: '',
      trim: true 
    },
    mapCoordinates: {
      lat: { 
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: { 
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    imageUrl: { 
      type: String, 
      default: '' 
    },
    status: { 
      type: String, 
      enum: {
        values: ['Pending', 'Monitoring', 'Treatment Ongoing', 'Resolved'],
        message: 'Status must be one of: Pending, Monitoring, Treatment Ongoing, Resolved'
      },
      default: 'Pending'
    },
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Reported by user is required'] 
    }
  },
  { timestamps: true }
);

// Add validation for otherAction when Other is selected in requestedActions
pestDiseaseSchema.pre('save', function(next) {
  if (this.requestedActions.includes('Other') && (!this.otherAction || this.otherAction.trim() === '')) {
    next(new Error('Please specify the other action when "Other" is selected in requested actions'));
  } else {
    next();
  }
});

// Auto-generate reportId before saving if not provided
pestDiseaseSchema.pre('save', function(next) {
  if (!this.reportId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    this.reportId = `PD-${year}${month}${day}-${timestamp}${random}`;
  }
  next();
});

// Static method to generate report ID (optional, for manual generation)
pestDiseaseSchema.statics.generateReportId = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `PD-${year}${month}${day}-${timestamp}${random}`;
};

module.exports = mongoose.model('PestDisease', pestDiseaseSchema);