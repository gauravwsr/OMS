const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, unique: true, required: true },
  title: String,
  hostUserId: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

module.exports = mongoose.model("Meeting", meetingSchema);
