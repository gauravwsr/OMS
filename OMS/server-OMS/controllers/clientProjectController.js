const ClientProject = require("../models/clientProjectModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// @desc    Get all client projects
// @route   GET /api/client-projects
// @access  Private
const getAllClientProjects = async (req, res) => {
  try {
    const projects = await ClientProject.getAllWithTeamLeads();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get projects assigned to a specific team lead
// @route   GET /api/client-projects/team-lead/:identifier
// @access  Private
const getProjectsForTeamLead = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is ObjectId format
    let query = {};
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = {
        $or: [
          { teamLeadId: identifier },
          { assignedTeamLead: identifier },
          { leadName: identifier },
        ],
      };
    } else {
      query = {
        $or: [{ assignedTeamLead: identifier }, { leadName: identifier }],
      };
    }

    const projects = await ClientProject.find(query)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
      teamLead: identifier,
    });
  } catch (error) {
    console.error("Error fetching team lead projects:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get single client project
// @route   GET /api/client-projects/:id
// @access  Private
const getClientProject = async (req, res) => {
  try {
    const project = await ClientProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization phoneNumber")
      .populate("assignedBy", "name email")
      .populate("notes.addedBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching client project:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Create new client project
// @route   POST /api/client-projects
// @access  Private (Project Manager only)
const createClientProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      // Auto-generate project ID if not provided
      projectId: req.body.projectId || `TT-${Date.now()}`,
      // Auto-generate password if not provided
      projectPassword:
        req.body.projectPassword || Math.random().toString(36).substring(2, 10),
    };

    const project = await ClientProject.create(projectData);

    const populatedProject = await ClientProject.findById(project._id)
      .populate("teamLeadId", "name email subRole")
      .populate("assignedBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating client project:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Project ID already exists",
      });
    }

    res.status(400).json({
      success: false,
      message: "Invalid project data",
      error: error.message,
    });
  }
};

// @desc    Assign team lead to project
// @route   PUT /api/client-projects/:id/assign-team-lead
// @access  Private (Project Manager only)
// const assignTeamLead = async (req, res) => {
//   try {
//     const { teamLeadId, teamLeadName } = req.body;
//     const projectId = req.params.id;

//     // Validate team lead exists
//     const teamLead = await User.findById(teamLeadId);
//     if (!teamLead) {
//       return res.status(404).json({
//         success: false,
//         message: 'Team lead not found'
//       });
//     }

//     // Check if team lead has appropriate role
//     if (teamLead.subRole !== 'Team Lead' && teamLead.subRole !== 'Team Leader') {
//       return res.status(400).json({
//         success: false,
//         message: 'Selected user is not a team lead'
//       });
//     }

//     // Find and update project
//     const project = await ClientProject.findById(projectId);
//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Assign team lead using the model method
//     await project.assignTeamLead(
//       teamLeadName || teamLead.name,
//       teamLeadId,
//       req.user?.id // Assuming user is attached to request via auth middleware
//     );

//     const updatedProject = await ClientProject.findById(projectId)
//       .populate('teamLeadId', 'name email subRole specialization')
//       .populate('assignedBy', 'name email');

//     res.status(200).json({
//       success: true,
//       data: updatedProject,
//       message: `Team lead ${teamLead.name} assigned successfully`
//     });
//   } catch (error) {
//     console.error('Error assigning team lead:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

const assignTeamLeadToProject = async (req, res) => {
  try {
    const { teamLeadId, teamLeadName } = req.body;
    const project = await ClientProject.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    project.teamLeadId = teamLeadId;
    project.assignedTeamLead = teamLeadName;
    await project.save();
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client project
// @route   PUT /api/client-projects/:id
// @access  Private
const updateClientProject = async (req, res) => {
  try {
    const project = await ClientProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update project fields
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        project[key] = req.body[key];
      }
    });

    await project.save();

    const updatedProject = await ClientProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email");

    res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating client project:", error);
    res.status(400).json({
      success: false,
      message: "Invalid update data",
      error: error.message,
    });
  }
};

