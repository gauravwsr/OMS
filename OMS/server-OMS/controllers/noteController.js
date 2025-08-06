const Note = require("../models/Note");

// Get Notes by User Email (for tasks assigned to the user)
exports.getNotes = async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    // Find tasks assigned to the user
    const notes = await Note.find({ assignedTo: userEmail });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Create a new Note/Task
exports.createNote = async (req, res) => {
  try {
    const { title, assignedTo, assignedBy, completed = false, date } = req.body;
    if (!title || !assignedTo || !assignedBy) {
      return res
        .status(400)
        .json({ message: "Title, assignedTo, and assignedBy are required" });
    }

    const newNote = new Note({
      title,
      assignedTo,
      assignedBy,
      completed,
      date: date || new Date().toLocaleString(),
    });
    await newNote.save();

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Update Note/Task (for toggling completion status)
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedNote = await Note.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete Note by ID
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
