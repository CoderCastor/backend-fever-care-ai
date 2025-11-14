const mongoose = require("mongoose");
const User = require("../models/user");
const PatientProfile = require("../models/PatientProfile");
const FeverEpisode = require("../models/FeverEpisode");
const SymptomLog = require("../models/SymptomLog");
const EpisodeHistory = require("../models/EpisodeHistory");
const MLPrediction = require("../models/MLPrediction");
const Alert = require("../models/Alert");

async function connectDB() {
  await mongoose.connect("mongodb+srv://kartikshingde12:Kartik8830@namastenode.d6rrw0p.mongodb.net/fever-care", {
    serverSelectionTimeoutMS: 30000,
  });
  
  // Wait for connection to be fully established
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }
  
  console.log("✅ Connected to MongoDB\n");
}

async function clearDatabase() {
  console.log("🗑️  Clearing database...");
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (let collection of collections) {
    await mongoose.connection.db.dropCollection(collection.name);
    console.log(`   Dropped: ${collection.name}`);
  }
  
  console.log("✅ Database cleared!\n");
}

async function populateSampleData() {
  try {
    // Connect first and wait for connection
    await connectDB();
    
    // Now clear database
    await clearDatabase();
    
    console.log("🔄 Populating sample data...");

    // 1. Create sample patient
    const patient = new User({
      name: "Rahul Sharma",
      email: "rahul@test.com",
      password: "password123",
      role: "patient",
      phone: "+919876543210"
    });
    await patient.save();
    console.log("✓ Patient created");

    // 2. Patient profile
    const profile = new PatientProfile({
      userId: patient._id,
      age: 28,
      gender: "male",
      bloodGroup: "B+",
      location: {
        type: "Point",
        coordinates: [73.8567, 18.5204], // Pune
        city: "Pune",
        state: "Maharashtra"
      },
      riskScore: 45,
      status: "monitoring"
    });
    await profile.save();
    console.log("✓ Patient profile created");

    // 3. Fever episode
    const episode = new FeverEpisode({
      patientId: patient._id,
      startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      status: "active"
    });
    await episode.save();
    console.log("✓ Fever episode created");

    // 4. Episode history
    const history = new EpisodeHistory({
      episodeId: episode._id,
      priorAntibiotics: false,
      hasDiabetes: false,
      immunocompromised: false,
      recentTravel: false,
      mosquitoExposure: true,
      feverPattern: "continuous",
      highestTemperature: 104.2
    });
    await history.save();
    console.log("✓ Episode history created");

    // 5. Symptom logs (Day 1-4)
    let lastSymptom;
    for (let day = 1; day <= 4; day++) {
      const symptom = new SymptomLog({
        episodeId: episode._id,
        patientId: patient._id,
        dayOfIllness: day,
        logDate: new Date(Date.now() - (5 - day) * 24 * 60 * 60 * 1000),
        temperature: 102 + day * 0.5,
        tempTime: "evening",
        headache: true,
        bodyPain: true,
        eyePain: day >= 2,
        rash: day >= 3,
        bleeding: false,
        abdominalPain: false,
        vomiting: day >= 3,
        foodIntake: day <= 2 ? "reduced" : "poor",
        urineOutput: "normal",
        paracetamolTaken: true,
        paracetamolResponse: "partial_relief"
      });
      await symptom.save();
      lastSymptom = symptom;
    }
    console.log("✓ Symptom logs created (4 days)");

    // 6. Sample ML prediction
    const mlPred = new MLPrediction({
      symptomLogId: lastSymptom._id,
      episodeId: episode._id,
      dengueProbability: 75.3,
      typhoidProbability: 12.1,
      malariaProbability: 8.5,
      viralProbability: 4.1,
      primaryDiagnosis: "dengue",
      confidenceScore: 75.3,
      urgency: "HIGH",
      fefconRecommendation: "Critical Phase: Monitor CBC q6h, Watch for warning signs",
      investigationsNeeded: ["CBC with platelet", "Dengue IgM/IgG", "Liver enzymes"],
      modelVersion: "v2.0"
    });
    await mlPred.save();
    console.log("✓ ML prediction created");

    // 7. Sample alert
    const alert = new Alert({
      patientId: patient._id,
      alertType: "critical_symptom",
      severity: "high",
      message: "Day 4 of dengue - Entering critical phase. Monitor closely.",
      actionRequired: true,
      metadata: {
        predictionId: mlPred._id,
        diagnosis: "Dengue",
        confidence: 75.3
      }
    });
    await alert.save();
    console.log("✓ Alert created");

    console.log("\n✅ Sample data populated successfully!");
    console.log(`📋 Patient ID: ${patient._id}`);
    console.log(`📋 Episode ID: ${episode._id}`);
    console.log(`📋 Latest Symptom ID: ${lastSymptom._id}`);

  } catch (error) {
    console.error("❌ Error populating data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

populateSampleData();
