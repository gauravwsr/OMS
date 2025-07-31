const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");

// Mock attendance storage (In production, use database)
let attendanceRecords = [];

// Get attendance history for logged-in user
router.get("/history", protect, async (req, res) => {
  try {
    // Filter attendance records for the current user
    const userAttendance = attendanceRecords.filter(
      (record) =>
        record.userId === req.user.id || record.userId === req.user.userId
    );

    // Sort by timestamp (newest first)
    userAttendance.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json(userAttendance);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark attendance for logged-in user
router.post("/mark", protect, async (req, res) => {
  try {
    const { method, timestamp } = req.body;

    const attendanceRecord = {
      id: Date.now().toString(),
      userId: req.user.id || req.user.userId,
      userName: req.user.name || req.user.fullName,
      method: method || "manual",
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    attendanceRecords.push(attendanceRecord);

    res.status(200).json({
      message: "Attendance marked successfully",
      record: attendanceRecord,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all attendance records (Admin only)
router.get("/all", protect, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== "Admin" && req.user.role !== "Super_Admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching all attendance records:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
