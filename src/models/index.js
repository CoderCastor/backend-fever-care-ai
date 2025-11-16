const User = require("./user");
const PatientProfile = require("./PatientProfile");
const FeverEpisode = require("./FeverEpisode");
const SymptomLog = require("./SymptomLog");
const EpisodeHistory = require("./EpisodeHistory");
const MLPrediction = require("./MLPrediction");
const Alert = require("./Alert");
const Medication = require("./Medication");
const MedicationLog = require("./MedicationLog");

module.exports = {

  User: require("./user"),
  PatientProfile: require("./PatientProfile"),
  ClinicianProfile: require("./ClinicianProfile"),
  FeverEpisode: require("./FeverEpisode"),
  SymptomLog: require("./SymptomLog"),
  EpisodeHistory: require("./EpisodeHistory"),
  Temperature: require("./Temperature"),
  Alert: require("./Alert"),
  ChatMessage: require("./ChatMessage"),
  Device: require("./Device"),
  Medication: require("./Medication"),
  MedicationLog: require("./MedicationLog"),
  MLPrediction: require("./MLPrediction"),
  FamilyHistory: require("./FamilyHistory"),
  ContactTracing: require("./ContactTracing"),
  OccupationalInfo: require("./OccupationalInfo"),
  DiseaseHotspot: require("./DiseaseHotspot"),
  MedicationHistory: require("./MedicationHistory"),

  User,
  PatientProfile,
  FeverEpisode,
  SymptomLog,
  EpisodeHistory,
  MLPrediction,
  Alert,
  Medication,
  MedicationLog,

};
