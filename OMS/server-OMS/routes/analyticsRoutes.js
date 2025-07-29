const express = require ("express");
const { 
  getLeaveAnalytics, 
  getAttendanceAnalytics, 
  getCheckInOutAnalytics,
  exportAnalyticsData 
} = require("../controllers/analyticsController.js");
const { authenticateToken } = require ("../middlewares/auth.js");

const router = express.Router();

// Analytics routes
router.get("/leave-analytics", authenticateToken, getLeaveAnalytics);
router.get("/attendance-analytics", authenticateToken, getAttendanceAnalytics);
router.get("/checkinout-analytics", authenticateToken, getCheckInOutAnalytics);
router.get("/export/:type", authenticateToken, exportAnalyticsData);

module.exports = router;
