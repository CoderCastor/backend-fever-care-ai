const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  medicationName: {
    type: String,
    required: true,
  },
  
  dosage: {
    type: String,
    required: true,
  },
  
  frequency: {
    type: String,
    required: true,
  },
  
  instructions: String,
  
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Clinician
  },
  
  prescribedDate: {
    type: Date,
    default: Date.now,
  },
  
  startDate: {
    type: Date,
    required: true,
  },
  
  endDate: Date,
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

medicationSchema.index({ patientId: 1, isActive: 1 });
medicationSchema.index({ prescribedBy: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
