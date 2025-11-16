const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicationName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    prescribedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

medicationSchema.index({ patientId: 1, isActive: 1 });

module.exports = mongoose.model("Medication", medicationSchema);
