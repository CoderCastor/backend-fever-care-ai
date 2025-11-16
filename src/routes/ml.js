const express = require("express");
const router = express.Router();
const axios = require("axios");
const MLPrediction = require("../models/MLPrediction");
const Alert = require("../models/Alert");
const SymptomLog = require("../models/SymptomLog");
const FeverEpisode = require("../models/FeverEpisode");
const EpisodeHistory = require("../models/EpisodeHistory");

// FeFCon 2024 Rule-Based Logic
function getFefconRecommendation(diagnosis, confidence, dayOfIllness, history = {}) {
  const rec = {
    urgency: "MEDIUM",
    recommendation: "",
    investigations: [],
    redFlags: [],
    monitoring: []
  };

  if (diagnosis === "Dengue") {
    if (dayOfIllness <= 3) {
      rec.urgency = "MEDIUM";
      rec.recommendation = "Febrile Phase: Hydration + Paracetamol. Monitor platelet daily.";
      rec.investigations = ["CBC with platelet", "NS1 antigen (Day 1-3)", "Hematocrit"];
      rec.monitoring = ["Daily CBC", "Watch for warning signs (Day 3-7)"];
    } else if (dayOfIllness <= 7) {
      if (history.bleeding || history.abdominalPain) {
        rec.urgency = "EMERGENCY";
        rec.redFlags = ["⚠️ WARNING SIGNS - Critical Phase"];
        rec.recommendation = "IMMEDIATE HOSPITALIZATION - Critical phase with danger signs";
      } else {
        rec.urgency = "HIGH";
        rec.recommendation = "Critical Phase: Close monitoring, CBC q6h, strict I/O charting";
      }
      rec.investigations = ["CBC q6h", "Dengue IgM/IgG", "Liver enzymes", "Albumin"];
    } else {
      rec.urgency = "LOW";
      rec.recommendation = "Recovery Phase: Ensure platelet >100k before discharge";
      rec.investigations = ["CBC"];
    }
  } else if (diagnosis === "Typhoid") {
    rec.urgency = dayOfIllness > 5 ? "HIGH" : "MEDIUM";
    rec.recommendation = "Start empirical Ceftriaxone/Azithromycin + Supportive care";
    rec.investigations = ["Blood culture (before antibiotics)", "Widal test", "CBC", "LFT"];
    rec.monitoring = ["Temperature chart", "Watch for perforation/bleeding"];
    if (history.priorAntibiotics) {
      rec.redFlags.push("⚠️ Prior antibiotics - Culture-guided therapy needed");
    }
  } else if (diagnosis === "Malaria") {
    rec.urgency = "HIGH";
    rec.recommendation = "Blood smear STAT + Start antimalarial if positive";
    rec.investigations = ["Thick/thin smear", "Rapid diagnostic test", "CBC"];
    rec.monitoring = ["Daily parasitemia", "Watch for cerebral malaria"];
    if (history.recentTravel) {
      rec.redFlags.push("✈️ Travel history - High malaria risk");
    }
  } else {
    rec.urgency = confidence > 70 ? "LOW" : "MEDIUM";
    rec.recommendation = "Supportive care + Hydration + Antipyretics";
    rec.investigations = ["CBC", "COVID-19 test if indicated"];
    rec.monitoring = ["Temperature monitoring", "Watch for bacterial superinfection"];
  }

  // Adjust for comorbidities
  if (history.hasDiabetes || history.immunocompromised) {
    if (rec.urgency === "LOW") rec.urgency = "MEDIUM";
    if (rec.urgency === "MEDIUM") rec.urgency = "HIGH";
    rec.redFlags.push("🚨 High-risk patient - Closer monitoring needed");
  }

  return rec;
}

