const mongoose = require('mongoose');

const episodeHistorySchema = new mongoose.Schema({
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeverEpisode',
    required: true,
    unique: true,
  },
  
  // Prior treatment
  priorAntibiotics: { type: Boolean, default: false },
  antibioticName: String,
  antibioticStartDate: Date,
  
  // Medical conditions
  hasDiabetes: { type: Boolean, default: false },
  immunocompromised: { type: Boolean, default: false },
  isPregnant: { type: Boolean, default: false },
  chronicDiseases: [String],
  
  // Exposure
  recentTravel: { type: Boolean, default: false },
  travelLocation: String,
  travelReturnDate: Date,
  mosquitoExposure: { type: Boolean, default: false },
  sickContacts: { type: Boolean, default: false },
  
  waterSource: {
    type: String,
    enum: ['filtered', 'tap', 'well', 'outside', 'unknown'],
  },
  
  // Fever pattern
  feverPattern: {
    type: String,
    enum: ['continuous', 'intermittent', 'evening_rise', 'morning_peak'],
  },
  
  highestTemperature: Number,
  measurementMethod: {
    type: String,
    enum: ['digital', 'infrared', 'mercury', 'touch'],
  },
}, {
  timestamps: true,
});

episodeHistorySchema.index({ episodeId: 1 });

module.exports = mongoose.model('EpisodeHistory', episodeHistorySchema);