// @desc    Delete client project
// @route   DELETE /api/client-projects/:id
// @access  Private (Project Manager only)
const deleteClientProject = async (req, res) => {
  try {
    const project = await ClientProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await ClientProject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client project:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Add note to project
// @route   POST /api/client-projects/:id/notes
// @access  Private
const addProjectNote = async (req, res) => {
  try {
    const { content } = req.body;
    const project = await ClientProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const newNote = {
      content,
      addedBy: req.user?.id,
      addedAt: new Date(),
    };

    project.notes.push(newNote);
    await project.save();

    const updatedProject = await ClientProject.findById(req.params.id).populate(
      "notes.addedBy",
      "name email"
    );

    res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Note added successfully",
    });
  } catch (error) {
    console.error("Error adding project note:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get team leads (users with Team Lead role)
// @route   GET /api/team-leads
// @access  Private
const getTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.find({
      $or: [{ subRole: "Team Lead" }, { subRole: "Team Leader" }],
    })
      .select("name email subRole specialization phoneNumber department")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: teamLeads.length,
      data: teamLeads,
    });
  } catch (error) {
    console.error("Error fetching team leads:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Import remote projects from external API
// @route   POST /api/client-projects/import-remote
// @access  Private
const importRemoteProjects = async (req, res) => {
  try {
    // Dynamically import node-fetch
    const fetch = (await import("node-fetch")).default;

    // Fetch data from remote API
    const response = await fetch(
      "https://crm-brown-gamma.vercel.app/api/client-projects"
    );

    if (!response.ok) {
      throw new Error(`Remote API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched remote projects:", data);

    // Process the data - handle different response formats
    const projectsData = Array.isArray(data)
      ? data
      : data.data || data.projects || [];

    if (!Array.isArray(projectsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format from remote API",
      });
    }

    // Import/update each project
    const results = [];
    let importedCount = 0;
    let updatedCount = 0;

    for (const remoteProject of projectsData) {
      try {
        // Check if project already exists by external ID or project ID
        let existingProject = await ClientProject.findOne({
          $or: [
            { externalId: remoteProject._id },
            { projectId: remoteProject.projectId },
          ],
        });

        // Prepare project data
        const projectData = {
          projectId:
            remoteProject.projectId ||
            `IMPORT-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          leadName: remoteProject.leadName || "Imported Lead",
          clientName: remoteProject.clientName || "Imported Client",
          finalAmount: remoteProject.finalAmount || 0,
          projectStatus: remoteProject.projectStatus || "Active",
          projectPassword:
            remoteProject.projectPassword ||
            Math.random().toString(36).substring(2, 10),
          assignedTeamLead: remoteProject.assignedTeamLead || null,
          teamLeadId: remoteProject.teamLeadId || null,
          externalId: remoteProject._id,
          // Additional fields from remote
          description: remoteProject.description || "",
          budget: remoteProject.budget || remoteProject.finalAmount || 0,
          progress: remoteProject.progress || 0,
          technologies: remoteProject.technologies || [],
          milestones: remoteProject.milestones || [],
          risks: remoteProject.risks || [],
          tasks: remoteProject.tasks || {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
          },
        };

        if (existingProject) {
          // Update existing project
          Object.keys(projectData).forEach((key) => {
            if (projectData[key] !== undefined) {
              existingProject[key] = projectData[key];
            }
          });
          await existingProject.save();
          results.push(existingProject);
          updatedCount++;
        } else {
          // Create new project
          const newProject = new ClientProject(projectData);
          await newProject.save();
          results.push(newProject);
          importedCount++;
        }
      } catch (projectError) {
        console.error("Error processing individual project:", projectError);
        // Continue with other projects even if one fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} new projects and updated ${updatedCount} existing projects`,
      data: {
        imported: importedCount,
        updated: updatedCount,
        total: results.length,
        projects: results,
      },
    });
  } catch (error) {
    console.error("Error importing remote projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to import remote projects",
      error: error.message,
    });
  }
};

module.exports = {
  getAllClientProjects,
  getProjectsForTeamLead,
  getClientProject,
  createClientProject,
  assignTeamLeadToProject,
  updateClientProject,
  deleteClientProject,
  addProjectNote,
  getTeamLeads,
  importRemoteProjects,
};
