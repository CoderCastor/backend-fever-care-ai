const mongoose = require('mongoose');

const contactTracingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeverEpisode',
    required: true
  },
  
  // Contact details
  contactPersonName: String,
  contactPhone: String,
  contactEmail: String,
  
  relationship: {
    type: String,
    enum: ['family', 'colleague', 'friend', 'neighbor', 'other']
  },
  
  lastContactDate: {
    type: Date,
    required: true
  },
  
  contactDuration: Number, // in hours
  contactLocation: String,
  
  // Contact status
  hasSymptoms: { type: Boolean, default: false },
  symptomsStartDate: Date,
  tested: { type: Boolean, default: false },
  testResult: String,
  
  // Notification
  notified: { type: Boolean, default: false },
  notifiedAt: Date,
  
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

contactTracingSchema.index({ patientId: 1, lastContactDate: -1 });
contactTracingSchema.index({ episodeId: 1 });

module.exports = mongoose.model('ContactTracing', contactTracingSchema);
