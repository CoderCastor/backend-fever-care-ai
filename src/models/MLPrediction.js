// models/MLPrediction.js
const mongoose = require('mongoose');

const mlPredictionSchema = new mongoose.Schema({
  symptomLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomLog',
    required: false,
    default: null
  },
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeverEpisode',
    required: false,
    default: null
  },
  dengueProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  typhoidProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  malariaProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  viralProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  primaryDiagnosis: {
    type: String,
    required: true,
    enum: ['Dengue', 'Malaria', 'Typhoid', 'Viral', 'Other'],  // ✅ Capitalize to match Flask
    lowercase: false  // ✅ Don't force lowercase
  },
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  urgency: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY', 'CRITICAL'],
    required: true
  },
  fefconRecommendation: {
    type: String,
    required: true
  },
  investigationsNeeded: [{
    type: String
  }],
  keyFeatures: [{
    type: String
  }],
  modelVersion: {
    type: String,
    default: 'v2.0'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MLPrediction', mlPredictionSchema);
