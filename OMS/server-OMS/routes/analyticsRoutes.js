const express = require("express");
const { 
  getLeaveAnalytics, 
  getAttendanceAnalytics, 
  getCheckInOutAnalytics,
  exportAnalyticsData 
} = require("../controllers/analyticsController.js");
const { protect } = require("../middlewares/auth.js");

const router = express.Router();

// Analytics routes
router.get("/leave-analytics", protect, getLeaveAnalytics);
router.get("/attendance-analytics", protect, getAttendanceAnalytics);
router.get("/checkinout-analytics", protect, getCheckInOutAnalytics);
router.get("/export/:type", protect, exportAnalyticsData);

module.exports = router;
