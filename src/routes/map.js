const express = require("express");
const mapRouter = express.Router();
const { PatientProfile, MLPrediction, FeverEpisode, DiseaseHotspot } = require("../models");

mapRouter.get("/disease-hotspots", async (req, res) => {
  try {
    const activeEpisodes = await FeverEpisode.find({ status: "active" })
      .populate("patientId", "name email")
      .limit(500);

    const mapData = [];

    for (const episode of activeEpisodes) {
      const profile = await PatientProfile.findOne({ userId: episode.patientId._id });
      const prediction = await MLPrediction.findOne({ episodeId: episode._id })
        .sort({ createdAt: -1 });

      if (profile && profile.location && prediction) {
        mapData.push({
          id: episode._id,
          patientName: episode.patientId.name,
          disease: prediction.primaryDiagnosis,
          confidence: prediction.confidenceScore,
          urgency: prediction.urgency,
          city: profile.location.city,
          state: profile.location.state,
          coordinates: profile.location.coordinates,
          dayOfIllness: Math.ceil((Date.now() - episode.startedAt) / (1000*60*60*24)),
          status: episode.status
        });
      }
    }

    const hotspots = await DiseaseHotspot.find({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    });

    res.json({
      success: true,
      totalCases: mapData.length,
      cases: mapData,
      hotspots: hotspots,
      summary: {
        dengue: mapData.filter(c => c.disease.toLowerCase() === 'dengue').length,
        malaria: mapData.filter(c => c.disease.toLowerCase() === 'malaria').length,
        typhoid: mapData.filter(c => c.disease.toLowerCase() === 'typhoid').length,
        viral: mapData.filter(c => c.disease.toLowerCase() === 'viral').length
      }
    });

  } catch (error) {
    console.error("Map data error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = mapRouter;
