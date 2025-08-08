const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  markAttendance,
  getAttendanceHistory,
  getTodayAttendance,
  getDailyWorkingHours,
  getAllAttendance,
  getAttendanceAnalytics,
  getRecentAttendance,
  getTodayAttendanceSummary,
  deleteAttendance,
  healthCheck,
  getRegisteredUsersAPI,
} = require("../controllers/attendanceController");

const {
  validateFaceRecognitionData,
  checkFaceRecognitionHealth,
} = require("../middlewares/faceRecognitionMiddleware");

// Health check endpoint
router.get("/health", healthCheck);

// Check face recognition server health
router.get(
  "/face-recognition/health",
  checkFaceRecognitionHealth,
  (req, res) => {
    res.status(200).json({
      message: "Face recognition health check",
      ...req.faceRecognitionHealth,
    });
  }
);

// Get recent attendance records
router.get("/recent", protect, getRecentAttendance);

// Get attendance history for logged-in user
router.get("/history", protect, getAttendanceHistory);

// Get today's attendance for logged-in user
router.get("/today", protect, getTodayAttendance);

// Get daily working hours for logged-in user
router.get("/working-hours", protect, getDailyWorkingHours);

// Mark attendance for logged-in user (with face recognition validation)
router.post("/mark", protect, validateFaceRecognitionData, markAttendance);

// Get all attendance records (Admin only)
router.get("/all", protect, getAllAttendance);

// Get today's attendance summary for all employees (Admin only)
router.get("/today-summary", protect, getTodayAttendanceSummary);

// Get attendance analytics (Admin only)
router.get("/analytics", protect, getAttendanceAnalytics);

// Get registered users from face recognition server
router.get("/registered-users", getRegisteredUsersAPI);

// Delete attendance record (Super Admin only)
router.delete("/:attendanceId", protect, deleteAttendance);

module.exports = router;
