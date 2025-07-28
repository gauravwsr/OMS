const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: String, default: new Date().toLocaleString() },
  assignedTo: { type: String, required: true }, // Email of the assigned user
  assignedBy: { type: String, required: true }, // Email of the user who created the task
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", taskSchema);
