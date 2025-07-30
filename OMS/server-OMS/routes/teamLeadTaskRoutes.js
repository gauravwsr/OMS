const express = require("express");
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  updateTaskAssignment,
  updateTaskStatus,
  updateTaskPoint,
  addTaskPoints,
  deleteTask,
  addTaskComment,
  getMyTasks,
} = require("../controllers/teamLeadTaskController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// Task CRUD operations
router.post("/projects/:projectId/tasks", createTask);
router.get("/projects/:projectId/tasks", getProjectTasks);
router.put("/tasks/:taskId/assignment", updateTaskAssignment);
router.put("/tasks/:taskId/status", updateTaskStatus);
router.delete("/tasks/:taskId", deleteTask);

// Task points management
router.put("/tasks/:taskId/points/:pointId", updateTaskPoint);
router.post("/tasks/:taskId/points", addTaskPoints);

// Comments
router.post("/tasks/:taskId/comments", addTaskComment);

// Employee tasks
router.get("/my-tasks", getMyTasks);

module.exports = router;
