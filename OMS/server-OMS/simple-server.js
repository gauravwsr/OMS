const express = require("express");
require("dotenv").config();

// Set default JWT secret if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your-secret-key-for-oms-application-2024";
}

const app = express();
app.use(express.json());

// Import time validation functions
const {
  validateCheckInTime,
  validateCheckOutTime,
  getCurrentISTTime,
} = require("./utils/attendanceTimeValidation");

// Simple test endpoint without auth
app.get("/api/attendance/validate-time", (req, res) => {
  try {
    const { attendanceType = "check_in" } = req.query;

    const validation =
      attendanceType === "check_in"
        ? validateCheckInTime()
        : validateCheckOutTime(null);

    const currentTime = getCurrentISTTime();

    console.log(`Time validation request - Type: ${attendanceType}`);
    console.log(`Validation result:`, validation);

    res.json({
      success: true,
      validation: {
        isValid: validation.isAllowed,
        message: validation.message,
        status: validation.status,
        isHalfDay: validation.isHalfDay || false,
        isLate: validation.isLate || false,
        currentTime: currentTime.format("YYYY-MM-DD HH:mm:ss"),
        attendanceType: attendanceType,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting time validation status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get time validation status",
      error: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "oms-backend",
    timestamp: new Date().toISOString(),
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Simple OMS server running on http://localhost:${PORT}`);
  console.log(
    `📋 Time validation endpoint: http://localhost:${PORT}/api/attendance/validate-time`
  );
});
