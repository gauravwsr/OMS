const express = require("express");
const Project = require("../models/projectmodel");
const router = express.Router();

// Create a new project
router.post("/projects", async (req, res) => {
  try {
    const { title, description, startDate, dueDate, assignedEmployees } =
      req.body;

    const newProject = new Project({
      title,
      description,
      startDate,
      dueDate,
      assignedEmployees,
    });

    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project", error });
  }
});

// Get all projects
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

// Fetch and store all remote projects
router.post("/import-remote-projects", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(
      "https://crm-brown-gamma.vercel.app/api/client-projects"
    );
    if (!response.ok) throw new Error(`Remote API error: ${response.status}`);
    const data = await response.json();
    const projectsData = Array.isArray(data) ? data : data.projects || [];

    // Map and upsert each project
    const results = [];
    for (const remote of projectsData) {
      const filter = { externalId: remote._id || remote.id };
      const update = {
        title: remote.name || remote.title || "Untitled Project",
        description: remote.description || "",
        startDate: remote.startDate || new Date(),
        dueDate: remote.endDate || remote.dueDate || new Date(),
        assignedEmployees: remote.teamMembers || [],
        productProcedure: remote.productProcedure || "",
        ppt: remote.ppt || "",
        coveringLetter: remote.coveringLetter || "",
        assignTeamLead: remote.assignedTeamLead || null,
        tasks: remote.tasks
          ? [
              {
                name: "Completed",
                status: "completed",
                dueDate: null,
                completed: remote.tasks.completed >= 1,
              },
              {
                name: "In Progress",
                status: "inProgress",
                dueDate: null,
                completed: remote.tasks.inProgress >= 1,
              },
              {
                name: "Pending",
                status: "pending",
                dueDate: null,
                completed: remote.tasks.pending >= 1,
              },
            ]
          : [],
        externalId: remote._id || remote.id,
      };
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };
      const project = await Project.findOneAndUpdate(filter, update, options);
      results.push(project);
    }
    res
      .status(200)
      .json({
        message: "Projects imported/updated",
        count: results.length,
        projects: results,
      });
  } catch (error) {
    console.error("Error importing projects:", error);
    res
      .status(500)
      .json({ message: "Failed to import projects", error: error.message });
  }
});

// Edit/update a project
router.put("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project updated", project });
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error });
  }
});

module.exports = router;
