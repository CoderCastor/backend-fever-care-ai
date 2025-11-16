const express = require("express");
const auth = require("../middlewares/auth");
const {
  User,
  PatientProfile,
  FeverEpisode,
  SymptomLog,
  EpisodeHistory,
  Medication,
  Alert,
  MLPrediction,
} = require("../models");

const router = express.Router();

// ===== DASHBOARD =====
router.get("/dashboard", auth, async (req, res) => {
  try {
    // Get user info
    const user = await User.findById(req.userId).select("-password");

    // Check for active episode
    const episode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    });

    const hasActiveEpisode = !!episode;

    let symptomLogs = [];
    let latestPrediction = null;
    let medications = [];
    let alerts = [];

    if (episode) {
      // Get symptom logs
      symptomLogs = await SymptomLog.find({ episodeId: episode._id }).sort({
        createdAt: -1,
      });

      // Get latest prediction
      latestPrediction = await MLPrediction.findOne({
        episodeId: episode._id,
      }).sort({ createdAt: -1 });

      // ✅ GET MEDICATIONS FOR THIS PATIENT
      medications = await Medication.find({
        patientId: req.userId,
        isActive: true,
      })
        .populate("prescribedBy", "name email")
        .sort({ createdAt: -1 });

      // Get alerts from clinician
      alerts = await Alert.find({
        patientId: req.userId,
        "metadata.sentBy": "clinician",
      })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      hasActiveEpisode,
      episode,
      symptomLogs,
      latestPrediction,
      medications, // ✅ NOW INCLUDED
      alerts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get patient data for Advanced AI
router.get("/advanced-ai-data", auth, async (req, res) => {
  try {
    // Get user from token
    const user = await User.findById(req.userId).select("-password");

    // Get patient profile
    const profile = await PatientProfile.findOne({ userId: req.userId });

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    }).sort({ startedAt: -1 });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: "No active fever episode found",
      });
    }

    // Get episode history
    const history = await EpisodeHistory.findOne({ episodeId: episode._id });

    // Get latest symptom log
    const latestSymptom = await SymptomLog.findOne({
      episodeId: episode._id,
      patientId: req.userId,
    }).sort({ dayOfIllness: -1 });

    // Calculate day of illness
    const startDate = new Date(episode.startedAt);
    const currentDate = new Date();
    const dayOfIllness = Math.ceil(
      (currentDate - startDate) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      data: {
        patient: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          age: profile?.age || 0,
          gender: profile?.gender || "other",
          bloodGroup: profile?.bloodGroup || "Unknown",
          location: {
            city: profile?.location?.city || "Unknown",
            state: profile?.location?.state || "Unknown",
          },
        },
        episode: {
          _id: episode._id,
          startedAt: episode.startedAt,
          status: episode.status,
          dayOfIllness: dayOfIllness,
        },
        history: {
          priorAntibiotics: history?.priorAntibiotics || false,
          antibioticName: history?.antibioticName || "",
          hasDiabetes: history?.hasDiabetes || false,
          immunocompromised: history?.immunocompromised || false,
          recentTravel: history?.recentTravel || false,
          mosquitoExposure: history?.mosquitoExposure || false,
          feverPattern: history?.feverPattern || "continuous",
          highestTemperature: history?.highestTemperature || 0,
          measurementMethod: history?.measurementMethod || "digital",
        },
        symptoms: latestSymptom
          ? {
              dayOfIllness: latestSymptom.dayOfIllness,
              temperature: latestSymptom.temperature,
              pulseRate: latestSymptom.pulseRate || 0,
              headache: latestSymptom.headache,
              bodyPain: latestSymptom.bodyPain,
              eyePain: latestSymptom.headache, // Use headache as proxy
              rash: latestSymptom.rash,
              bleeding: latestSymptom.bleeding,
              abdominalPain: latestSymptom.abdominalPain,
              vomiting: latestSymptom.vomiting,
              foodIntake: latestSymptom.foodIntake || "normal",
              urineOutput: latestSymptom.urineOutput || "normal",
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== START EPISODE =====
router.post("/episode/start", auth, async (req, res) => {
  try {
    // Check for active episode
    const existing = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have an active fever episode",
      });
    }

    // Create episode
    const episode = await FeverEpisode.create({
      patientId: req.userId,
      status: "active",
      startedAt: new Date(),
    });

    res.status(201).json({ success: true, episode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SUBMIT EPISODE HISTORY =====
router.post("/episode/:episodeId/history", auth, async (req, res) => {
  try {
    const {
      priorAntibiotics,
      antibioticName,
      hasDiabetes,
      immunocompromised,
      isPregnant,
      recentTravel,
      travelLocation,
      mosquitoExposure,
      sickContacts,
      waterSource,
      feverPattern,
      measurementMethod,
    } = req.body;

    const history = await EpisodeHistory.create({
      episodeId: req.params.episodeId,
      priorAntibiotics,
      antibioticName,
      hasDiabetes,
      immunocompromised,
      isPregnant,
      recentTravel,
      travelLocation,
      mosquitoExposure,
      sickContacts,
      waterSource,
      feverPattern,
      measurementMethod,
    });

    res.status(201).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== LOG DAILY SYMPTOMS =====
router.post("/symptom-log", auth, async (req, res) => {
  try {
    const symptomLog = await SymptomLog.create({
      patientId: req.userId,
      episodeId: req.body.episodeId,
      dayOfIllness: req.body.dayOfIllness,
      logDate: new Date(),
      temperature: req.body.temperature,
      tempTime: req.body.tempTime,
      pulseRate: req.body.pulseRate,
      headache: req.body.headache,
      bodyPain: req.body.bodyPain,
      rash: req.body.rash,
      rashLocation: req.body.rashLocation,
      bleeding: req.body.bleeding,
      bleedingSite: req.body.bleedingSite,
      abdominalPain: req.body.abdominalPain,
      vomiting: req.body.vomiting,
      vomitingCount: req.body.vomitingCount,
      breathlessness: req.body.breathlessness,
      confusion: req.body.confusion,
      nausea: req.body.nausea,
      foodIntake: req.body.foodIntake,
      urineOutput: req.body.urineOutput,
      paracetamolTaken: req.body.paracetamolTaken,
      paracetamolResponse: req.body.paracetamolResponse,
      notes: req.body.notes,
    });

    // Generate ML prediction
    await generateMLPrediction(symptomLog._id, req.body.episodeId);

    res.status(201).json({ success: true, symptomLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET TEMPERATURE TREND =====
router.get("/temperature-trend/:episodeId", auth, async (req, res) => {
  try {
    const temperatures = await SymptomLog.find({
      episodeId: req.params.episodeId,
      patientId: req.userId,
    })
      .select("dayOfIllness temperature tempTime createdAt")
      .sort({ dayOfIllness: 1 });

    res.json({ success: true, data: temperatures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET MEDICATIONS =====
router.get("/medications", auth, async (req, res) => {
  try {
    const medications = await Medication.find({
      patientId: req.userId,
      isActive: true,
    }).populate("prescribedBy", "name email");

    res.json({ success: true, medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MARK ALERT AS READ =====
router.put("/alerts/:alertId/read", auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== RESOLVE EPISODE =====
router.put("/episode/:episodeId/resolve", auth, async (req, res) => {
  try {
    const episode = await FeverEpisode.findByIdAndUpdate(
      req.params.episodeId,
      {
        status: "resolved",
        endedAt: new Date(),
        finalDiagnosis: req.body.finalDiagnosis,
        labConfirmed: req.body.labConfirmed,
      },
      { new: true }
    );

    res.json({ success: true, episode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ML PREDICTION HELPER =====
async function generateMLPrediction(symptomLogId, episodeId) {
  try {
    const symptomLog = await SymptomLog.findById(symptomLogId);
    const history = await EpisodeHistory.findOne({ episodeId });

    // Simple rule-based logic
    let dengueProbability = 0;
    let typhoidProbability = 0;
    let viralProbability = 30;

    // Dengue scoring
    if (symptomLog.headache && symptomLog.bodyPain) dengueProbability += 25;
    if (symptomLog.temperature > 102) dengueProbability += 20;
    if (symptomLog.rash) dengueProbability += 20;
    if (symptomLog.bleeding) dengueProbability += 25;
    if (history?.mosquitoExposure) dengueProbability += 10;

    // Typhoid scoring
    if (symptomLog.temperature > 103) typhoidProbability += 30;
    if (symptomLog.abdominalPain) typhoidProbability += 25;
    if (history?.waterSource === "tap" || history?.waterSource === "outside") {
      typhoidProbability += 20;
    }

    // Normalize
    const total = dengueProbability + typhoidProbability + viralProbability;
    dengueProbability = (dengueProbability / total) * 100;
    typhoidProbability = (typhoidProbability / total) * 100;
    viralProbability = (viralProbability / total) * 100;

    let primaryDiagnosis = "viral";
    let confidenceScore = viralProbability;

    if (
      dengueProbability > typhoidProbability &&
      dengueProbability > viralProbability
    ) {
      primaryDiagnosis = "dengue";
      confidenceScore = dengueProbability;
    } else if (
      typhoidProbability > dengueProbability &&
      typhoidProbability > viralProbability
    ) {
      primaryDiagnosis = "typhoid";
      confidenceScore = typhoidProbability;
    }

    // Urgency
    let urgency = "LOW";
    if (
      symptomLog.bleeding ||
      symptomLog.breathlessness ||
      symptomLog.confusion
    ) {
      urgency = "EMERGENCY";
    } else if (symptomLog.temperature > 104) {
      urgency = "HIGH";
    } else if (symptomLog.temperature > 102) {
      urgency = "MEDIUM";
    }

    await MLPrediction.create({
      symptomLogId,
      episodeId,
      dengueProbability: dengueProbability.toFixed(2),
      typhoidProbability: typhoidProbability.toFixed(2),
      viralProbability: viralProbability.toFixed(2),
      primaryDiagnosis,
      confidenceScore: confidenceScore.toFixed(2),
      urgency,
      modelVersion: "v1.0",
    });

    // Create alert if emergency
    if (urgency === "EMERGENCY") {
      await Alert.create({
        patientId: symptomLog.patientId,
        alertType: "danger_sign",
        severity: "critical",
        message: "URGENT: Seek immediate medical attention!",
        actionRequired: true,
      });
    }
  } catch (error) {
    console.error("ML Prediction error:", error);
  }
}

router.post("/symptoms/quick", auth, async (req, res) => {
  try {
    const { symptoms, temperature, tempTime, notes } = req.body; // ✅ ADD tempTime

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: "No active episode. Please start an episode first.",
      });
    }

    // Calculate day of illness
    const startDate = new Date(episode.startedAt);
    const currentDate = new Date();

    // Reset time parts for accurate day calculation
    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    let dayOfIllness =
      Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    console.log(
      `Creating symptom log for Day ${dayOfIllness}, Time: ${
        tempTime || "unknown"
      }`
    );

    // Create symptom log
    const symptomLog = await SymptomLog.create({
      episodeId: episode._id,
      patientId: req.userId,
      dayOfIllness,
      temperature: temperature || null,
      tempTime: tempTime || "unknown", // ✅ ADD THIS
      notes: notes || "",
      headache: symptoms.some((s) =>
        s.symptom_type.toLowerCase().includes("headache")
      ),
      bodyPain: symptoms.some((s) =>
        s.symptom_type.toLowerCase().includes("body ache")
      ),
      nausea: symptoms.some((s) =>
        s.symptom_type.toLowerCase().includes("nausea")
      ),
      logDate: new Date(),
    });

    res.status(201).json({
      success: true,
      symptomLog,
      dayOfIllness,
      message: `Symptoms logged for Day ${dayOfIllness} (${
        tempTime || "unknown"
      })`,
    });
  } catch (error) {
    console.error("Quick symptoms error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET MY MEDICATIONS =====
router.get("/medications", auth, async (req, res) => {
  try {
    const medications = await Medication.find({
      patientId: req.userId,
      isActive: true,
    })
      .populate("prescribedBy", "name")
      .sort({ prescribedDate: -1 });

    res.json({ success: true, medications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== LOG MEDICATION INTAKE =====
router.post("/medication-log", auth, async (req, res) => {
  try {
    const { medicationId, notes } = req.body;

    // Verify medication belongs to patient
    const medication = await Medication.findOne({
      _id: medicationId,
      patientId: req.userId,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        error: "Medication not found",
      });
    }

    const log = await MedicationLog.create({
      medicationId,
      patientId: req.userId,
      takenAt: new Date(),
      notes: notes || null,
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET MEDICATION LOGS =====
router.get("/medication-logs", auth, async (req, res) => {
  try {
    const logs = await MedicationLog.find({ patientId: req.userId })
      .populate("medicationId", "medicationName dosage")
      .sort({ takenAt: -1 });

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET TODAY'S LOGS FOR A MEDICATION =====
router.get("/medication-logs/:medicationId/today", auth, async (req, res) => {
  try {
    const { medicationId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await MedicationLog.find({
      medicationId,
      patientId: req.userId,
      takenAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ takenAt: -1 });

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Start new episode with medical history
router.post("/episode/start-with-history", auth, async (req, res) => {
  try {
    const {
      priorAntibiotics,
      antibioticName,
      hasDiabetes,
      immunocompromised,
      isPregnant,
      recentTravel,
      travelLocation,
      mosquitoExposure,
      sickContacts,
      waterSource,
    } = req.body;

    // Check for existing active episode
    const existingEpisode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    });

    if (existingEpisode) {
      return res.status(400).json({
        success: false,
        message: "You already have an active fever episode",
      });
    }

    // Create new episode
    const episode = await FeverEpisode.create({
      patientId: req.userId,
      status: "active",
      startedAt: new Date(),
    });

    // Create episode history
    const history = await EpisodeHistory.create({
      episodeId: episode._id,
      priorAntibiotics,
      antibioticName: antibioticName || null,
      hasDiabetes,
      immunocompromised,
      isPregnant,
      recentTravel,
      travelLocation: travelLocation || null,
      mosquitoExposure,
      sickContacts,
      waterSource,
    });

    res.status(201).json({
      success: true,
      episode,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Log daily symptoms
router.post("/symptoms/daily", auth, async (req, res) => {
  try {
    const {
      episodeId,
      dayOfIllness,
      temperature,
      tempTime,
      pulseRate,
      symptoms,
      foodIntake,
      urineOutput,
    } = req.body;

    // Verify episode belongs to user
    const episode = await FeverEpisode.findOne({
      _id: episodeId,
      patientId: req.userId,
    });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: "Episode not found",
      });
    }

    // Create symptom log
    const symptomLog = await SymptomLog.create({
      episodeId,
      patientId: req.userId,
      dayOfIllness,
      temperature,
      tempTime,
      pulseRate: pulseRate || null,
      headache: symptoms.headache,
      bodyPain: symptoms.bodyPain,
      rash: symptoms.rash,
      rashLocation: symptoms.rashLocation || null,
      bleeding: symptoms.bleeding,
      bleedingSite: symptoms.bleedingSite || null,
      abdominalPain: symptoms.abdominalPain,
      vomiting: symptoms.vomiting,
      vomitingCount: symptoms.vomitingCount || null,
      breathlessness: symptoms.breathlessness,
      confusion: symptoms.confusion,
      nausea: symptoms.nausea || false,
      foodIntake,
      urineOutput,
      logDate: new Date(),
    });

    // Generate ML prediction
    await generateMLPrediction(symptomLog._id, episodeId);

    res.status(201).json({
      success: true,
      symptomLog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Get active episode with current day
router.get("/episode/active", auth, async (req, res) => {
  try {
    const episode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: "active",
    }).sort({ startedAt: -1 });

    if (!episode) {
      return res.json({
        success: true,
        hasActiveEpisode: false,
      });
    }

    // Calculate day of illness
    const startDate = new Date(episode.startedAt);
    const currentDate = new Date();
    const dayOfIllness = Math.ceil(
      (currentDate - startDate) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      hasActiveEpisode: true,
      episode: {
        _id: episode._id,
        startedAt: episode.startedAt,
        status: episode.status,
        dayOfIllness,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SEND ALERT TO CLINICIAN =====
router.post("/alert/send", auth, async (req, res) => {
  try {
    const { message, severity } = req.body;

    if (!message || !severity) {
      return res.status(400).json({
        success: false,
        error: "Message and severity are required",
      });
    }

    const alert = await Alert.create({
      patientId: req.userId,
      alertType: "checkup_due",
      severity,
      message,
      isRead: false,
      actionRequired: severity === "critical" || severity === "high",
      metadata: {
        sentBy: "patient",
        patientId: req.userId,
        sentAt: new Date(),
      },
    });

    res.status(201).json({ success: true, alert });
  } catch (error) {
    console.error("Send alert error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET MY ALERTS =====
router.get("/alerts", auth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      patientId: req.userId,
      "metadata.sentBy": "clinician",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== MARK ALERT AS READ =====
router.put("/alerts/:alertId/read", auth, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, patientId: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: "Alert not found" });
    }

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
