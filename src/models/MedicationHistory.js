const mongoose = require('mongoose');

const medicationHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  medicationName: String,
  category: String, // "antibiotic", "painkiller", "antipyretic"
  
  // Prescription details
  prescribedBy: String,
  prescribedDate: Date,
  indication: String,
  
  // Allergic reaction
  hadReaction: { type: Boolean, default: false },
  reactionType: String, // "rash", "breathing", "swelling"
  reactionSeverity: {
    type: String,
    enum: ['mild', 'moderate', 'severe']
  },
  
  // Effectiveness
  wasEffective: Boolean,
  sideEffects: [String],
  
  notes: String
}, { timestamps: true });

medicationHistorySchema.index({ patientId: 1, medicationName: 1 });

module.exports = mongoose.model('MedicationHistory', medicationHistorySchema);
