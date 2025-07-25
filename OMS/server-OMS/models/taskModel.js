const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: String, default: new Date().toLocaleString() },
});

module.exports = mongoose.model("Task", taskSchema);
