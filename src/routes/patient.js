const express = require('express');
const auth = require('../middlewares/auth');
const {
  User,
  PatientProfile,
  FeverEpisode,
  SymptomLog,
  EpisodeHistory,
  Medication,
  Alert,
  MLPrediction,
} = require('../models');

const router = express.Router();

// ===== DASHBOARD =====
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: req.userId,
      status: 'active',
    }).sort({ startedAt: -1 });

    if (!episode) {
      return res.json({
        success: true,
        user: {
          name: user.name,
          email: user.email,
        },
        hasActiveEpisode: false,
      });
    }

    // Get symptom logs for episode
    const symptomLogs = await SymptomLog.find({
      episodeId: episode._id,
    }).sort({ dayOfIllness: 1 });

    // Get latest prediction
    const latestPrediction = await MLPrediction.findOne({
      episodeId: episode._id,
    }).sort({ createdAt: -1 });

    // Get active medications
    const medications = await Medication.find({
      patientId: req.userId,
      isActive: true,
    }).populate('prescribedBy', 'name');

    // Get unread alerts
    const alerts = await Alert.find({
      patientId: req.userId,
      isRead: false,
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      hasActiveEpisode: true,
      episode,
      symptomLogs,
      latestPrediction,
      medications,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== START EPISODE =====
router.post('/episode/start', auth, async (req, res) => {
  try {
    // Check for active episode
    const existing = await FeverEpisode.findOne({
      patientId: req.userId,
      status: 'active',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active fever episode',
      });
    }

    // Create episode
    const episode = await FeverEpisode.create({
      patientId: req.userId,
      status: 'active',
      startedAt: new Date(),
    });

    res.status(201).json({ success: true, episode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SUBMIT EPISODE HISTORY =====
router.post('/episode/:episodeId/history', auth, async (req, res) => {
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
router.post('/symptom-log', auth, async (req, res) => {
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
router.get('/temperature-trend/:episodeId', auth, async (req, res) => {
  try {
    const temperatures = await SymptomLog.find({
      episodeId: req.params.episodeId,
      patientId: req.userId,
    })
      .select('dayOfIllness temperature tempTime createdAt')
      .sort({ dayOfIllness: 1 });

    res.json({ success: true, data: temperatures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET MEDICATIONS =====
router.get('/medications', auth, async (req, res) => {
  try {
    const medications = await Medication.find({
      patientId: req.userId,
      isActive: true,
    }).populate('prescribedBy', 'name email');

    res.json({ success: true, medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MARK ALERT AS READ =====
router.put('/alerts/:alertId/read', auth, async (req, res) => {
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
router.put('/episode/:episodeId/resolve', auth, async (req, res) => {
  try {
    const episode = await FeverEpisode.findByIdAndUpdate(
      req.params.episodeId,
      {
        status: 'resolved',
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
    if (history?.waterSource === 'tap' || history?.waterSource === 'outside') {
      typhoidProbability += 20;
    }

    // Normalize
    const total = dengueProbability + typhoidProbability + viralProbability;
    dengueProbability = (dengueProbability / total) * 100;
    typhoidProbability = (typhoidProbability / total) * 100;
    viralProbability = (viralProbability / total) * 100;

    let primaryDiagnosis = 'viral';
    let confidenceScore = viralProbability;

    if (dengueProbability > typhoidProbability && dengueProbability > viralProbability) {
      primaryDiagnosis = 'dengue';
      confidenceScore = dengueProbability;
    } else if (typhoidProbability > dengueProbability && typhoidProbability > viralProbability) {
      primaryDiagnosis = 'typhoid';
      confidenceScore = typhoidProbability;
    }

    // Urgency
    let urgency = 'LOW';
    if (symptomLog.bleeding || symptomLog.breathlessness || symptomLog.confusion) {
      urgency = 'EMERGENCY';
    } else if (symptomLog.temperature > 104) {
      urgency = 'HIGH';
    } else if (symptomLog.temperature > 102) {
      urgency = 'MEDIUM';
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
      modelVersion: 'v1.0',
    });

    // Create alert if emergency
    if (urgency === 'EMERGENCY') {
      await Alert.create({
        patientId: symptomLog.patientId,
        alertType: 'danger_sign',
        severity: 'critical',
        message: 'URGENT: Seek immediate medical attention!',
        actionRequired: true,
      });
    }
  } catch (error) {
    console.error('ML Prediction error:', error);
  }
}

module.exports = router;
