const ClientProject = require("../models/clientProjectModel");
const CrmProject = require("../models/crmProjectModel");
const WorkingProject = require("../models/workingProjectModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// @desc    Get all client projects
// @route   GET /api/client-projects
// @access  Private
const getAllClientProjects = async (req, res) => {
  try {
    // Use WorkingProject instead of ClientProject for API responses
    const projects = await WorkingProject.getAllWithTeamLeads();

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

    // Use WorkingProject instead of ClientProject
    const projects = await WorkingProject.find(query)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email")
      .populate("assignedEmployees.employeeId", "name email role subRole")
      .populate("crmProjectId")
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

// Get employees by sub-role
const getEmployeesBySubRole = async (req, res) => {
  try {
    const { subRole } = req.params;
    console.log("Fetching employees for subRole:", subRole);

    const employees = await User.find({
      role: "Employee",
      subRole: subRole,
    }).select("name email subRole department phoneNumber");

    console.log("Found employees:", employees.length);

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees by subRole:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message,
    });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "Employee",
    }).select("name email subRole department phoneNumber");

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching all employees:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message,
    });
  }
};

// @desc    Get single client project
// @route   GET /api/client-projects/:id
// @access  Private
const getClientProject = async (req, res) => {
  try {
    // Use WorkingProject instead of ClientProject
    const project = await WorkingProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization phoneNumber")
      .populate("assignedBy", "name email")
      .populate("notes.addedBy", "name email")
      .populate("crmProjectId");

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
      // Generate external ID for manual entries
      externalId: req.body.externalId || `MANUAL-${Date.now()}`,
    };

    // Create working project directly (not from CRM)
    const project = await WorkingProject.create(projectData);

    const populatedProject = await WorkingProject.findById(project._id)
      .populate("teamLeadId", "name email subRole")
      .populate("assignedBy", "name email")
      .populate("crmProjectId");

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

// const assignTeamLeadToProject = async (req, res) => {
//   try {
//     const { teamLeadId, teamLeadName } = req.body;
//     const project = await ClientProject.findById(req.params.id);
//     if (!project) {
//       return res.status(404).json({ success: false, message: 'Project not found' });
//     }
//     project.teamLeadId = teamLeadId;
//     project.assignedTeamLead = teamLeadName;
//     await project.save();
//     res.json({ success: true, data: project });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// @desc    Update client project
// @route   PUT /api/client-projects/:id
// @access  Private

const assignTeamLeadToProject = async (req, res) => {
  try {
    const { teamLeadId, teamLeadName } = req.body;
    const project = await WorkingProject.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Get today's date in YYYY-MM-DD format (no timing)
    const today = new Date().toISOString().slice(0, 10);

    // If there is a current team lead, update their history entry with unassigned date
    if (project.teamLeadId && project.assignedTeamLead) {
      // Find the current active assignment in history (the one without unassignedDate)
      const currentAssignmentIndex = project.teamLeadHistory.findIndex(
        (entry) =>
          entry.teamLeadId &&
          entry.teamLeadId.toString() === project.teamLeadId.toString() &&
          !entry.unassignedDate
      );

      if (currentAssignmentIndex !== -1) {
        project.teamLeadHistory[currentAssignmentIndex].unassignedDate = today;
      } else {
        // If no active assignment found in history, create one for the current team lead
        project.teamLeadHistory.push({
          teamLeadId: project.teamLeadId,
          teamLeadName: project.assignedTeamLead,
          assignedDate: project.assignedDate
            ? project.assignedDate.toISOString().slice(0, 10)
            : today,
          unassignedDate: today,
        });
      }
    }

    // Assign new team lead
    project.teamLeadId = teamLeadId;
    project.assignedTeamLead = teamLeadName;
    project.leadName = teamLeadName;
    project.assignedDate = new Date(today);
    project.hasLocalModifications = true; // Mark as locally modified

    // Add new assignment to history
    project.teamLeadHistory.push({
      teamLeadId,
      teamLeadName,
      assignedDate: today,
      unassignedDate: "", // Empty string indicates currently assigned
    });

    await project.save();

    const updatedProject = await WorkingProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email")
      .populate("crmProjectId");

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    console.error("Error assigning team lead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateClientProject = async (req, res) => {
  try {
    const project = await WorkingProject.findById(req.params.id);

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

    // Mark as locally modified
    project.hasLocalModifications = true;

    await project.save();

    const updatedProject = await WorkingProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email")
      .populate("crmProjectId");

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
    const project = await WorkingProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await WorkingProject.findByIdAndDelete(req.params.id);

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
    const project = await WorkingProject.findById(req.params.id);

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
    project.hasLocalModifications = true; // Mark as locally modified
    await project.save();

    const updatedProject = await WorkingProject.findById(req.params.id)
      .populate("notes.addedBy", "name email")
      .populate("crmProjectId");

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
        // Step 1: Save/Update in CRM collection (original data)
        let crmProject = await CrmProject.findOne({
          externalId: remoteProject._id,
        });

        const crmProjectData = {
          externalId: remoteProject._id,
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
          lastSyncedAt: new Date(),
          syncSource: "CRM",
          rawData: remoteProject, // Store raw data for reference
        };

        if (crmProject) {
          // Update existing CRM project
          Object.keys(crmProjectData).forEach((key) => {
            if (crmProjectData[key] !== undefined) {
              crmProject[key] = crmProjectData[key];
            }
          });
          await crmProject.save();
        } else {
          // Create new CRM project
          crmProject = new CrmProject(crmProjectData);
          await crmProject.save();
          importedCount++;
        }

        // Step 2: Sync with Working Project (editable copy)
        const workingProject = await WorkingProject.syncWithCrmProject(
          crmProject
        );
        results.push(workingProject);

        if (workingProject.isNew) {
          importedCount++;
        } else {
          updatedCount++;
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

// const assignEmployeesToProject = async (req, res) => {
//   try {
//     const { employees } = req.body; // [{ employeeId, name, role, subRole }]
//     const project = await ClientProject.findById(req.params.id);
//     if (!project) {
//       return res.status(404).json({ success: false, message: 'Project not found' });
//     }
//     project.assignedEmployees = employees;
//     await project.save();
//     res.json({ success: true, data: project });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const assignEmployeesToProject = async (req, res) => {
  try {
    const { employees } = req.body; // [{ employeeId }]
    const project = await WorkingProject.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Fetch full user info for each employee
    const assignedEmployees = [];
    for (const emp of employees) {
      let user = emp;
      if (!emp.name || !emp.role || !emp.subRole || !emp.email) {
        // Fetch complete user data if missing fields
        user = await User.findById(emp.employeeId);
        if (user) {
          assignedEmployees.push({
            employeeId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            subRole: user.subRole,
          });
        }
      } else {
        // Use provided data if complete
        assignedEmployees.push({
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          subRole: emp.subRole,
        });
      }
    }

    project.assignedEmployees = assignedEmployees;
    project.hasLocalModifications = true; // Mark as locally modified
    await project.save();

    const updatedProject = await WorkingProject.findById(req.params.id)
      .populate("assignedEmployees.employeeId", "name email role subRole")
      .populate("crmProjectId");

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    console.error("Error assigning employees:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project progress
// @route   PUT /api/client-projects/:id/progress
// @access  Private
const updateProjectProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const projectId = req.params.id;

    // Validate progress value
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100",
      });
    }

    const project = await WorkingProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update project progress
    project.progress = progress;

    // Update project status based on progress
    if (progress === 100) {
      project.projectStatus = "Completed";
    } else if (progress > 0) {
      project.projectStatus = "Active";
    }

    project.hasLocalModifications = true; // Mark as locally modified
    await project.save();

    res.status(200).json({
      success: true,
      message: "Project progress updated successfully",
      data: {
        projectId: project._id,
        progress: project.progress,
        projectStatus: project.projectStatus,
      },
    });
  } catch (error) {
    console.error("Error updating project progress:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get projects assigned to a specific employee
// @route   GET /api/client-projects/employee/:identifier
// @access  Private
const getProjectsForEmployee = async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log("Fetching projects for employee identifier:", identifier);

    // First, find the user by identifier to get their ObjectId
    let user = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    } else {
      // If not ObjectId, search by email or name
      user = await User.findOne({
        $or: [{ email: identifier }, { name: identifier }],
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Found user:", {
      id: user._id,
      name: user.name,
      email: user.email,
    });

    // Find projects where this employee is assigned directly to the project using user's ObjectId
    const directlyAssignedProjects = await WorkingProject.find({
      "assignedEmployees.employeeId": user._id,
    });

    console.log("Directly assigned projects:", directlyAssignedProjects.length);

    // Also find projects where this employee has tasks assigned
    const Task = require("../models/taskModel");

    const tasksAssignedToEmployee = await Task.find({
      "assignedTo.employeeId": user._id,
    })
      .select("projectId")
      .distinct("projectId");

    console.log("Tasks assigned to employee:", tasksAssignedToEmployee.length);

    // Get projects from task assignments using WorkingProject
    const taskAssignedProjects = await WorkingProject.find({
      _id: { $in: tasksAssignedToEmployee },
    });

    console.log("Task assigned projects:", taskAssignedProjects.length);

    // Combine both arrays and remove duplicates
    const allProjects = [...directlyAssignedProjects];

    taskAssignedProjects.forEach((taskProject) => {
      const exists = directlyAssignedProjects.find(
        (directProject) =>
          directProject._id.toString() === taskProject._id.toString()
      );
      if (!exists) {
        allProjects.push(taskProject);
      }
    });

    console.log("Total projects for employee:", allProjects.length);

    res.status(200).json({
      success: true,
      count: allProjects.length,
      data: allProjects,
    });
  } catch (error) {
    console.error("Error fetching employee projects:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Force sync working project with latest CRM data
// @route   PUT /api/client-projects/:id/sync-crm
// @access  Private (Project Manager only)
const forceSyncWithCrm = async (req, res) => {
  try {
    const workingProject = await WorkingProject.findById(
      req.params.id
    ).populate("crmProjectId");

    if (!workingProject) {
      return res.status(404).json({
        success: false,
        message: "Working project not found",
      });
    }

    if (!workingProject.crmProjectId) {
      return res.status(400).json({
        success: false,
        message: "This project is not linked to CRM data",
      });
    }

    // Get latest CRM data
    const crmProject = await CrmProject.findById(workingProject.crmProjectId);

    if (!crmProject) {
      return res.status(404).json({
        success: false,
        message: "CRM project not found",
      });
    }

    // Force update working project with CRM data (override local changes)
    const fieldsToSync = [
      "projectId",
      "leadName",
      "clientName",
      "finalAmount",
      "projectStatus",
      "description",
      "budget",
      "progress",
      "technologies",
      "milestones",
      "risks",
      "tasks",
    ];

    fieldsToSync.forEach((field) => {
      if (crmProject[field] !== undefined) {
        workingProject[field] = crmProject[field];
      }
    });

    workingProject.lastSyncedWithCrm = new Date();
    workingProject.hasLocalModifications = false; // Reset modification flag

    await workingProject.save();

    const updatedProject = await WorkingProject.findById(req.params.id)
      .populate("teamLeadId", "name email subRole specialization")
      .populate("assignedBy", "name email")
      .populate("crmProjectId");

    res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project synced with CRM data successfully",
    });
  } catch (error) {
    console.error("Error syncing with CRM:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get CRM sync status for all projects
// @route   GET /api/client-projects/sync-status
// @access  Private
const getCrmSyncStatus = async (req, res) => {
  try {
    const workingProjects = await WorkingProject.find({})
      .populate("crmProjectId", "lastSyncedAt")
      .select("projectId hasLocalModifications lastSyncedWithCrm crmProjectId");

    const syncStatus = workingProjects.map((project) => ({
      projectId: project.projectId,
      workingProjectId: project._id,
      hasLocalModifications: project.hasLocalModifications,
      lastSyncedWithCrm: project.lastSyncedWithCrm,
      linkedToCrm: !!project.crmProjectId,
      crmLastUpdated: project.crmProjectId?.lastSyncedAt || null,
    }));

    res.status(200).json({
      success: true,
      data: syncStatus,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get task history for all projects managed by project manager
// @route   GET /api/client-projects/tasks/history
// @access  Private (Project Manager)
const getProjectTaskHistory = async (req, res) => {
  try {
    const Task = require("../models/taskModel");
    const currentUser = req.user;
    console.log('Getting task history for project manager:', currentUser.id);

    // Get all projects where user is project manager
    const workingProjects = await WorkingProject.find({
      projectManager: currentUser.id,
    });

    const clientProjects = await ClientProject.find({
      projectManager: currentUser.id,
    });

    // Get all project IDs
    const workingProjectIds = workingProjects.map(p => p._id);
    const clientProjectIds = clientProjects.map(p => p._id);
    const allProjectIds = [...workingProjectIds, ...clientProjectIds];

    if (allProjectIds.length === 0) {
      return res.json({
        success: true,
        message: "No projects found for this project manager",
        data: []
      });
    }

    // Get all tasks from these projects that have status history
    const tasks = await Task.find({
      projectId: { $in: allProjectIds },
      'statusHistory.0': { $exists: true } // Only tasks with history
    })
    .populate('assignedTo.employeeId', 'name email')
    .populate('projectId', 'title client')
    .sort({ updatedAt: -1 });

    // Extract and format history entries
    const historyEntries = [];
    
    tasks.forEach(task => {
      task.statusHistory.forEach(history => {
        historyEntries.push({
          taskId: task._id,
          taskTitle: task.title,
          projectTitle: task.projectId?.title || 'Unknown Project',
          projectType: workingProjectIds.includes(task.projectId?._id) ? 'Working' : 'Client',
          previousStatus: history.previousStatus,
          newStatus: history.newStatus,
          changedBy: history.changedBy,
          timestamp: history.timestamp,
          reason: history.reason,
          assignedEmployees: task.assignedTo?.map(emp => ({
            name: emp.name || emp.employeeId?.name,
            email: emp.email || emp.employeeId?.email
          })) || []
        });
      });
    });

    // Sort by timestamp (most recent first)
    historyEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      message: "Task history retrieved successfully",
      data: {
        total: historyEntries.length,
        history: historyEntries,
        stats: {
          totalTasksWithHistory: tasks.length,
          totalProjects: allProjectIds.length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching project task history:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch task history",
      message: error.message 
    });
  }
};

module.exports = {
  getAllClientProjects,
  getProjectsForTeamLead,
  getProjectsForEmployee,
  getClientProject,
  createClientProject,
  assignTeamLeadToProject,
  updateClientProject,
  getEmployeesBySubRole,
  getAllEmployees,
  deleteClientProject,
  addProjectNote,
  getTeamLeads,
  importRemoteProjects,
  assignEmployeesToProject,
  updateProjectProgress,
  forceSyncWithCrm,
  getCrmSyncStatus,
  getProjectTaskHistory,
};
