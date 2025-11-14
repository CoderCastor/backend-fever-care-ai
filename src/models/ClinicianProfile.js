const mongoose = require('mongoose');

const clinicianProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Professional Info
  specialization: {
    type: String,
    enum: [
      'general_medicine',
      'infectious_disease',
      'pediatrics',
      'internal_medicine',
      'emergency_medicine',
      'other'
    ],
  },
  
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Hospital/Clinic
  hospitalName: String,
  hospitalAddress: String,
  
  // Experience
  yearsOfExperience: Number,
  
  // Availability
  consultationHours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String,
  },
  
  // Stats
  patientsCount: {
    type: Number,
    default: 0,
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

clinicianProfileSchema.index({ userId: 1 });
clinicianProfileSchema.index({ licenseNumber: 1 });
clinicianProfileSchema.index({ isVerified: 1 });

module.exports = mongoose.model('ClinicianProfile', clinicianProfileSchema);
