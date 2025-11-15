const mongoose = require("mongoose");

// MongoDB Connection String
const MONGODB_URI = "mongodb://localhost:27017/fieveai"; // Update with your connection string

// Your User IDs
const PATIENT_ID = "69177f0f1868a2c9a19cf625";
const EPISODE_ID = "69177f301868a2c9a19cf62f";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define SymptomLog Schema (minimal)
const SymptomLogSchema = new mongoose.Schema(
  {
    episodeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    logDate: { type: Date, default: Date.now },
    dayOfIllness: { type: Number, required: true },
    temperature: { type: Number, required: true },
    tempTime: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },
    headache: { type: Boolean, default: false },
    bodyPain: { type: Boolean, default: false },
    rash: { type: Boolean, default: false },
    bleeding: { type: Boolean, default: false },
    abdominalPain: { type: Boolean, default: false },
    vomiting: { type: Boolean, default: false },
    breathlessness: { type: Boolean, default: false },
    confusion: { type: Boolean, default: false },
    nausea: { type: Boolean, default: false },
    paracetamolTaken: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const SymptomLog = mongoose.model("SymptomLog", SymptomLogSchema);

// Test Data for Day 2 and Day 3
const testData = [
  // DAY 2 - Multiple readings
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 2,
    temperature: 99.8,
    tempTime: "morning",
    headache: true,
    bodyPain: false,
    nausea: false,
    notes: "Feeling slightly better in morning",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 2,
    temperature: 101.5,
    tempTime: "afternoon",
    headache: true,
    bodyPain: true,
    nausea: true,
    notes: "Fever spiked after lunch",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 2,
    temperature: 102.3,
    tempTime: "evening",
    headache: true,
    bodyPain: true,
    nausea: false,
    notes: "High fever in evening",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 2,
    temperature: 100.9,
    tempTime: "night",
    headache: false,
    bodyPain: true,
    nausea: false,
    notes: "Took paracetamol, fever reduced slightly",
  },

  // DAY 3 - Multiple readings
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 3,
    temperature: 103.2,
    tempTime: "morning",
    headache: true,
    bodyPain: true,
    rash: true,
    nausea: true,
    notes: "High fever, rash appeared",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 3,
    temperature: 104.5,
    tempTime: "afternoon",
    headache: true,
    bodyPain: true,
    rash: true,
    vomiting: true,
    nausea: true,
    notes: "Peak fever, vomiting started",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 3,
    temperature: 103.8,
    tempTime: "evening",
    headache: true,
    bodyPain: true,
    rash: true,
    abdominalPain: true,
    notes: "Persistent high fever, abdominal pain",
  },
  {
    episodeId: EPISODE_ID,
    patientId: PATIENT_ID,
    dayOfIllness: 3,
    temperature: 102.1,
    tempTime: "night",
    headache: true,
    bodyPain: true,
    rash: true,
    notes: "Fever still high at night",
  },
];

// Insert Test Data
async function seedTestData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connection.once("open", () => {
      console.log("✅ Connected to MongoDB");
    });

    console.log("🌱 Seeding test data...");

    const result = await SymptomLog.insertMany(testData);

    console.log(`✅ Successfully inserted ${result.length} symptom logs!`);
    console.log("\nInserted Data Summary:");
    console.log(`- Day 2: 4 readings (morning, afternoon, evening, night)`);
    console.log(`- Day 3: 4 readings (morning, afternoon, evening, night)`);

    console.log("\n📊 Temperature Trends:");
    console.log("Day 2: 99.8°F → 101.5°F → 102.3°F → 100.9°F");
    console.log("Day 3: 103.2°F → 104.5°F → 103.8°F → 102.1°F");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedTestData();
