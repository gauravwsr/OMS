const Task = require("../models/taskModel");
const WorkingProject = require("../models/workingProjectModel");
const ClientProject = require("../models/clientProjectModel");
const Candidate = require("../models/Candidate");

// Create a new task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate, taskPoints } =
      req.body;

    // Get current user info
    const currentUser = req.user;
    console.log('Current user:', currentUser);
    console.log('Project ID:', projectId);

    // Verify project exists and user is team lead
    // Try to find project by MongoDB ObjectId first in WorkingProject
    let project = await WorkingProject.findById(projectId);
    
    // If not found by ObjectId, try finding by projectId field (string) in WorkingProject
    if (!project) {
      project = await WorkingProject.findOne({ projectId: projectId });
    }
    
    // If still not found, try ClientProject as fallback
    if (!project) {
      project = await ClientProject.findById(projectId);
    }
    
    // If still not found, try ClientProject by projectId field
    if (!project) {
      project = await ClientProject.findOne({ projectId: projectId });
    }
    
    console.log('Found project:', project ? 'Yes' : 'No');
    if (project) {
      console.log('Project found in:', project.constructor.modelName);
      console.log('Project details:', {
        _id: project._id,
        projectId: project.projectId,
        clientName: project.clientName,
        assignedTeamLead: project.assignedTeamLead,
        teamLeadId: project.teamLeadId
      });
    }
    
    if (!project) {
      console.log('Project not found with ID:', projectId);
      return res.status(404).json({ error: "Project not found" });
    }

    console.log('Project teamLeadId:', project.teamLeadId);
    console.log('Project assignedTeamLead:', project.assignedTeamLead);
    console.log('Current user ID:', currentUser.id);
    console.log('Current user name:', currentUser.name);

    // Check if current user is the team lead for this project
    const isTeamLeadById = project.teamLeadId && project.teamLeadId.toString() === currentUser.id;
    const isTeamLeadByName = project.assignedTeamLead === currentUser.name;
    
    console.log('Is team lead by ID:', isTeamLeadById);
    console.log('Is team lead by name:', isTeamLeadByName);

    // For now, let's be more permissive during testing - allow if either condition is met OR if no team lead is assigned
    if (!isTeamLeadById && !isTeamLeadByName && project.assignedTeamLead && project.teamLeadId) {
      return res
        .status(403)
        .json({
          error:
            "Only the assigned team lead can create tasks for this project",
        });
    }

    // Process assignedTo data to match the expected schema format
    let processedAssignedTo = [];
    
    console.log('Raw assignedTo data:', JSON.stringify(assignedTo, null, 2));
    
    if (assignedTo && Array.isArray(assignedTo)) {
      // Flatten the array if it's nested
      let flattenedAssignedTo = assignedTo;
      
      // Check if the first element is itself an array (nested structure)
      if (assignedTo.length > 0 && Array.isArray(assignedTo[0])) {
        flattenedAssignedTo = assignedTo.flat();
      }
      
      // Process each assignment and validate against Candidate model
      for (const assignment of flattenedAssignedTo) {
        console.log('Processing assignment:', JSON.stringify(assignment, null, 2));
        
        let candidateData = null;
        let employeeId = null;
        let employeeName = null;
        let employeeEmail = null;
        
        // Extract employee information from different formats
        if (typeof assignment === 'string') {
          // If it's just a string, treat it as candidate ID or name
          employeeId = assignment;
          employeeName = assignment;
        } else if (assignment.employeeId && typeof assignment.employeeId === 'object') {
          // Check if employeeId is an array (malformed data from frontend)
          if (Array.isArray(assignment.employeeId) && assignment.employeeId.length > 0) {
            const firstItem = assignment.employeeId[0];
            if (firstItem.employeeId && typeof firstItem.employeeId === 'object') {
              // Extract from nested structure
              employeeId = firstItem.employeeId._id || firstItem.employeeId.id;
              employeeName = firstItem.employeeId.name || firstItem.employeeId.fullName || firstItem.name;
              employeeEmail = firstItem.employeeId.email || firstItem.employeeId.personalMail || firstItem.email;
            } else {
              // Simple array structure
              employeeId = firstItem.employeeId || firstItem.id || firstItem._id;
              employeeName = firstItem.name || firstItem.fullName;
              employeeEmail = firstItem.email || firstItem.personalMail;
            }
          } else {
            // Normal object structure (populated employee data)
            employeeId = assignment.employeeId._id || assignment.employeeId.id || assignment.employeeId.candidateId;
            employeeName = assignment.employeeId.name || assignment.employeeId.fullName || assignment.name;
            employeeEmail = assignment.employeeId.email || assignment.employeeId.personalMail || assignment.email;
          }
        } else {
          // If it's a simple object, check if fields are arrays (malformed data)
          if (Array.isArray(assignment.employeeId)) {
            // Handle malformed data where employeeId is an array
            const firstItem = assignment.employeeId[0];
            if (firstItem && firstItem.employeeId && typeof firstItem.employeeId === 'object') {
              employeeId = firstItem.employeeId._id || firstItem.employeeId.id;
              employeeName = firstItem.employeeId.name || firstItem.employeeId.fullName;
              employeeEmail = firstItem.employeeId.email || firstItem.employeeId.personalMail;
            }
          } else if (Array.isArray(assignment.name)) {
            // Handle malformed data where name is an array
            const firstItem = assignment.name[0];
            if (firstItem && firstItem.employeeId && typeof firstItem.employeeId === 'object') {
              employeeId = firstItem.employeeId._id || firstItem.employeeId.id;
              employeeName = firstItem.employeeId.name || firstItem.employeeId.fullName;
              employeeEmail = firstItem.employeeId.email || firstItem.employeeId.personalMail;
            } else {
              employeeId = firstItem.employeeId || firstItem.id || firstItem._id;
              employeeName = firstItem.name || firstItem.fullName;
              employeeEmail = firstItem.email || firstItem.personalMail;
            }
          } else {
            // Normal simple object
            employeeId = assignment.employeeId || assignment.id || assignment._id || assignment.candidateId;
            employeeName = assignment.name || assignment.fullName;
            employeeEmail = assignment.email || assignment.personalMail;
          }
        }
        
        // Try to find the candidate in the database
        try {
          if (employeeId) {
            // Try to find by MongoDB _id first
            candidateData = await Candidate.findById(employeeId);
            
            // If not found by _id, try by candidateId
            if (!candidateData) {
              candidateData = await Candidate.findOne({ candidateId: employeeId });
            }
            
            // If still not found, try by name
            if (!candidateData && employeeName) {
              candidateData = await Candidate.findOne({ fullName: employeeName });
            }
            
            // If still not found, try by email
            if (!candidateData && employeeEmail) {
              candidateData = await Candidate.findOne({ 
                $or: [
                  { personalMail: employeeEmail },
                  { officialEmail: employeeEmail },
                  { email: employeeEmail }
                ]
              });
            }
          }
          
          // If candidate found, use their data
          if (candidateData) {
            processedAssignedTo.push({
              employeeId: candidateData._id.toString(),
              name: candidateData.fullName,
              email: candidateData.personalMail || candidateData.officialEmail || candidateData.email,
              role: candidateData.role || 'Employee'
            });
            console.log('Found candidate:', candidateData.fullName, 'with ID:', candidateData._id);
          } else {
            // If no candidate found, create entry with provided data and add warning
            console.warn('Candidate not found for:', employeeId || employeeName || employeeEmail);
            
            // Ensure employeeName is a string for email generation
            const nameForEmail = (typeof employeeName === 'string') ? employeeName : 'unknown';
            const defaultEmail = employeeEmail || (nameForEmail !== 'unknown' ? nameForEmail.toLowerCase().replace(/\s+/g, '') + '@company.com' : 'unknown@company.com');
            
            processedAssignedTo.push({
              employeeId: employeeId || 'unknown',
              name: nameForEmail,
              email: defaultEmail,
              role: 'Employee'
            });
          }
        } catch (error) {
          console.error('Error finding candidate:', error);
          // Fallback to provided data
          const nameForEmail = (typeof employeeName === 'string') ? employeeName : 'Unknown Employee';
          processedAssignedTo.push({
            employeeId: employeeId || 'unknown',
            name: nameForEmail,
            email: employeeEmail || 'unknown@company.com',
            role: 'Employee'
          });
        }
      }
    }

    console.log('Processed assignedTo:', processedAssignedTo);

    // Validate processed data
    processedAssignedTo.forEach((assignment, index) => {
      if (!assignment.employeeId) {
        console.error(`Assignment ${index} missing employeeId:`, assignment);
      }
      if (!assignment.name) {
        console.error(`Assignment ${index} missing name:`, assignment);
      }
      if (!assignment.email) {
        console.error(`Assignment ${index} missing email:`, assignment);
      }
    });

    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo: processedAssignedTo, // Use processed data
      assignedBy: {
        employeeId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      },
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      taskPoints: taskPoints || [],
      status: processedAssignedTo && processedAssignedTo.length > 0 ? "In Progress" : "Pending",
    });

    // Calculate initial progress
    newTask.calculateProgress();

    const savedTask = await newTask.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: savedTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

