const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    alertType: {
      type: String,
      required: true,
      enum: [
        "danger_sign",
        "high_fever",
        "critical_symptom",
        "lab_result",
        "medication_reminder",
        "checkup_due",
        "escalation_needed",
      ],
    },

    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    actionRequired: {
      type: Boolean,
      default: false,
    },

    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ patientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
