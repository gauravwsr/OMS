const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getAttendanceValidation,
  getCurrentISTTime,
  validateCheckInTime,
  validateCheckOutTime,
} = require("../utils/attendanceTimeValidation");
const AttendanceService = require("../utils/attendanceService");

// Test time validation endpoint for development/debugging
router.get("/test-time-validation", protect, async (req, res) => {
  try {
    const { attendanceType = "check_in", testTime } = req.query;
    const userId = req.user._id || req.user.id;

    // Get current IST time or use test time
    let currentTime = getCurrentISTTime();
    if (testTime) {
      // Parse test time in format "HH:mm" or "YYYY-MM-DD HH:mm"
      if (testTime.includes(":")) {
        const moment = require("moment-timezone");
        if (testTime.length === 5) {
          // Just time, use today's date
          const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
          currentTime = moment.tz(`${today} ${testTime}`, "Asia/Kolkata");
        } else {
          // Full datetime
          currentTime = moment.tz(testTime, "Asia/Kolkata");
        }
      }
    }

    // Get today's attendance for validation
    const todayCheck =
      await AttendanceService.getTodayAttendanceWithWorkingHours(userId);

    if (!todayCheck.success) {
      return res.status(500).json({
        error: "Failed to check today's attendance",
        details: todayCheck.error,
      });
    }

    // Get validation result
    const validation = getAttendanceValidation(
      attendanceType,
      todayCheck,
      currentTime
    );

    // Also get individual validations for comparison
    const checkInValidation = validateCheckInTime(currentTime);
    const checkOutValidation = todayCheck.checkInRecord
      ? validateCheckOutTime(todayCheck.checkInRecord.timestamp, currentTime)
      : { message: "No check-in record found for check-out validation" };

    res.json({
      testInfo: {
        requestedAttendanceType: attendanceType,
        testTime: testTime || "current time",
        currentISTTime: currentTime.format("YYYY-MM-DD HH:mm:ss"),
        timezone: "Asia/Kolkata",
      },
      todayAttendance: {
        hasCheckIn: todayCheck.hasCheckIn,
        hasCheckOut: todayCheck.hasCheckOut,
        checkInTime: todayCheck.checkInRecord?.timestamp,
        checkOutTime: todayCheck.checkOutRecord?.timestamp,
        workingHours: todayCheck.workingHours,
      },
      validation: validation,
      individualValidations: {
        checkIn: checkInValidation,
        checkOut: checkOutValidation,
      },
      timeRules: {
        checkInRules: {
          before_10_30_AM: "✅ Normal check-in (Present - Full Day)",
          "10_30_AM_to_11_00_AM": "⚠️ Late check-in (Late Mark - Half Day)",
          after_11_00_AM: "❌ No check-in allowed (Absent)",
        },
        checkOutRules: {
          minimum_8_hours: "Check-out allowed only after 8 hours from check-in",
        },
      },
    });
  } catch (error) {
    console.error("Error in time validation test:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get current time in IST
router.get("/current-time", (req, res) => {
  const currentTime = getCurrentISTTime();
  res.json({
    currentISTTime: currentTime.format("YYYY-MM-DD HH:mm:ss"),
    currentTimeOnly: currentTime.format("HH:mm"),
    currentDate: currentTime.format("YYYY-MM-DD"),
    timezone: "Asia/Kolkata (IST)",
    dayOfWeek: currentTime.format("dddd"),
    timestamp: currentTime.valueOf(),
  });
});

// Get attendance rules documentation
router.get("/rules", (req, res) => {
  res.json({
    attendanceRules: {
      checkIn: {
        timeSlots: [
          {
            time: "Before 10:30 AM",
            status: "Present (Full Day)",
            allowed: true,
            icon: "✅",
            description: "Normal check-in allowed",
          },
          {
            time: "10:30 AM - 11:00 AM",
            status: "Late Mark (Half Day)",
            allowed: true,
            icon: "⚠️",
            description: "Late check-in allowed but marked as half day",
          },
          {
            time: "After 11:00 AM",
            status: "Absent",
            allowed: false,
            icon: "❌",
            description: "Check-in not allowed, marked as absent",
          },
        ],
      },
      checkOut: {
        rule: "Check-out allowed only after 8 hours from check-in time",
        minimumWorkingHours: 8,
        example: "If check-in at 9:00 AM, check-out allowed only after 5:00 PM",
        validation: "System prevents early check-out with appropriate message",
      },
      generalRules: [
        "All validations are done server-side using IST (Indian Standard Time)",
        "Multiple check-ins/check-outs on the same day are not allowed",
        "Attendance status is stored in database with detailed timestamps",
        "Face recognition data is used for attendance validation",
      ],
    },
    timezone: "Asia/Kolkata (IST)",
    version: "1.0.0",
  });
});

module.exports = router;
