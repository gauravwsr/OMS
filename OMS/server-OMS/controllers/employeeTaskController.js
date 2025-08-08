const Task = require("../models/taskModel");
const ClientProject = require("../models/clientProjectModel");
const User = require("../models/userModel");

// @desc    Get tasks for a specific project (employee's tasks only)
// @route   GET /api/employee/projects/:projectId/tasks
// @access  Private (Employee)
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Get all tasks for this project
    const tasks = await Task.find({ projectId }).populate(
      "assignedTo",
      "name email"
    );

    // Filter tasks assigned to this employee
    const employeeTasks = tasks.filter(
      (task) =>
        task.assignedTo &&
        task.assignedTo.some(
          (assignee) =>
            assignee._id.toString() === userId ||
            assignee.email === req.user.email ||
            assignee.name === req.user.name
        )
    );

    res.status(200).json({
      success: true,
      count: employeeTasks.length,
      data: employeeTasks,
    });
  } catch (error) {
    console.error("Error fetching project tasks for employee:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Update task status (employee can only update their assigned tasks)
// @route   PUT /api/employee/tasks/:taskId/status
// @access  Private (Employee)
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if employee is assigned to this task
    const isAssigned =
      task.assignedTo &&
      task.assignedTo.some(
        (assignee) =>
          (assignee.employeeId && assignee.employeeId.toString() === userId) ||
          assignee.email === req.user.email ||
          assignee.name === req.user.name
      );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task",
      });
    }

    // Calculate progress based on task points
    let progressPercentage = 0;
    if (task.taskPoints && task.taskPoints.length > 0) {
      const completedPoints = task.taskPoints.filter(
        (point) => point.isCompleted
      ).length;
      progressPercentage = Math.round(
        (completedPoints / task.taskPoints.length) * 100
      );
    } else {
      progressPercentage =
        status === "Completed" ? 100 : status === "In Progress" ? 50 : 0;
    }

    const oldStatus = task.status;
    
    // Only record history if status is actually changing
    if (oldStatus !== status) {
      // Add to status history
      const historyEntry = {
        previousStatus: oldStatus,
        newStatus: status,
        changedBy: {
          userId: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        timestamp: new Date(),
        reason: req.body.reason || `Status changed from ${oldStatus} to ${status} by employee`
      };
      
      task.statusHistory.push(historyEntry);
    }

    task.status = status;
    task.progressPercentage = progressPercentage;

    if (status === "Completed") {
      task.completedAt = new Date();
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Update task point (employee can only update their assigned tasks)
// @route   PUT /api/employee/tasks/:taskId/points/:pointId
// @access  Private (Employee)
const updateTaskPoint = async (req, res) => {
  try {
    const { taskId, pointId } = req.params;
    const { isCompleted, completedBy } = req.body;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if employee is assigned to this task
    const isAssigned =
      task.assignedTo &&
      task.assignedTo.some(
        (assignee) =>
          (assignee.employeeId && assignee.employeeId.toString() === userId) ||
          assignee.email === req.user.email ||
          assignee.name === req.user.name
      );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task",
      });
    }

    const pointIndex = task.taskPoints.findIndex(
      (point) => point._id.toString() === pointId
    );
    if (pointIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Task point not found",
      });
    }

    task.taskPoints[pointIndex].isCompleted = isCompleted;
    task.taskPoints[pointIndex].completedBy = completedBy;
    task.taskPoints[pointIndex].completedAt = isCompleted ? new Date() : null;

    // Recalculate progress percentage
    const completedPoints = task.taskPoints.filter(
      (point) => point.isCompleted
    ).length;
    const progressPercentage = Math.round(
      (completedPoints / task.taskPoints.length) * 100
    );
    task.progressPercentage = progressPercentage;

    // Update task status based on progress
    if (progressPercentage === 100) {
      task.status = "Completed";
      task.completedAt = new Date();
    } else if (progressPercentage > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error updating task point:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get all tasks assigned to the current employee
// @route   GET /api/employee/my-tasks
// @access  Private (Employee)
const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find tasks where this employee is assigned
    const tasks = await Task.find({
      $or: [
        { "assignedTo.employeeId": userId },
        { "assignedTo.email": req.user.email },
        { "assignedTo.name": req.user.name },
      ],
    }).populate("projectId", "projectId clientName");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getProjectTasks,
  updateTaskStatus,
  updateTaskPoint,
  getMyTasks,
};
