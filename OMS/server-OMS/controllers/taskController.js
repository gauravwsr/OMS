const Task = require("../models/taskModel");

// Get tasks for a specific user email
exports.getTasks = async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    // Get tasks assigned to this user
    const tasks = await Task.find({ assignedTo: userEmail });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

// Add a new task with email assignment
exports.addTask = async (req, res) => {
  try {
    const { title, assignedTo, assignedBy } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!assignedTo)
      return res.status(400).json({ message: "Assigned email is required" });
    if (!assignedBy)
      return res.status(400).json({ message: "Assigner email is required" });

    const task = new Task({
      title,
      assignedTo,
      assignedBy,
      date: new Date().toLocaleString(),
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error adding task" });
  }
};

// Update task completion
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task" });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task" });
  }
};
