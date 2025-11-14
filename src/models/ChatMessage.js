const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },

    content: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      default: "en",
    },

    modelVersion: String,
    confidence: Number,
    sessionId: String,
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ patientId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
