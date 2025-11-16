const express = require("express");
const auth = require("../middlewares/auth");
const {
  User,
  PatientProfile,
  FeverEpisode,
  SymptomLog,
  EpisodeHistory,
  MLPrediction,
  Alert,
  Medication,
} = require("../models");

const MedicationLog = require("../models/MedicationLog");

const router = express.Router();

// Middleware to check if user is clinician
const checkClinicianRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "clinician") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Clinician role required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Apply clinician check to all routes
router.use(auth, checkClinicianRole);

// ===== GET DASHBOARD OVERVIEW =====
router.get("/dashboard", async (req, res) => {
  try {
    // Get all patients with active episodes
    const activeEpisodes = await FeverEpisode.find({ status: "active" })
      .populate("patientId", "name email phone")
      .lean();

    // Get patient profiles
    const patientIds = activeEpisodes.map((ep) => ep.patientId._id);
    const profiles = await PatientProfile.find({
      userId: { $in: patientIds },
    }).lean();

    // Get latest predictions for each episode
    const episodeIds = activeEpisodes.map((ep) => ep._id);
    const predictions = await MLPrediction.find({
      episodeId: { $in: episodeIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get latest symptom logs
    const symptomLogs = await SymptomLog.find({
      episodeId: { $in: episodeIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Build patient list with risk scores
    const patients = activeEpisodes.map((episode) => {
      const profile = profiles.find(
        (p) => p.userId.toString() === episode.patientId._id.toString()
      );
      const latestPrediction = predictions.find(
        (p) => p.episodeId.toString() === episode._id.toString()
      );
      const latestSymptom = symptomLogs.find(
        (s) => s.episodeId.toString() === episode._id.toString()
      );

      // Calculate risk score
      let riskScore = 0;
      if (latestPrediction) {
        if (latestPrediction.urgency === "EMERGENCY") riskScore = 95;
        else if (latestPrediction.urgency === "HIGH") riskScore = 80;
        else if (latestPrediction.urgency === "MEDIUM") riskScore = 60;
        else riskScore = 30;
      }

      // Determine status
      let status = "active";
      if (latestSymptom) {
        if (latestSymptom.temperature > 104) status = "critical";
        else if (latestSymptom.temperature > 102) status = "high";
        else if (latestSymptom.temperature > 100) status = "moderate";
        else status = "mild";
      }

      return {
        id: episode.patientId._id,
        full_name: episode.patientId.name,
        age: profile?.age || 0,
        status: status,
        risk_score: riskScore,
        updated_at: latestSymptom?.createdAt || episode.updatedAt,
        phone: episode.patientId.phone || "N/A",
        episodeId: episode._id,
        temperature: latestSymptom?.temperature,
        diagnosis: latestPrediction?.primaryDiagnosis,
      };
    });

    // Get unread alerts
    const unreadAlerts = await Alert.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      patients: patients,
      alerts: unreadAlerts.map((a) => ({
        id: a._id,
        message: a.message,
        severity: a.severity,
        is_read: a.isRead,
        created_at: a.createdAt,
      })),
      stats: {
        totalPatients: patients.length,
        highRiskCount: patients.filter((p) => p.risk_score > 70).length,
        criticalCount: patients.filter((p) => p.status === "critical").length,
        unreadAlertsCount: unreadAlerts.length,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET PATIENT DETAILS =====
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient user
    const user = await User.findById(patientId).select("-password").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Patient not found" });
    }

    // Get patient profile
    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: patientId,
      status: "active",
    }).lean();

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: "No active episode found for this patient",
      });
    }

    // Get episode history
    const history = await EpisodeHistory.findOne({
      episodeId: episode._id,
    }).lean();

    // Get all symptom logs
    const symptomLogs = await SymptomLog.find({ episodeId: episode._id })
      .sort({ dayOfIllness: 1, createdAt: 1 })
      .lean();

    // Get all predictions
    const predictions = await MLPrediction.find({ episodeId: episode._id })
      .sort({ createdAt: -1 })
      .lean();

    // Get medications
    const medications = await Medication.find({
      patientId: patientId,
      isActive: true,
    })
      .populate("prescribedBy", "name")
      .lean();

    // Get alerts for this patient
    const alerts = await Alert.find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate day of illness
    const startDate = new Date(episode.startedAt);
    const currentDate = new Date();
    const dayOfIllness = Math.ceil(
      (currentDate - startDate) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      patient: {
        id: user._id,
        full_name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        age: profile?.age || 0,
        gender: profile?.gender || "other",
        bloodGroup: profile?.bloodGroup || "Unknown",
        location: profile?.location || {},
      },
      episode: {
        id: episode._id,
        startedAt: episode.startedAt,
        status: episode.status,
        dayOfIllness: dayOfIllness,
      },
      history: history || {},
      symptomLogs: symptomLogs,
      predictions: predictions,
      medications: medications,
      alerts: alerts,
      latestPrediction: predictions[0] || null,
      latestSymptom: symptomLogs[symptomLogs.length - 1] || null,
    });
  } catch (error) {
    console.error("Patient details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== MARK ALERT AS READ =====
router.put("/alerts/:alertId/read", async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET ALL ALERTS =====
router.get("/alerts", async (req, res) => {
  try {
    const { status = "all", limit = 50 } = req.query;

    let query = {};
    if (status === "unread") {
      query.isRead = false;
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      alerts: alerts.map((a) => ({
        id: a._id,
        message: a.message,
        severity: a.severity,
        is_read: a.isRead,
        created_at: a.createdAt,
        patientId: a.patientId,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PRESCRIBE MEDICATION =====
router.post("/patient/:patientId/medication", async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      medicationName,
      dosage,
      frequency,
      instructions,
      startDate,
      endDate,
    } = req.body;

    const medication = await Medication.create({
      patientId,
      prescribedBy: req.userId, // Clinician ID
      medicationName,
      dosage,
      frequency,
      instructions: instructions || null,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true,
      prescribedDate: new Date(),
    });

    await medication.populate("prescribedBy", "name");

    res.status(201).json({ success: true, medication });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== UPDATE MEDICATION =====
router.put("/medication/:medicationId", async (req, res) => {
  try {
    const { medicationId } = req.params;
    const updates = req.body;

    const medication = await Medication.findByIdAndUpdate(
      medicationId,
      updates,
      { new: true }
    ).populate("prescribedBy", "name");

    if (!medication) {
      return res
        .status(404)
        .json({ success: false, error: "Medication not found" });
    }

    res.json({ success: true, medication });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== DELETE MEDICATION =====
router.delete("/medication/:medicationId", async (req, res) => {
  try {
    const { medicationId } = req.params;

    const medication = await Medication.findByIdAndDelete(medicationId);

    if (!medication) {
      return res
        .status(404)
        .json({ success: false, error: "Medication not found" });
    }

    res.json({ success: true, message: "Medication deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET MEDICATIONS FOR PATIENT =====
router.get("/patient/:patientId/medications", async (req, res) => {
  try {
    const { patientId } = req.params;

    const medications = await Medication.find({ patientId })
      .populate("prescribedBy", "name")
      .sort({ prescribedDate: -1 });

    res.json({ success: true, medications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET MEDICATION LOGS FOR PATIENT =====
router.get("/patient/:patientId/medication-logs", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await MedicationLog.find({ patientId })
      .populate("medicationId", "medicationName dosage")
      .sort({ takenAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET ANALYTICS DATA =====
router.get("/analytics", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    if (period === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === "90d") {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Get episodes created in period
    const episodes = await FeverEpisode.find({
      startedAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Get predictions
    const predictions = await MLPrediction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Aggregate diagnosis counts
    const diagnosisCounts = {};
    predictions.forEach((p) => {
      diagnosisCounts[p.primaryDiagnosis] =
        (diagnosisCounts[p.primaryDiagnosis] || 0) + 1;
    });

    // Get symptom logs for trends
    const symptomLogs = await SymptomLog.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      analytics: {
        totalEpisodes: episodes.length,
        diagnosisDistribution: diagnosisCounts,
        temperatureTrend: symptomLogs.map((s) => ({
          date: s.createdAt,
          temperature: s.temperature,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EXPORT PATIENTS =====
router.post("/export", async (req, res) => {
  try {
    const { patientIds } = req.body;

    const patients = await User.find({
      _id: { $in: patientIds },
    })
      .select("-password")
      .lean();

    const profiles = await PatientProfile.find({
      userId: { $in: patientIds },
    }).lean();

    const exportData = patients.map((p) => {
      const profile = profiles.find(
        (pr) => pr.userId.toString() === p._id.toString()
      );
      return {
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone || "N/A",
        age: profile?.age || "N/A",
        gender: profile?.gender || "N/A",
        bloodGroup: profile?.bloodGroup || "N/A",
      };
    });

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/patient/:patientId/ai-analysis", async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient user
    const user = await User.findById(patientId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Get patient profile
    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: patientId,
      status: 'active'
    }).lean();

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'No active episode found for this patient'
      });
    }

    // Get episode history
    const history = await EpisodeHistory.findOne({ episodeId: episode._id }).lean();

    // Get latest symptom log
    const latestSymptom = await SymptomLog.findOne({ episodeId: episode._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestSymptom) {
      return res.status(404).json({
        success: false,
        error: 'No symptoms logged yet'
      });
    }

    // Get latest prediction
    const latestPrediction = await MLPrediction.findOne({ episodeId: episode._id })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate day of illness
    const startDate = new Date(episode.startedAt);
    const currentDate = new Date();
    const dayOfIllness = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));

    // Build response similar to patient's advanced-ai-data
    const responseData = {
      patient: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'N/A',
        age: profile?.age || 0,
        gender: profile?.gender || 'other',
        bloodGroup: profile?.bloodGroup || 'Unknown',
        location: profile?.location || { city: 'Unknown', state: 'Unknown' }
      },
      episode: {
        _id: episode._id,
        startedAt: episode.startedAt,
        status: episode.status,
        dayOfIllness: dayOfIllness
      },
      symptoms: {
        temperature: latestSymptom.temperature,
        dayOfIllness: latestSymptom.dayOfIllness,
        headache: latestSymptom.headache,
        bodyPain: latestSymptom.bodyPain,
        eyePain: latestSymptom.eyePain,
        vomiting: latestSymptom.vomiting,
        rash: latestSymptom.rash,
        bleeding: latestSymptom.bleeding,
        abdominalPain: latestSymptom.abdominalPain,
        pulseRate: latestSymptom.pulseRate || 0,
        foodIntake: latestSymptom.foodIntake || 'normal',
        urineOutput: latestSymptom.urineOutput || 'normal'
      },
      history: history || {
        priorAntibiotics: false,
        hasDiabetes: false,
        immunocompromised: false,
        recentTravel: false,
        mosquitoExposure: false,
        feverPattern: 'continuous',
        highestTemperature: latestSymptom.temperature
      },
      latestPrediction: latestPrediction
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/patient/:patientId/alert", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { message, severity, alertType } = req.body;

    if (!message || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Message and severity are required'
      });
    }

    const alert = await Alert.create({
      patientId,
      alertType: alertType || 'checkup_due',
      severity,
      message,
      isRead: false,
      actionRequired: severity === 'critical' || severity === 'high',
      metadata: {
        sentBy: 'clinician',
        clinicianId: req.userId,
        sentAt: new Date()
      }
    });

    res.status(201).json({ success: true, alert });
  } catch (error) {
    console.error('Send alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GET ALERTS FROM PATIENT =====
router.get("/alerts/from-patients", async (req, res) => {
  try {
    const alerts = await Alert.find({
      'metadata.sentBy': 'patient',
      isRead: false
    })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== MARK ALERT AS READ =====
router.put("/alerts/:alertId/read", async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
