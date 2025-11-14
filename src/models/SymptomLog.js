const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeverEpisode',
    required: true,
  },
  
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Day tracking
  logDate: {
    type: Date,
    default: () => new Date().setHours(0, 0, 0, 0),
  },
  
  dayOfIllness: {
    type: Number,
    required: true,
    min: 1,
  },
  
  // Vitals
  temperature: {
    type: Number,
    required: true,
    min: 95,
    max: 108,
  },
  
  tempTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
  },
  
  pulseRate: {
    type: Number,
    min: 40,
    max: 200,
  },
  
  // Symptoms
  headache: { type: Boolean, default: false },
  bodyPain: { type: Boolean, default: false },
  rash: { type: Boolean, default: false },
  rashLocation: String,
  bleeding: { type: Boolean, default: false },
  bleedingSite: String,
  abdominalPain: { type: Boolean, default: false },
  vomiting: { type: Boolean, default: false },
  vomitingCount: Number,
  breathlessness: { type: Boolean, default: false },
  confusion: { type: Boolean, default: false },
  nausea: { type: Boolean, default: false },
  
  // Observations
  foodIntake: {
    type: String,
    enum: ['normal', 'reduced', 'poor', 'nil'],
  },
  
  urineOutput: {
    type: String,
    enum: ['normal', 'reduced', 'dark', 'bloody'],
  },
  
  // Medication response
  paracetamolTaken: { type: Boolean, default: false },
  paracetamolResponse: {
    type: String,
    enum: ['reduced_fever', 'no_effect', 'partial_relief'],
  },
  
  notes: String,
}, {
  timestamps: true,
});

symptomLogSchema.index({ episodeId: 1, dayOfIllness: 1 });
symptomLogSchema.index({ patientId: 1, logDate: -1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
