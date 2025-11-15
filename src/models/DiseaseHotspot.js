const mongoose = require('mongoose');

const diseaseHotspotSchema = new mongoose.Schema({
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: String,
  area: String,
  
  disease: {
    type: String,
    required: true,
    enum: ['dengue', 'typhoid', 'malaria', 'viral', 'other']
  },
  
  caseCount: { type: Number, default: 1 },
  activeCases: { type: Number, default: 1 },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // Time window
  weekNumber: Number,
  month: Number,
  year: Number,
  
  // For Micro Labs
  medicineRequired: String,
  quantityNeeded: Number,
  distributionStatus: {
    type: String,
    enum: ['pending', 'planned', 'dispatched', 'delivered'],
    default: 'pending'
  }
}, { timestamps: true });

// ✅ FIXED: Use diseaseHotspotSchema instead of hotspotSchema
diseaseHotspotSchema.index({ location: '2dsphere' });
diseaseHotspotSchema.index({ city: 1, disease: 1, month: 1 });

module.exports = mongoose.model('DiseaseHotspot', diseaseHotspotSchema);
