const mongoose = require("mongoose");
const User = require("../models/user");
const PatientProfile = require("../models/PatientProfile");
const FeverEpisode = require("../models/FeverEpisode");
const SymptomLog = require("../models/SymptomLog");
const EpisodeHistory = require("../models/EpisodeHistory");
const MLPrediction = require("../models/MLPrediction");
const Alert = require("../models/Alert");
const DiseaseHotspot = require("../models/DiseaseHotspot");

// Indian cities with coordinates [longitude, latitude]
const INDIAN_CITIES = [
  { name: "Mumbai", state: "Maharashtra", coords: [72.8777, 19.0760] },
  { name: "Delhi", state: "Delhi", coords: [77.1025, 28.7041] },
  { name: "Bangalore", state: "Karnataka", coords: [77.5946, 12.9716] },
  { name: "Pune", state: "Maharashtra", coords: [73.8567, 18.5204] },
  { name: "Chennai", state: "Tamil Nadu", coords: [80.2707, 13.0827] },
  { name: "Kolkata", state: "West Bengal", coords: [88.3639, 22.5726] },
  { name: "Hyderabad", state: "Telangana", coords: [78.4867, 17.3850] },
  { name: "Ahmedabad", state: "Gujarat", coords: [72.5714, 23.0225] },
  { name: "Jaipur", state: "Rajasthan", coords: [75.7873, 26.9124] },
  { name: "Lucknow", state: "Uttar Pradesh", coords: [80.9462, 26.8467] },
];

