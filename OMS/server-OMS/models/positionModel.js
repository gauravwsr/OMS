const mongoose = require("mongoose");

// Define Position schema
const PositionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Super_Admin", "Admin", "Employee", "Intern"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Number, // userId of the person who created this position
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Position", PositionSchema);
