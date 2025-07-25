const express = require('express');
const Project = require('../models/projectmodel');
const router = express.Router();

// Create a new project
router.post('/projects', async (req, res) => {
  try {
    const { title, description, startDate, dueDate, assignedEmployees } = req.body;

    const newProject = new Project({
      title,
      description,
      startDate,
      dueDate,
      assignedEmployees,
    });

    await newProject.save();
    res.status(201).json({ message: "Project created successfully", newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project", error });
  }
});

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

module.exports = router;