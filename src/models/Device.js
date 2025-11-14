const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deviceName: {
      type: String,
      required: true,
    },

    deviceType: {
      type: String,
      required: true,
      enum: [
        "thermometer",
        "smartwatch",
        "fitness_tracker",
        "pulse_oximeter",
        "other",
      ],
    },

    bluetoothId: String,
    isConnected: { type: Boolean, default: false },
    lastSync: Date,
    batteryLevel: Number,
    firmwareVersion: String,
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ patientId: 1, isConnected: 1 });

module.exports = mongoose.model("Device", deviceSchema);
