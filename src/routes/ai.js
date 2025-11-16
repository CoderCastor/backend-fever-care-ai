const express = require('express');
const router = express.Router();
const { MedicationHistory, FamilyHistory, User } = require('../models');

router.post('/medication-analyze', async (req, res) => {
  // Gather all relevant history
  const { patientId, medication, clinicianNote } = req.body;
  const mh = await MedicationHistory.find({ patientId }).lean();
  const fh = await FamilyHistory.findOne({ patientId }).lean();
  const allergies = mh.filter(m => m.hadReaction).map(m => ({
    name: m.medicationName,
    reaction: m.reactionType
  }));

  // Build context for Gemini (you can call Google Gemini API)
  const prompt = `
PATIENT CONTEXT:
- Medication allergy: ${JSON.stringify(allergies)}
- Family hemophilia: ${fh && fh.hemophilia ? "YES" : "NO"}

PROPOSING MEDICATION:
- Name: ${medication}
- Note: ${clinicianNote || "No comment."}

Check SAFETY for: allergy, contraindication (like NSAIDs in hemophilia), known side effects, GEMINI!
IF dangerous, explain why and auto-block suggestion. Else, OK with explanation.
`;

  // Call Gemini (pseudo-code: replace below with YOUR Gemini API client!)
  let analysis = "";
  let safeguard = "ok";
  try {
    // (Pseudo-code) LIVE Gemini call:
    // const { GoogleGenAI } = require("@google/genai");
    // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // const response = await ai.models.generateContent({ model: "gemini-1.5-pro", contents: prompt });
    // analysis = response.text;
    // (For now, fake it!)
    if ((allergies.find(a => medication.toLowerCase().includes(a.name.toLowerCase()))))
      { analysis = `❌ ALERT: Patient allergic to ${medication}! Blocked.`; safeguard = "blocked"; }
    else if ((fh && fh.hemophilia) && (["aspirin", "ibuprofen", "nsaid"].some(word => medication.toLowerCase().includes(word))))
      { analysis = `❗ WARNING: Avoid ${medication} due to hemophilia (bleeding risk).`; safeguard = "blocked"; }
    else
      { analysis = `✅ OK. ${medication} may be prescribed (no major risk factors found).`; }

    // Return AI feedback
    res.json({analysis, safeguard});
  } catch(err) {
    res.status(500).json({error: err.message || "Gemini error"});
  }
});
module.exports = router;
