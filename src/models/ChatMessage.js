const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ["en", "hi", "kn"],
    default: "en",
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for faster queries
ChatMessageSchema.index({ userId: 1, created_at: -1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
