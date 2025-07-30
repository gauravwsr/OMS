const express = require("express");
const router = express.Router();
const {
  getProjectTasks,
  updateTaskStatus,
  updateTaskPoint,
  getMyTasks,
} = require("../controllers/employeeTaskController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply auth middleware to all routes
router.use(authenticate);

// Employee can only view and update their assigned tasks
router.get("/projects/:projectId/tasks", getProjectTasks);
router.put("/tasks/:taskId/status", updateTaskStatus);
router.put("/tasks/:taskId/points/:pointId", updateTaskPoint);
router.get("/my-tasks", getMyTasks);

module.exports = router;
