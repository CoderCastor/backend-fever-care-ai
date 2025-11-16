const express = require("express");
const axios = require("axios");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/user");
const FeverEpisode = require("../models/FeverEpisode");
const SymptomLog = require("../models/SymptomLog");
const Medication = require("../models/Medication");
const MLPrediction = require("../models/MLPrediction");
const PatientProfile = require("../models/PatientProfile");
const EpisodeHistory = require("../models/EpisodeHistory");
const Alert = require("../models/Alert");
const Temperature = require("../models/Temperature");
const auth = require("../middlewares/auth");

const router = express.Router();

/**
 * Fetch comprehensive patient context for AI
 */
const getPatientContext = async (userId) => {
  console.log("\n=== 🔍 STARTING PATIENT CONTEXT FETCH ===");
  console.log("📋 User ID:", userId);

  try {
    const user = await User.findById(userId).select("name email phone role");
    console.log(
      "✅ User found:",
      user ? `${user.name} (${user.email})` : "❌ NOT FOUND"
    );

    if (!user) {
      return {
        error: "User not found",
        message: "Unable to fetch patient information",
      };
    }

    const patientProfile = await PatientProfile.findOne({ userId })
      .select(
        "age gender bloodGroup allergies chronicConditions riskScore status location"
      )
      .lean();
    console.log(
      "📊 Patient Profile:",
      patientProfile ? "✅ Found" : "⚠️ Not found"
    );

    const activeFeverEpisode = await FeverEpisode.findOne({
      patientId: userId,
      status: { $in: ["active", "monitoring", "escalated"] },
    })
      .sort({ startedAt: -1 })
      .populate("assignedClinician", "name")
      .lean();

    console.log(
      "🔥 Active Fever Episode:",
      activeFeverEpisode ? "✅ FOUND" : "⚠️ Not found"
    );

    const feverEpisode =
      activeFeverEpisode ||
      (await FeverEpisode.findOne({
        patientId: userId,
      })
        .sort({ startedAt: -1 })
        .populate("assignedClinician", "name")
        .lean());

    const episodeHistory = feverEpisode
      ? await EpisodeHistory.findOne({ episodeId: feverEpisode._id }).lean()
      : null;

    const symptomLogs = feverEpisode
      ? await SymptomLog.find({
          episodeId: feverEpisode._id,
          patientId: userId,
        })
          .sort({ logDate: -1 })
          .limit(7)
          .lean()
      : [];

    console.log("🌡️ Symptom Logs Found:", symptomLogs.length);

    const latestPrediction = feverEpisode
      ? await MLPrediction.findOne({ episodeId: feverEpisode._id })
          .sort({ createdAt: -1 })
          .lean()
      : null;

    const medications = await Medication.find({
      patientId: userId,
      isActive: true,
      $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    })
      .populate("prescribedBy", "name")
      .lean();

    const temperatureReadings = await Temperature.find({ patientId: userId })
      .sort({ recordedAt: -1 })
      .limit(5)
      .lean();

    const unreadAlerts = await Alert.find({
      patientId: userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const context = {
      patient: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: patientProfile?.age,
        gender: patientProfile?.gender,
        bloodGroup: patientProfile?.bloodGroup,
        allergies: patientProfile?.allergies || [],
        chronicConditions: patientProfile?.chronicConditions || [],
        riskScore: patientProfile?.riskScore || 0,
        currentStatus: patientProfile?.status || "unknown",
        location: patientProfile?.location?.city || "Not specified",
      },

      feverEpisode: feverEpisode
        ? {
            hasActiveEpisode: true,
            status: feverEpisode.status,
            startedAt: feverEpisode.startedAt,
            daysSinceStart: Math.ceil(
              (Date.now() - new Date(feverEpisode.startedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
            finalDiagnosis: feverEpisode.finalDiagnosis || "Pending",
            labConfirmed: feverEpisode.labConfirmed,
            hospitalized: feverEpisode.hospitalized,
            hospitalName: feverEpisode.hospitalName,
            assignedClinician:
              feverEpisode.assignedClinician?.name || "Not assigned",
            clinicianNotes: feverEpisode.clinicianNotes,
          }
        : {
            hasActiveEpisode: false,
            status: "No active fever episode",
            message: "Patient is currently healthy",
          },

      medicalHistory: episodeHistory
        ? {
            priorAntibiotics: episodeHistory.priorAntibiotics,
            antibioticName: episodeHistory.antibioticName,
            hasDiabetes: episodeHistory.hasDiabetes,
            immunocompromised: episodeHistory.immunocompromised,
            isPregnant: episodeHistory.isPregnant,
            chronicDiseases: episodeHistory.chronicDiseases || [],
            recentTravel: episodeHistory.recentTravel,
            travelLocation: episodeHistory.travelLocation,
            mosquitoExposure: episodeHistory.mosquitoExposure,
            waterSource: episodeHistory.waterSource,
            feverPattern: episodeHistory.feverPattern,
            highestTemperature: episodeHistory.highestTemperature,
          }
        : null,

      currentSymptoms:
        symptomLogs.length > 0
          ? {
              hasSymptoms: true,
              latest: {
                date: symptomLogs[0].logDate,
                dayOfIllness: symptomLogs[0].dayOfIllness,
                temperature: symptomLogs[0].temperature,
                tempTime: symptomLogs[0].tempTime,
                pulseRate: symptomLogs[0].pulseRate,
                symptoms: {
                  headache: symptomLogs[0].headache,
                  bodyPain: symptomLogs[0].bodyPain,
                  rash: symptomLogs[0].rash,
                  rashLocation: symptomLogs[0].rashLocation,
                  bleeding: symptomLogs[0].bleeding,
                  bleedingSite: symptomLogs[0].bleedingSite,
                  abdominalPain: symptomLogs[0].abdominalPain,
                  vomiting: symptomLogs[0].vomiting,
                  vomitingCount: symptomLogs[0].vomitingCount,
                  breathlessness: symptomLogs[0].breathlessness,
                  confusion: symptomLogs[0].confusion,
                  nausea: symptomLogs[0].nausea,
                },
                foodIntake: symptomLogs[0].foodIntake,
                urineOutput: symptomLogs[0].urineOutput,
                paracetamolTaken: symptomLogs[0].paracetamolTaken,
                paracetamolResponse: symptomLogs[0].paracetamolResponse,
                notes: symptomLogs[0].notes,
              },
              trend: symptomLogs.map((log) => ({
                day: log.dayOfIllness,
                date: log.logDate,
                temperature: log.temperature,
                tempTime: log.tempTime,
              })),
            }
          : {
              hasSymptoms: false,
              message: "No symptom data logged yet",
            },

      aiDiagnosis: latestPrediction
        ? {
            primaryDiagnosis: latestPrediction.primaryDiagnosis,
            confidenceScore: latestPrediction.confidenceScore,
            urgency: latestPrediction.urgency,
            probabilities: {
              dengue: latestPrediction.dengueProbability,
              typhoid: latestPrediction.typhoidProbability,
              malaria: latestPrediction.malariaProbability,
              viral: latestPrediction.viralProbability,
              covid: latestPrediction.covidProbability,
            },
            recommendations: {
              fefcon: latestPrediction.fefconRecommendation,
              investigations: latestPrediction.investigationsNeeded || [],
              keyFeatures: latestPrediction.keyFeatures || [],
            },
          }
        : null,

      medications:
        medications.length > 0
          ? medications.map((med) => ({
              name: med.medicationName,
              dosage: med.dosage,
              frequency: med.frequency,
              instructions: med.instructions,
              startDate: med.startDate,
              endDate: med.endDate,
              prescribedBy: med.prescribedBy?.name || "Unknown",
            }))
          : [],

      recentTemperatures: temperatureReadings.map((temp) => ({
        temperature: temp.temperature,
        recordedAt: temp.recordedAt,
        deviceId: temp.deviceId,
      })),

      alerts: unreadAlerts.map((alert) => ({
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        actionRequired: alert.actionRequired,
        createdAt: alert.createdAt,
      })),
    };

    console.log("✅ CONTEXT BUILD COMPLETE");
    console.log("   - Patient Name:", context.patient.name);
    console.log(
      "   - Has Active Episode:",
      context.feverEpisode.hasActiveEpisode
    );
    console.log("   - Has Symptoms:", context.currentSymptoms.hasSymptoms);

    return context;
  } catch (error) {
    console.error("❌ ERROR IN getPatientContext:", error.message);
    return {
      error: "Unable to fetch patient context",
      message: "Continue with basic assistance",
      details: error.message,
    };
  }
};

/**
 * Generate human-readable summary from context
 */
const generateContextSummary = (context) => {
  let summary = `Patient Name: ${context.patient.name}\n`;

  if (context.feverEpisode.hasActiveEpisode) {
    summary += `\nCURRENT HEALTH STATUS: ACTIVE FEVER EPISODE\n`;
    summary += `- Episode Status: ${context.feverEpisode.status}\n`;
    summary += `- Day of Illness: ${context.feverEpisode.daysSinceStart}\n`;
    summary += `- Started: ${new Date(
      context.feverEpisode.startedAt
    ).toLocaleDateString()}\n`;

    if (context.currentSymptoms.hasSymptoms) {
      const latest = context.currentSymptoms.latest;
      summary += `\nLATEST SYMPTOMS (Day ${latest.dayOfIllness}):\n`;
      summary += `- Temperature: ${latest.temperature}°F (${latest.tempTime})\n`;
      summary += `- Pulse Rate: ${latest.pulseRate || "Not recorded"} bpm\n`;

      const activeSymptoms = Object.entries(latest.symptoms)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key);

      if (activeSymptoms.length > 0) {
        summary += `- Symptoms: ${activeSymptoms.join(", ")}\n`;
      }

      summary += `- Food Intake: ${latest.foodIntake || "Not recorded"}\n`;
      summary += `- Urine Output: ${latest.urineOutput || "Not recorded"}\n`;
    }

    if (context.aiDiagnosis) {
      summary += `\nAI DIAGNOSIS:\n`;
      summary += `- Primary: ${context.aiDiagnosis.primaryDiagnosis} (${context.aiDiagnosis.confidenceScore}% confidence)\n`;
      summary += `- Urgency Level: ${context.aiDiagnosis.urgency}\n`;
      summary += `- Dengue Probability: ${context.aiDiagnosis.probabilities.dengue}%\n`;
      summary += `- Typhoid Probability: ${context.aiDiagnosis.probabilities.typhoid}%\n`;
      summary += `- Viral Probability: ${context.aiDiagnosis.probabilities.viral}%\n`;
    }
  } else {
    summary += `\nCURRENT HEALTH STATUS: No active fever episode\n`;
  }

  if (context.medications.length > 0) {
    summary += `\nCURRENT MEDICATIONS:\n`;
    context.medications.forEach((med) => {
      summary += `- ${med.name} (${med.dosage}) - ${med.frequency} hours frequency\n`;
    });
  }

  return summary;
};

/**
 * POST /api/chatbot/chat
 */
router.post("/chat", auth, async (req, res) => {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║          🤖 NEW CHAT REQUEST                          ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  try {
    const userId = req.user?.id || req.user?._id;
    console.log("✅ User ID:", userId);

    const { message, language = "en" } = req.body;
    console.log("📝 Message:", message);
    console.log("🌍 Language:", language);

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const history = await ChatMessage.find({ userId })
      .sort({ created_at: -1 })
      .limit(10)
      .select("role content language")
      .lean();

    const patientContext = await getPatientContext(userId);

    // 🔥 FIX: Generate human-readable summary
    const contextSummary = generateContextSummary(patientContext);
    console.log("\n📊 Context Summary Generated:");
    console.log(contextSummary);

    // 🔥 FIX: Simpler, more direct system prompt
    let systemPrompt = `You are a medical AI assistant for FieveAI specialized in fever management.

INSTRUCTIONS:
- Always greet the patient by name
- CAREFULLY READ the patient health summary below
- Base your response ONLY on the provided patient data
- Be empathetic and supportive
- Use simple, clear language
- Suggest medical consultation for serious symptoms
`;

    if (language === "hi") {
      systemPrompt += "\nRespond in Hindi (हिंदी).\n";
    } else if (language === "kn") {
      systemPrompt += "\nRespond in Kannada (ಕನ್ನಡ).\n";
    }

    // 🔥 FIX: Add context summary directly to system prompt
    systemPrompt += `\n--- PATIENT HEALTH SUMMARY ---\n${contextSummary}\n--- END OF SUMMARY ---\n`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    console.log("\n🤖 Calling SiliconFlow API...");

    const aiResponse = await axios.post(
      "https://api.siliconflow.com/v1/chat/completions",
      {
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages,
        max_tokens: 600,
        temperature: 0.7,
        top_p: 0.8,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const aiMessage = aiResponse.data.choices[0].message.content;
    console.log("\n✅ AI Response:", aiMessage.substring(0, 100) + "...");

    await ChatMessage.insertMany([
      {
        userId,
        role: "user",
        content: message,
        language,
        created_at: new Date(),
      },
      {
        userId,
        role: "assistant",
        content: aiMessage,
        language,
        created_at: new Date(),
      },
    ]);

    console.log("✅ Messages saved to DB");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    res.json({
      success: true,
      response: aiMessage,
      messageId: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        error: "AI service authentication failed.",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to process message",
    });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await ChatMessage.find({ userId })
      .sort({ created_at: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select("role content language created_at")
      .lean();

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat history",
    });
  }
});

router.delete("/history", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const result = await ChatMessage.deleteMany({ userId });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear history",
    });
  }
});

router.get("/context", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const context = await getPatientContext(userId);
    const summary = generateContextSummary(context);

    res.json({
      success: true,
      context,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch context",
    });
  }
});

module.exports = router;
