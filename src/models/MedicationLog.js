const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    takenAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["taken", "missed", "skipped"],
      default: "taken",
    },

    notes: String,
    sideEffects: [String],
  },
  {
    timestamps: true,
  }
);

medicationLogSchema.index({ medicationId: 1, takenAt: -1 });
medicationLogSchema.index({ patientId: 1, takenAt: -1 });

module.exports = mongoose.model("MedicationLog", medicationLogSchema);
