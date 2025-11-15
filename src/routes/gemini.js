const express = require("express");
const router = express.Router();
const User = require("../models/user");
const PatientProfile = require("../models/PatientProfile");
const FeverEpisode = require("../models/FeverEpisode");
const EpisodeHistory = require("../models/EpisodeHistory");
const MLPrediction = require("../models/MLPrediction");

// Conversation memory (use Redis in production)
const conversations = new Map();

router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId = 'default', doctorId = 'doc1' } = req.body;

    console.log("📩 User Message:", message);

    // Dynamic import
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Get conversation history
    const convKey = `${doctorId}-${sessionId}`;
    let history = conversations.get(convKey) || [];

    // Check if patient name mentioned
    const patientNameMatch = message.match(/about\s+(\w+\s+\w+)/i) || 
                             message.match(/(\w+\s+\w+)'s/i);
    
    let patientContext = "";
    
    if (patientNameMatch) {
      const patientName = patientNameMatch[1];
      console.log(`🔍 Searching for patient: ${patientName}`);
      
      // Query database
      const patient = await User.findOne({
        name: new RegExp(patientName, 'i'),
        role: 'patient'
      });

      if (patient) {
        const profile = await PatientProfile.findOne({ userId: patient._id });
        const episode = await FeverEpisode.findOne({
          patientId: patient._id,
          status: 'active'
        }).sort({ startedAt: -1 });

        const episodeHistory = episode ? 
          await EpisodeHistory.findOne({ episodeId: episode._id }) : null;

        const prediction = episode ?
          await MLPrediction.findOne({ episodeId: episode._id })
            .sort({ createdAt: -1 }) : null;

        // Build context
        patientContext = `
PATIENT DATA FROM DATABASE:
- Name: ${patient.name}
- Age: ${profile?.age || 'Unknown'}
- Gender: ${profile?.gender || 'Unknown'}
- Blood Group: ${profile?.bloodGroup || 'Unknown'}
- Phone: ${patient.phone}
- Email: ${patient.email}
- Location: ${profile?.address?.city || 'Unknown'}, ${profile?.address?.state || 'Unknown'}

${episode ? `
CURRENT FEVER EPISODE:
- Status: ${episode.status}
- Started: ${episode.startedAt.toLocaleDateString()}
- Day of Illness: ${Math.ceil((Date.now() - episode.startedAt) / (1000*60*60*24))}
` : 'No active fever episode'}

${episodeHistory ? `
MEDICAL HISTORY:
- Highest Temperature: ${episodeHistory.highestTemperature}°F
- Fever Pattern: ${episodeHistory.feverPattern}
- Mosquito Exposure: ${episodeHistory.mosquitoExposure ? 'Yes' : 'No'}
- Recent Travel: ${episodeHistory.recentTravel ? 'Yes' : 'No'}
- Prior Antibiotics: ${episodeHistory.priorAntibiotics ? 'Yes' : 'No'}
- Diabetes: ${episodeHistory.hasDiabetes ? 'Yes' : 'No'}
` : ''}

${prediction ? `
AI PREDICTION:
- Diagnosis: ${prediction.primaryDiagnosis} (${prediction.confidenceScore.toFixed(1)}% confidence)
- Urgency: ${prediction.urgency}
- FeFCon Recommendation: ${prediction.fefconRecommendation}
- Investigations Needed: ${prediction.investigationsNeeded?.join(', ') || 'None'}
` : ''}
`.trim();
      } else {
        patientContext = `Patient "${patientName}" not found in database.`;
      }
    }

    // Build full prompt with system instructions
    const systemPrompt = `You are Dr. AI, an intelligent medical assistant for fever diagnosis.

CAPABILITIES:
- Access patient records from MongoDB database
- Analyze fever patterns following FeFCon 2024 guidelines
- Provide clinical recommendations
- Remember conversation context

CLINICAL KNOWLEDGE:
- Dengue phases: Febrile (Day 1-3), Critical (Day 4-7), Recovery (8+)
- Platelet <100k = High risk, <50k = Emergency
- Dengue triad: Headache + Body pain + Eye pain
- FeFCon: Monitor CBC q6h in critical phase

STYLE:
- Professional but conversational
- Concise (2-3 sentences max)
- Highlight critical findings with 🚨
- Use bullet points for clarity

${patientContext ? `\n${patientContext}\n` : ''}`;

    // Build conversation for Gemini
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to assist with patient queries." }] },
      ...history,
      { role: "user", parts: [{ text: message }] }
    ];

    // Generate response
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: contents,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      }
    });

    const aiResponse = response.text;
    console.log("🤖 AI Response:", aiResponse);

    // Update conversation history
    history.push({ role: "user", parts: [{ text: message }] });
    history.push({ role: "model", parts: [{ text: aiResponse }] });
    
    // Keep only last 10 exchanges (20 messages)
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    conversations.set(convKey, history);

    res.json({
      success: true,
      response: aiResponse,
      hasPatientContext: !!patientContext,
      conversationLength: history.length
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear conversation history
router.post("/clear", (req, res) => {
  const { sessionId = 'default', doctorId = 'doc1' } = req.body;
  const convKey = `${doctorId}-${sessionId}`;
  conversations.delete(convKey);
  
  res.json({ success: true, message: "Conversation cleared" });
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    activeConversations: conversations.size
  });
});

module.exports = router;
