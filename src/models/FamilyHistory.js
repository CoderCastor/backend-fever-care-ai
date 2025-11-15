const mongoose = require('mongoose');

const familyHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Hereditary conditions
  hemophilia: { type: Boolean, default: false },
  hemophiliaRelation: String, // "father", "mother", "sibling"
  
  dengueHistory: { type: Boolean, default: false },
  dengueCount: { type: Number, default: 0 },
  lastDengueYear: Number,
  
  diabetes: { type: Boolean, default: false },
  hypertension: { type: Boolean, default: false },
  heartDisease: { type: Boolean, default: false },
  kidneyDisease: { type: Boolean, default: false },
  liverDisease: { type: Boolean, default: false },
  
  // Family members with fever
  familyWithFever: [{
    relation: String,
    diagnosedWith: String,
    date: Date
  }],
  
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('FamilyHistory', familyHistorySchema);
