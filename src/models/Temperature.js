const mongoose = require("mongoose");

const temperatureSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    temperature: {
      type: Number,
      required: true,
      min: 95,
      max: 108,
    },

    deviceId: String,

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

temperatureSchema.index({ patientId: 1, recordedAt: -1 });

module.exports = mongoose.model("Temperature", temperatureSchema);
