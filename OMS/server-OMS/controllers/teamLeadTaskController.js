const Task = require("../models/taskModel");
const ClientProject = require("../models/clientProjectModel");

// Create a new task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate, taskPoints } =
      req.body;

    // Get current user info
    const currentUser = req.user;

    // Verify project exists and user is team lead
    const project = await ClientProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if current user is the team lead for this project
    if (
      project.teamLeadId !== currentUser.id &&
      project.assignedTeamLead !== currentUser.name
    ) {
      return res
        .status(403)
        .json({
          error:
            "Only the assigned team lead can create tasks for this project",
        });
    }

    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo: assignedTo || [], // Can be empty initially
      assignedBy: {
        employeeId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      },
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      taskPoints: taskPoints || [],
      status: assignedTo && assignedTo.length > 0 ? "In Progress" : "Pending",
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
    const project = await ClientProject.findById(projectId);
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
};
