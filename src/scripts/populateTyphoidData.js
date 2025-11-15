const mongoose = require("mongoose");
const User = require("../models/user");
const PatientProfile = require("../models/PatientProfile");
const FeverEpisode = require("../models/FeverEpisode");
const SymptomLog = require("../models/SymptomLog");
const EpisodeHistory = require("../models/EpisodeHistory");
const MLPrediction = require("../models/MLPrediction");
const Alert = require("../models/Alert");

async function connectDB() {
  await mongoose.connect(
    "mongodb+srv://kartikshingde12:Kartik8830@namastenode.d6rrw0p.mongodb.net/fever-care",
    {
      serverSelectionTimeoutMS: 30000,
    }
  );

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
  }

  console.log("✅ Connected to MongoDB\n");
}

async function populateTyphoidPatient3() {
  try {
    await connectDB();

    console.log("🔄 Populating third Typhoid patient data (Pediatric case)...");

    // 1. Create Typhoid patient - Female child from Kolkata
    const patient = new User({
      name: "Ananya Chatterjee",
      email: "ananya.parent@test.com",
      password: "$2b$10$d4eK6g9UdbVNwvXQA.YHV.sfziLy49OVGVBhyK5vPMuJ.bDzuZOaW",
      role: "patient",
      phone: "+919832567890",
    });
    await patient.save();
    console.log("✓ Typhoid patient created (Pediatric)");

    // 2. Patient profile - 9-year-old female (peak age for typhoid in children)
    const profile = new PatientProfile({
      userId: patient._id,
      age: 9,
      gender: "female",
      bloodGroup: "AB+",
      location: {
        type: "Point",
        coordinates: [88.3639, 22.5726], // Kolkata
        city: "Kolkata",
        state: "West Bengal",
      },
      riskScore: 54,
      status: "monitoring",
    });
    await profile.save();
    console.log("✓ Patient profile created");

    // 3. Fever episode - 7 days progression
    const episode = new FeverEpisode({
      patientId: patient._id,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "active",
    });
    await episode.save();
    console.log("✓ Fever episode created");

    // 4. Episode history - Pediatric typhoid with poor hygiene exposure
    const history = new EpisodeHistory({
      episodeId: episode._id,
      priorAntibiotics: false,
      hasDiabetes: false,
      immunocompromised: false,
      recentTravel: false,
      mosquitoExposure: false,
      waterSource: "tap", // Municipal water - common typhoid source
      feverPattern: "evening_rise", // Typical pediatric pattern
      highestTemperature: 103.8,
    });
    await history.save();
    console.log("✓ Episode history created");

    // 5. Symptom logs (Day 1-7) - Pediatric typhoid progression
    let lastSymptom;
    for (let day = 1; day <= 7; day++) {
      const symptom = new SymptomLog({
        episodeId: episode._id,
        patientId: patient._id,
        dayOfIllness: day,
        logDate: new Date(Date.now() - (8 - day) * 24 * 60 * 60 * 1000),
        // Gradual fever rise typical in children
        temperature: 98.8 + day * 0.7,
        tempTime: day <= 2 ? "afternoon" : "evening",
        headache: true,
        bodyPain: day >= 2,
        rash: day >= 5, // Rose spots appear later
        bleeding: false,
        abdominalPain: day >= 3, // Common in children
        vomiting: day >= 2, // Earlier in children
        nausea: day >= 1,
        foodIntake: day <= 1 ? "reduced" : day <= 4 ? "poor" : "nil",
        urineOutput: day >= 5 ? "reduced" : "normal",
        paracetamolTaken: true,
        // Using ONLY valid enum values: reduced_fever, no_effect, partial_relief
        paracetamolResponse:
          day <= 2
            ? "reduced_fever"
            : day <= 5
            ? "partial_relief"
            : "no_effect",
      });
      await symptom.save();
      lastSymptom = symptom;
    }
    console.log("✓ Symptom logs created (7 days - Pediatric Typhoid)");

    // 6. ML prediction for Typhoid (Pediatric)
    const mlPred = new MLPrediction({
      symptomLogId: lastSymptom._id,
      episodeId: episode._id,
      dengueProbability: 1.2,
      typhoidProbability: 94.5,
      malariaProbability: 0.8,
      viralProbability: 3.5,
      primaryDiagnosis: "typhoid",
      confidenceScore: 94.5,
      urgency: "HIGH",
      fefconRecommendation:
        "Pediatric Typhoid - Start Ceftriaxone 75mg/kg/day IV. Monitor hydration. Admit for observation.",
      investigationsNeeded: [
        "Blood culture",
        "CBC with differential",
        "Widal test",
        "Stool culture",
        "Liver enzymes",
      ],
      modelVersion: "v2.0",
    });
    await mlPred.save();
    console.log("✓ ML prediction created (Pediatric Typhoid)");

    // 7. Alert for Pediatric Typhoid
    const alert = new Alert({
      patientId: patient._id,
      alertType: "critical_symptom",
      severity: "high",
      message:
        "Day 7 pediatric typhoid - Persistent fever, poor food intake. Hospitalization recommended.",
      actionRequired: true,
      metadata: {
        predictionId: mlPred._id,
        diagnosis: "Typhoid",
        confidence: 94.5,
        ageGroup: "pediatric",
      },
    });
    await alert.save();
    console.log("✓ Alert created");

    console.log(
      "\n✅ Third Typhoid patient (Pediatric) data populated successfully!"
    );
    console.log(`📋 Patient Name: Ananya Chatterjee (9 years old)`);
    console.log(`📋 Patient ID: ${patient._id}`);
    console.log(`📋 Episode ID: ${episode._id}`);
    console.log(`📋 Latest Symptom ID: ${lastSymptom._id}`);
    console.log(`📋 Location: Kolkata`);
    console.log(`📋 Risk Factor: Municipal tap water`);
  } catch (error) {
    console.error("❌ Error populating Typhoid data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

populateTyphoidPatient3();