// Main prediction endpoint
router.post("/predict", async (req, res) => {
  try {
    const {
      patientId,
      episodeId,
      symptomLogId,
      temperature,
      fever_days,
      headache,
      body_pain,
      eye_pain,
      nausea_vomiting,
      abdominal_pain,
      rash,
      bleeding,
      platelet_count,
      mosquito_exposure,
      travel
    } = req.body;

    // Get episode history if available
    let history = {};
    let dayOfIllness = fever_days || 1;

    if (episodeId) {
      const episodeHistory = await EpisodeHistory.findOne({ episodeId });
      if (episodeHistory) {
        history = {
          priorAntibiotics: episodeHistory.priorAntibiotics,
          hasDiabetes: episodeHistory.hasDiabetes,
          immunocompromised: episodeHistory.immunocompromised,
          recentTravel: episodeHistory.recentTravel,
          bleeding: bleeding === 1,
          abdominalPain: abdominal_pain === 1
        };
      }

      // Get day of illness from symptom logs
      const symptomCount = await SymptomLog.countDocuments({ episodeId });
      dayOfIllness = symptomCount + 1;
    }

    // Call Flask ML API
    const mlResponse = await axios.post("https://backend-fever-care-ai.onrender.com/predict", {
      temperature,
      fever_days: dayOfIllness,
      headache,
      body_pain,
      eye_pain,
      nausea_vomiting,
      abdominal_pain,
      rash,
      bleeding,
      platelet_count,
      mosquito_exposure,
      travel
    });

    const mlData = mlResponse.data;

    if (mlData.status !== 'success') {  // CORRECT
        throw new Error("ML prediction failed");
      }

    // Get FeFCon recommendation
    const fefcon = getFefconRecommendation(
      mlData.prediction,
      mlData.confidence,
      dayOfIllness,
      history
    );

    // Save to database
    const mlPrediction = new MLPrediction({
      symptomLogId: symptomLogId || null,
      episodeId: episodeId || null,
      dengueProbability: mlData.all_probabilities.Dengue || 0,
      typhoidProbability: mlData.all_probabilities.Typhoid || 0,
      malariaProbability: mlData.all_probabilities.Malaria || 0,
      viralProbability: mlData.all_probabilities.Viral || 0,
      primaryDiagnosis: mlData.prediction.toLowerCase(),
      confidenceScore: mlData.confidence,
      urgency: fefcon.urgency,
      fefconRecommendation: fefcon.recommendation,
      investigationsNeeded: fefcon.investigations,
      keyFeatures: [],
      modelVersion: "v2.0"
    });

    await mlPrediction.save();

    // Create alert if urgent
    if (["HIGH", "EMERGENCY", "CRITICAL"].includes(fefcon.urgency)) {
      const alert = new Alert({
        patientId: patientId || null,
        alertType: fefcon.urgency === "EMERGENCY" ? "danger_sign" : "critical_symptom",
        severity: fefcon.urgency === "EMERGENCY" ? "critical" : "high",
        message: fefcon.recommendation,
        actionRequired: true,
        metadata: {
          predictionId: mlPrediction._id,
          diagnosis: mlData.prediction,
          confidence: mlData.confidence,
          redFlags: fefcon.redFlags
        }
      });
      await alert.save();
    }

    // Response
    res.json({
      success: true,
      predictionId: mlPrediction._id,
      prediction: mlData.prediction,
      confidence: mlData.confidence,
      urgency: fefcon.urgency,
      fefcon_recommendation: fefcon.recommendation,
      investigations_needed: fefcon.investigations,
      red_flags: fefcon.redFlags,
      monitoring_plan: fefcon.monitoring,
      all_probabilities: mlData.all_probabilities,
      top_3_predictions: mlData.top_3_predictions,
      input_summary: {
        temperature,
        fever_days: dayOfIllness,
        day_of_illness: dayOfIllness,
        key_symptoms: [
          headache && "headache",
          body_pain && "body_pain",
          eye_pain && "eye_pain",
          nausea_vomiting && "nausea",
          abdominal_pain && "abdominal_pain",
          rash && "rash",
          bleeding && "bleeding"
        ].filter(Boolean)
      },
      medical_context: history
    });

  } catch (error) {
    console.error("ML Prediction Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;