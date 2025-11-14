const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Demographics
  age: {
    type: Number,
    min: 0,
    max: 150,
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  
  dateOfBirth: Date,
  
  // Contact
  alternatePhone: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  
  // Location (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
  },
  
  // Health Metrics
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  status: {
    type: String,
    enum: ['active', 'monitoring', 'recovered', 'hospitalized'],
    default: 'active',
  },
  
  // Medical Background
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  
  allergies: [String],
  chronicConditions: [String],
  
}, {
  timestamps: true,
});

patientProfileSchema.index({ userId: 1 });
patientProfileSchema.index({ riskScore: -1 });
patientProfileSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
