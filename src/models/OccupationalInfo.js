const mongoose = require('mongoose');

const occupationalInfoSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  occupation: String,
  employer: String,
  workLocation: {
    address: String,
    city: String,
    coordinates: [Number]
  },
  
  workType: {
    type: String,
    enum: ['indoor', 'outdoor', 'field', 'mixed']
  },
  
  outdoorExposure: { type: Boolean, default: false },
  exposureHours: Number, // hours per day
  
  // Workplace conditions
  hasACOffice: { type: Boolean, default: true },
  nearWaterBody: { type: Boolean, default: false },
  constructionNearby: { type: Boolean, default: false },
  
  // Sick colleagues
  sickColleagues: [{
    name: String,
    position: String,
    diagnosis: String,
    date: Date
  }],
  
  workplaceOutbreak: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('OccupationalInfo', occupationalInfoSchema);
