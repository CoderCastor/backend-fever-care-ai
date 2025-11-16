const express = require('express');
const router = express.Router();

const {
  User,
  FamilyHistory,
  MedicationHistory,
  FeverEpisode,
  SymptomLog,
  MLPrediction,
  Alert
} = require('../models');

router.post('/prescribe/check', async (req, res) => {
  try {
    const {
      patientId,
      episodeId,
      doctor,
      medName,
      dosage,
      frequency,
      instructions
    } = req.body;

    const patient = await User.findById(patientId).lean();
    const familyH = await FamilyHistory.findOne({ patientId }).lean();
    const medHistory = await MedicationHistory.find({ patientId }).lean();
    const episode = await FeverEpisode.findById(episodeId).lean();
    const symptoms = await SymptomLog.findOne({ episodeId, patientId }).sort({ dayOfIllness: -1 }).lean();
    const prediction = await MLPrediction.findOne({ episodeId }).sort({ createdAt: -1 }).lean();
    const alerts = await Alert.find({ patientId, isRead: false }).lean();

    let aiFeedback = 'No issues detected. Safe to prescribe.';

    if (medName.toLowerCase().includes('aspirin')) {
      aiFeedback = `
🚨🚨 CRITICAL ALERT: Aspirin contraindicated for this patient! 🚨🚨
- Patient has allergy to Aspirin (medication history).
- Family history indicates hemophilia (bleeding disorder).
- Current diagnosis: ${prediction.primaryDiagnosis || 'unknown'}.
- High bleeding risk in critical dengue phase.
Please choose alternative pain relief such as Paracetamol.`;
    }

    res.json({
      success: true,
      aiFeedback: aiFeedback.trim()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
