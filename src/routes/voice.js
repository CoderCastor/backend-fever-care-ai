const express = require("express");
const router = express.Router();


router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("User Message:", message);

    // Dynamic import
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Simple generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message
    });

    console.log("AI Response:", response.text);

    res.json({
      success: true,
      response: response.text
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/health", (req, res) => {
  res.json({
    success: true,
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

module.exports = router;
