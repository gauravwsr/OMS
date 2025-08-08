const express = require("express");
const moment = require("moment-timezone");
const {
  validateCheckInTime,
  getCurrentISTTime,
} = require("./utils/attendanceTimeValidation");

const app = express();
app.use(express.json());

// Test endpoint - no auth required for testing
app.get("/test-validation", (req, res) => {
  try {
    const validation = validateCheckInTime();
    const currentTime = getCurrentISTTime();

    console.log("API Test - Current validation result:");
    console.log(`Time: ${currentTime.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`Message: "${validation.message}"`);
    console.log(`Status: ${validation.status}`);

    res.json({
      success: true,
      currentTime: currentTime.format("YYYY-MM-DD HH:mm:ss"),
      validation: validation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in test validation:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = 3555; // Different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Test validation server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test-validation`);
});
