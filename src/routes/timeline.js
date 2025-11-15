const express = require('express');
const router = express.Router();
const {
  User, FeverEpisode, SymptomLog, MLPrediction, Alert,
  FamilyHistory, MedicationHistory, ContactTracing, DiseaseHotspot
} = require('../models');

// Get complete patient timeline (for case study demo)
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get active episode
    const episode = await FeverEpisode.findOne({
      patientId: patientId,
      status: 'active'
    }).sort({ startedAt: -1 });

    if (!episode) {
      return res.status(404).json({ error: 'No active episode' });
    }

    // Get all symptom logs (chronological)
    const symptoms = await SymptomLog.find({ episodeId: episode._id })
      .sort({ dayOfIllness: 1 });

    // Get all ML predictions
    const predictions = await MLPrediction.find({ episodeId: episode._id })
      .sort({ createdAt: 1 });

    // Get all alerts
    const alerts = await Alert.find({ patientId: patientId })
      .sort({ createdAt: 1 });

    // Get family history
    const familyHistory = await FamilyHistory.findOne({ patientId: patientId });

    // Get medication history
    const medicationHistory = await MedicationHistory.find({ patientId: patientId });

    // Get contact tracing
    const contacts = await ContactTracing.find({ episodeId: episode._id });

    // Build timeline events
    const timeline = [];

    // Day 1
    if (symptoms[0]) {
      timeline.push({
        day: 1,
        date: symptoms[0].logDate,
        type: 'symptom',
        title: 'Initial Symptoms',
        description: `Fever ${symptoms[0].temperature}°F, ${symptoms[0].headache ? 'headache' : 'no headache'}`,
        severity: 'low',
        icon: '🤒',
        data: symptoms[0]
      });

      if (predictions[0]) {
        timeline.push({
          day: 1,
          date: predictions[0].createdAt,
          type: 'ai_prediction',
          title: 'AI Initial Assessment',
          description: `${predictions[0].primaryDiagnosis} (${predictions[0].confidenceScore.toFixed(0)}% confidence)`,
          severity: predictions[0].urgency.toLowerCase(),
          icon: '🤖',
          aiMessage: alerts[0]?.message || 'Monitor symptoms',
          data: predictions[0]
        });
      }

      timeline.push({
        day: 1,
        date: symptoms[0].logDate,
        type: 'doctor_action',
        title: 'Doctor Initial Diagnosis',
        description: '"Just viral fever, take rest and fluids"',
        severity: 'low',
        icon: '👨‍⚕️',
        doctorNote: 'Prescribed: Rest, Paracetamol 500mg TDS'
      });
    }

    // Day 3
    if (symptoms[1]) {
      timeline.push({
        day: 3,
        date: symptoms[1].logDate,
        type: 'symptom',
        title: 'Symptoms Worsening',
        description: `Fever ${symptoms[1].temperature}°F, body pain, severe headache`,
        severity: 'medium',
        icon: '🔥',
        data: symptoms[1]
      });

      if (predictions[1]) {
        timeline.push({
          day: 3,
          date: predictions[1].createdAt,
          type: 'ai_alert',
          title: 'AI Dengue Warning',
          description: `DENGUE ${predictions[1].confidenceScore.toFixed(0)}%! Order NS1 test`,
          severity: 'high',
          icon: '🚨',
          aiMessage: 'Dengue triad present. Immediate testing required!',
          recommendation: predictions[1].fefconRecommendation,
          data: predictions[1]
        });
      }

      timeline.push({
        day: 3,
        date: symptoms[1].logDate,
        type: 'lab_test',
        title: 'NS1 Test Ordered',
        description: 'NS1 Antigen Test - POSITIVE ✓',
        severity: 'high',
        icon: '🧪',
        result: 'POSITIVE'
      });

      timeline.push({
        day: 3,
        date: symptoms[1].logDate,
        type: 'diagnosis_confirmed',
        title: 'Dengue Confirmed',
        description: 'Lab-confirmed dengue infection',
        severity: 'high',
        icon: '✅'
      });
    }

    // Day 4 - CRITICAL!
    if (symptoms[2]) {
      timeline.push({
        day: 4,
        date: symptoms[2].logDate,
        type: 'critical_phase',
        title: 'CRITICAL PHASE - Day 4',
        description: `Fever ${symptoms[2].temperature}°F, rash, vomiting`,
        severity: 'critical',
        icon: '⚠️',
        data: symptoms[2]
      });

      // LIFE-SAVING AI INTERVENTION
      const criticalAlert = alerts.find(a => 
        a.severity === 'critical' && 
        a.message.includes('ASPIRIN')
      );

      if (criticalAlert) {
        timeline.push({
          day: 4,
          date: criticalAlert.createdAt,
          type: 'ai_intervention',
          title: '🛡️ AI LIFE-SAVING INTERVENTION',
          description: 'STOPPED Aspirin prescription!',
          severity: 'critical',
          icon: '🚨',
          lifeSaving: true,
          aiMessage: criticalAlert.message,
          reasons: [
            familyHistory?.hemophilia ? `⚠️ Family history: Father has HEMOPHILIA` : null,
            medicationHistory.find(m => m.medicationName === 'Aspirin')?.hadReaction ? `⛔ Patient ALLERGIC to Aspirin` : null,
            'Dengue Day 4 = HIGH bleeding risk',
            'Could have caused hemorrhagic dengue!'
          ].filter(Boolean),
          data: criticalAlert
        });
      }

      timeline.push({
        day: 4,
        date: symptoms[2].logDate,
        type: 'admission',
        title: 'ICU Admission',
        description: 'Patient admitted for monitoring',
        severity: 'high',
        icon: '🏥',
        action: 'CBC q6h monitoring started'
      });
    }

    // Contact tracing
    if (contacts.length > 0) {
      timeline.push({
        day: 4,
        date: contacts[0].createdAt,
        type: 'contact_tracing',
        title: 'Contact Tracing Initiated',
        description: `${contacts.length} colleagues notified`,
        severity: 'medium',
        icon: '📞',
        contacts: contacts.map(c => ({
          name: c.contactPersonName,
          relationship: c.relationship,
          notified: c.notified
        }))
      });
    }

    // Hotspot
    const hotspot = await DiseaseHotspot.findOne({
      disease: 'dengue',
      city: 'Pune',
      month: 11,
      year: 2025
    });

    if (hotspot) {
      timeline.push({
        day: 4,
        date: hotspot.createdAt,
        type: 'hotspot',
        title: 'Hotspot Mapped',
        description: `${hotspot.area}, ${hotspot.city} - ${hotspot.caseCount} cases`,
        severity: 'medium',
        icon: '🗺️',
        microLabs: {
          medicineRequired: hotspot.medicineRequired,
          quantityNeeded: hotspot.quantityNeeded,
          status: hotspot.distributionStatus
        },
        data: hotspot
      });
    }

    res.json({
      success: true,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      },
      episode: {
        id: episode._id,
        startedAt: episode.startedAt,
        diagnosis: episode.finalDiagnosis,
        confirmed: episode.labConfirmed
      },
      timeline: timeline,
      summary: {
        totalDays: symptoms.length,
        aiInterventions: timeline.filter(t => t.type.includes('ai')).length,
        lifeSaved: timeline.some(t => t.lifeSaving),
        contactsTraced: contacts.length,
        hotspotMapped: !!hotspot
      }
    });

  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get hotspot map data
router.get('/hotspots', async (req, res) => {
  try {
    const { disease, city, state } = req.query;

    const query = {};
    if (disease) query.disease = disease;
    if (city) query.city = city;
    if (state) query.state = state;

    const hotspots = await DiseaseHotspot.find(query)
      .sort({ severity: -1, caseCount: -1 });

    // Group by severity for Micro Labs
    const bySeverity = {
      critical: hotspots.filter(h => h.severity === 'critical'),
      high: hotspots.filter(h => h.severity === 'high'),
      medium: hotspots.filter(h => h.severity === 'medium'),
      low: hotspots.filter(h => h.severity === 'low')
    };

    res.json({
      success: true,
      total: hotspots.length,
      hotspots: hotspots,
      bySeverity: bySeverity,
      microLabsAction: {
        urgentDeliveries: bySeverity.critical.length + bySeverity.high.length,
        totalMedicineNeeded: hotspots.reduce((sum, h) => sum + (h.quantityNeeded || 0), 0)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