// Get all tasks for a project (filtered by status)
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let filter = { projectId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate("projectId", "projectId clientName");

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Update task assignment
const updateTaskAssignment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update assignment
    task.assignedTo = assignedTo;

    // Update status based on assignment
    if (assignedTo && assignedTo.length > 0) {
      if (task.status === "Pending") {
        task.status = "In Progress";
      }
    } else {
      task.status = "Pending";
    }

    await task.save();

    res.json({
      success: true,
      message: "Task assignment updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task assignment:", error);
    res.status(500).json({ error: "Failed to update task assignment" });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === "Completed") {
      task.completedAt = new Date();
      // Mark all task points as completed
      task.taskPoints.forEach((point) => {
        if (!point.isCompleted) {
          point.isCompleted = true;
          point.completedAt = new Date();
        }
      });
    }

    task.calculateProgress();
    await task.save();

    // Update project progress if task is completed
    if (status === "Completed" && oldStatus !== "Completed") {
      await updateProjectProgress(task.projectId);
    }

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
};

// Update task points (mark as completed)
const updateTaskPoint = async (req, res) => {
  try {
    const { taskId, pointId } = req.params;
    const { isCompleted, completedBy } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskPoint = task.taskPoints.id(pointId);
    if (!taskPoint) {
      return res.status(404).json({ error: "Task point not found" });
    }

    taskPoint.isCompleted = isCompleted;
    if (isCompleted) {
      taskPoint.completedBy = completedBy;
      taskPoint.completedAt = new Date();
    } else {
      taskPoint.completedBy = null;
      taskPoint.completedAt = null;
    }

    // Recalculate progress
    task.calculateProgress();
    await task.save();

    // Update project progress
    await updateProjectProgress(task.projectId);

    res.json({
      success: true,
      message: "Task point updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task point:", error);
    res.status(500).json({ error: "Failed to update task point" });
  }
};

// Add task points to existing task
const addTaskPoints = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { taskPoints } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Add new points
    taskPoints.forEach((point, index) => {
      task.taskPoints.push({
        ...point,
        order: task.taskPoints.length + index,
      });
    });

    task.calculateProgress();
    await task.save();

    res.json({
      success: true,
      message: "Task points added successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error adding task points:", error);
    res.status(500).json({ error: "Failed to add task points" });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update project progress after task deletion
    await updateProjectProgress(task.projectId);

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Add comment to task
const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;
    const currentUser = req.user;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.comments.push({
      commentBy: currentUser.name,
      comment,
      commentAt: new Date(),
    });

    await task.save();

    res.json({
      success: true,
      message: "Comment added successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Helper function to update project progress
const updateProjectProgress = async (projectId) => {
  try {
    // Try to find project in WorkingProject first
    let project = await WorkingProject.findById(projectId);
    
    // If not found, try ClientProject
    if (!project) {
      project = await ClientProject.findById(projectId);
    }
    
    if (!project) return;

    const tasks = await Task.find({ projectId });

    if (tasks.length === 0) {
      project.progress = 0;
    } else {
      const totalProgress = tasks.reduce(
        (sum, task) => sum + task.progressPercentage,
        0
      );
      project.progress = Math.round(totalProgress / tasks.length);
    }

    // Update project status based on progress
    if (project.progress === 100) {
      project.projectStatus = "Completed";
    } else if (project.progress > 0) {
      project.projectStatus = "Active";
    }

    await project.save();
  } catch (error) {
    console.error("Error updating project progress:", error);
  }
};

// Get tasks assigned to current user (for employees)
const getMyTasks = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status } = req.query;

    let filter = {
      "assignedTo.employeeId": currentUser.id,
    };

    if (status && status !== "all") {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate("projectId", "projectId clientName");

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching my tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Get employees for task assignment
const getEmployeesForAssignment = async (req, res) => {
  try {
    const employees = await Candidate.find({}, {
      _id: 1,
      candidateId: 1,
      fullName: 1,
      personalMail: 1,
      officialEmail: 1,
      email: 1,
      role: 1,
      subRole: 1,
      phoneNo: 1
    }).sort({ fullName: 1 });

    // Format the response for easier use in frontend
    const formattedEmployees = employees.map(emp => ({
      id: emp._id,
      candidateId: emp.candidateId,
      name: emp.fullName,
      email: emp.personalMail || emp.officialEmail || emp.email,
      role: emp.role,
      subRole: emp.subRole,
      phone: emp.phoneNo
    }));

    res.json({
      success: true,
      message: "Employees retrieved successfully",
      data: formattedEmployees,
    });
  } catch (error) {
    console.error("Error retrieving employees for assignment:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve employees",
      message: error.message 
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTaskAssignment,
  updateTaskStatus,
  updateTaskPoint,
  addTaskPoints,
  deleteTask,
  addTaskComment,
  getMyTasks,
  getEmployeesForAssignment,
};
