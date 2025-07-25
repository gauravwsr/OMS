const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  title: String,
  dateTime: Date,
  location: String,
  participants: String,
  description: String,
  reminder: String,
});

module.exports = mongoose.model("Meeting", meetingSchema);
