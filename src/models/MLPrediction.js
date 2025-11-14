const mongoose = require("mongoose");

const mlPredictionSchema = new mongoose.Schema(
  {
    symptomLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SymptomLog",
      required: false,
    },

    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeverEpisode",
      required: false,
    },

    // Probabilities
    dengueProbability: { type: Number, min: 0, max: 100 },
    typhoidProbability: { type: Number, min: 0, max: 100 },
    malariaProbability: { type: Number, min: 0, max: 100 },
    viralProbability: { type: Number, min: 0, max: 100 },
    covidProbability: { type: Number, min: 0, max: 100 },

    // Output
    primaryDiagnosis: {
      type: String,
      required: true,
      enum: [
        "dengue",
        "typhoid",
        "malaria",
        "covid",
        "viral",
        "bacterial",
        "unknown",
      ],
    },

    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    urgency: {
      type: String,
      required: true,
      enum: ["EMERGENCY", "HIGH", "MEDIUM", "LOW"],
    },

    // Recommendations
    fefconRecommendation: String,
    investigationsNeeded: [String],
    keyFeatures: [String],

    modelVersion: { type: String, default: "v1.0" },
    modelConfidence: Number,
  },
  {
    timestamps: true,
  }
);

mlPredictionSchema.index({ episodeId: 1, createdAt: -1 });

module.exports = mongoose.model("MLPrediction", mlPredictionSchema);
