const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: false,
    },
    assignedTo: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String,
      default: () => new Date().toLocaleString(),
    },
    userEmail: {
      type: String,
      required: false, // Keeping for backward compatibility
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
