const mongoose = require('mongoose');

const feverEpisodeSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Changed to User
    required: true,
  },
  
  startedAt: {
    type: Date,
    default: Date.now,
  },
  
  endedAt: Date,
  
  status: {
    type: String,
    enum: ['active', 'resolved', 'hospitalized', 'escalated'],
    default: 'active',
  },
  
  // Diagnosis
  finalDiagnosis: {
    type: String,
    enum: ['dengue', 'typhoid', 'malaria', 'covid', 'viral', 'bacterial', 'other', 'unknown'],
  },
  
  labConfirmed: {
    type: Boolean,
    default: false,
  },
  
  confirmationDate: Date,
  
  // Hospital
  hospitalized: {
    type: Boolean,
    default: false,
  },
  
  hospitalName: String,
  admissionDate: Date,
  dischargeDate: Date,
  
  // Assigned clinician
  assignedClinician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  clinicianNotes: String,
}, {
  timestamps: true,
});

feverEpisodeSchema.index({ patientId: 1, startedAt: -1 });
feverEpisodeSchema.index({ status: 1 });
feverEpisodeSchema.index({ assignedClinician: 1 });

module.exports = mongoose.model('FeverEpisode', feverEpisodeSchema);