const FIRST_NAMES = ["Rahul", "Priya", "Amit", "Sneha", "Rohan", "Anjali", "Vikram", "Pooja", "Arjun", "Kavita", "Sanjay", "Meera", "Aditya", "Riya", "Kunal"];
const LAST_NAMES = ["Sharma", "Patel", "Kumar", "Singh", "Reddy", "Nair", "Desai", "Verma", "Gupta", "Iyer", "Chopra", "Rao"];
const DISEASES = ["Dengue", "Malaria", "Typhoid", "Viral"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function connectDB() {
  await mongoose.connect("mongodb+srv://kartikshingde12:Kartik8830@namastenode.d6rrw0p.mongodb.net/fever-care-100Users", {
    serverSelectionTimeoutMS: 30000,
  });
  console.log("✅ Connected to MongoDB\n");
}

function getDiseaseProba(disease) {
  const probabilities = {
    Dengue: { dengueProbability: 70 + Math.random() * 15, malariaProbability: 10 + Math.random() * 8, typhoidProbability: 8 + Math.random() * 5, viralProbability: 5 + Math.random() * 3 },
    Malaria: { dengueProbability: 5 + Math.random() * 8, malariaProbability: 68 + Math.random() * 12, typhoidProbability: 12 + Math.random() * 8, viralProbability: 6 + Math.random() * 4 },
    Typhoid: { dengueProbability: 8 + Math.random() * 7, malariaProbability: 9 + Math.random() * 6, typhoidProbability: 65 + Math.random() * 15, viralProbability: 10 + Math.random() * 5 },
    Viral: { dengueProbability: 15 + Math.random() * 10, malariaProbability: 8 + Math.random() * 5, typhoidProbability: 10 + Math.random() * 7, viralProbability: 60 + Math.random() * 15 }
  };
  return probabilities[disease];
}

async function populate100Patients() {
  try {
    await connectDB();
    
    console.log("🔄 Creating 100 patients across India...\n");

    const diseaseCount = { Dengue: 0, Malaria: 0, Typhoid: 0, Viral: 0 };
    const cityDiseaseMap = {};

    for (let i = 1; i <= 100; i++) {
      const city = getRandomElement(INDIAN_CITIES);
      const disease = getRandomElement(DISEASES);
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const email = `${firstName.toLowerCase()}${i}@test.com`;
      const dayOfIllness = getRandomNumber(1, 7);
      const proba = getDiseaseProba(disease);

      // ✅ Wider coordinate spread for better visibility
      const coords = [
        city.coords[0] + (Math.random() - 0.5) * 0.3,
        city.coords[1] + (Math.random() - 0.5) * 0.3
      ];

      // Create User
      const patient = new User({
        name: `${firstName} ${lastName}`,
        email: email,
        password: "password123",
        role: "patient",
        phone: `+919${getRandomNumber(100000000, 999999999)}`
      });
      await patient.save();

      // Create Profile
      const profile = new PatientProfile({
        userId: patient._id,
        age: getRandomNumber(18, 65),
        gender: Math.random() > 0.5 ? "male" : "female",
        bloodGroup: getRandomElement(BLOOD_GROUPS),
        location: {
          type: "Point",
          coordinates: coords,
          city: city.name,
          state: city.state,
          country: "India"
        },
        riskScore: disease === "Dengue" ? getRandomNumber(60, 85) : getRandomNumber(40, 70),
        status: "monitoring"
      });
      await profile.save();

      // Create Episode
      const episode = new FeverEpisode({
        patientId: patient._id,
        startedAt: new Date(Date.now() - dayOfIllness * 24 * 60 * 60 * 1000),
        status: "active"
      });
      await episode.save();

      // Create History
      const history = new EpisodeHistory({
        episodeId: episode._id,
        priorAntibiotics: Math.random() > 0.8,
        hasDiabetes: Math.random() > 0.9,
        recentTravel: disease === "Malaria",
        mosquitoExposure: disease === "Dengue" || disease === "Malaria",
        feverPattern: disease === "Malaria" ? "intermittent" : "continuous",
        highestTemperature: 102 + dayOfIllness * 0.5,
        measurementMethod: "digital"
      });
      await history.save();

      // Create Symptom Log
      const symptomLog = new SymptomLog({
        episodeId: episode._id,
        patientId: patient._id,
        dayOfIllness: dayOfIllness,
        logDate: new Date(),
        temperature: 102 + dayOfIllness * 0.5,
        tempTime: "evening",
        pulseRate: getRandomNumber(75, 110),
        headache: true,
        bodyPain: true,
        eyePain: disease === "Dengue",
        rash: disease === "Dengue" && dayOfIllness >= 3,
        bleeding: disease === "Dengue" && dayOfIllness >= 5,
        abdominalPain: disease === "Typhoid" || disease === "Malaria",
        vomiting: dayOfIllness >= 3,
        nausea: true,
        foodIntake: dayOfIllness <= 2 ? "reduced" : "poor",
        urineOutput: "normal",
        paracetamolTaken: true,
        paracetamolResponse: "partial_relief"
      });
      await symptomLog.save();

      // Create ML Prediction
      const confidenceScore = proba[`${disease.toLowerCase()}Probability`];
      const mlPrediction = new MLPrediction({
        symptomLogId: symptomLog._id,
        episodeId: episode._id,
        dengueProbability: proba.dengueProbability,
        typhoidProbability: proba.typhoidProbability,
        malariaProbability: proba.malariaProbability,
        viralProbability: proba.viralProbability,
        primaryDiagnosis: disease,
        confidenceScore: confidenceScore,
        urgency: dayOfIllness >= 5 ? "HIGH" : "MEDIUM",
        fefconRecommendation: `${disease} suspected. Day ${dayOfIllness} of illness.`,
        investigationsNeeded: ["CBC", `${disease} specific test`],
        keyFeatures: [`${disease} pattern detected`],
        modelVersion: "v2.0"
      });
      await mlPrediction.save();

      // Create Alert if needed
      if (dayOfIllness >= 4) {
        const alert = new Alert({
          patientId: patient._id,
          alertType: "critical_symptom",
          severity: dayOfIllness >= 6 ? "high" : "medium",
          message: `Day ${dayOfIllness} of ${disease} - Monitor closely`,
          actionRequired: dayOfIllness >= 6,
          metadata: { diagnosis: disease, confidence: confidenceScore }
        });
        await alert.save();
      }

      diseaseCount[disease]++;

      const key = `${city.name}-${disease}`;
      if (!cityDiseaseMap[key]) {
        cityDiseaseMap[key] = { city: city.name, state: city.state, coords: city.coords, disease: disease, count: 0 };
      }
      cityDiseaseMap[key].count++;

      if (i % 10 === 0) console.log(`✓ Created ${i}/100 patients`);
    }

    // Create Hotspots
    console.log("\n🗺️  Creating disease hotspots...");
    for (const key in cityDiseaseMap) {
      const data = cityDiseaseMap[key];
      const hotspot = new DiseaseHotspot({
        location: {
          type: "Point",
          coordinates: data.coords
        },
        city: data.city,
        state: data.state,
        disease: data.disease.toLowerCase(),
        caseCount: data.count,
        activeCases: data.count,
        severity: data.count > 15 ? "high" : data.count > 8 ? "medium" : "low",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      await hotspot.save();
    }

    console.log("\n✅ 100 PATIENTS CREATED SUCCESSFULLY!");
    console.log("\n📊 DISEASE DISTRIBUTION:");
    console.log(`   Dengue: ${diseaseCount.Dengue}`);
    console.log(`   Malaria: ${diseaseCount.Malaria}`);
    console.log(`   Typhoid: ${diseaseCount.Typhoid}`);
    console.log(`   Viral: ${diseaseCount.Viral}`);
    console.log(`\n🗺️  Hotspots Created: ${Object.keys(cityDiseaseMap).length}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

populate100Patients();
