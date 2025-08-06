const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const AttendanceService = require("../utils/attendanceService");
const {
  verifyUserRegistration,
  getRegisteredUsers,
} = require("../middlewares/faceRecognitionMiddleware");

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    console.log("📝 Attendance marking request received");
    console.log(
      "User:",
      req.user
        ? { id: req.user._id || req.user.id, name: req.user.name }
        : "No user"
    );
    console.log("Request body:", req.body);

    const {
      method = "manual",
      status = "present",
      attendance_type = "check_in", // New field for check_in/check_out
      confidence,
      recognizedName,
      faceRecognitionDetails,
      location,
      notes,
      imageData,
    } = req.body;

    // Enhanced user validation
    if (!req.user) {
      console.log("❌ No user found in request");
      return res.status(401).json({
        message: "User authentication required",
        error: "No user found in request",
      });
    }

    const userId = req.user._id || req.user.id;
    const userName = req.user.name || req.user.fullName;

    if (!userId) {
      console.log("❌ No userId found");
      return res.status(400).json({
        message: "User ID is required",
        error: "Invalid user data",
      });
    }

    console.log("✅ User validated:", { userId, userName });

    // Check today's attendance to determine check-in/check-out
    const todayCheck =
      await AttendanceService.getTodayAttendanceWithWorkingHours(userId);

    if (!todayCheck.success) {
      console.log("❌ Today check failed:", todayCheck.error);
      return res.status(500).json({
        message: "Failed to check today's attendance",
        error: todayCheck.error,
      });
    }

    // Determine attendance type based on existing records
    let finalAttendanceType = attendance_type;
    if (todayCheck.hasCheckIn && !todayCheck.hasCheckOut) {
      finalAttendanceType = "check_out"; // Force check-out if already checked in
    } else if (todayCheck.hasCheckIn && todayCheck.hasCheckOut) {
      return res.status(400).json({
        message:
          "Attendance already completed for today (both check-in and check-out done)",
        existingRecords: {
          checkIn: todayCheck.checkInRecord,
          checkOut: todayCheck.checkOutRecord,
          workingHours: todayCheck.workingHours,
        },
      });
    }

    // Validate minimum working hours for check-out (6 hours minimum)
    if (
      finalAttendanceType === "check_out" &&
      todayCheck.hasCheckIn &&
      todayCheck.checkInRecord
    ) {
      const checkInTime = new Date(todayCheck.checkInRecord.timestamp);
      const currentTime = new Date();
      const timeDifferenceInHours =
        (currentTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

      const MINIMUM_WORKING_HOURS = 6;

      if (timeDifferenceInHours < MINIMUM_WORKING_HOURS) {
        const remainingTime = MINIMUM_WORKING_HOURS - timeDifferenceInHours;
        const remainingHours = Math.floor(remainingTime);
        const remainingMinutes = Math.ceil(
          (remainingTime - remainingHours) * 60
        );

        return res.status(400).json({
          message: `You must work for at least ${MINIMUM_WORKING_HOURS} hours before checking out`,
          error: "MINIMUM_WORKING_HOURS_NOT_COMPLETED",
          details: {
            checkInTime: checkInTime.toISOString(),
            currentTime: currentTime.toISOString(),
            workedHours: Math.floor(timeDifferenceInHours),
            workedMinutes: Math.ceil(
              (timeDifferenceInHours - Math.floor(timeDifferenceInHours)) * 60
            ),
            minimumRequired: MINIMUM_WORKING_HOURS,
            remainingTime: {
              hours: remainingHours,
              minutes: remainingMinutes,
            },
            canCheckOutAt: new Date(
              checkInTime.getTime() + MINIMUM_WORKING_HOURS * 60 * 60 * 1000
            ).toISOString(),
          },
        });
      }
    }

    console.log(`📍 Processing ${finalAttendanceType} for user ${userName}`);

    // Handle face recognition attendance
    if (method === "face_recognition" && imageData) {
      // Verify user is registered for face recognition
      const registrationCheck = await verifyUserRegistration(userName);

      if (!registrationCheck.isRegistered) {
        return res.status(400).json({
          message: registrationCheck.message,
          registeredUsers: registrationCheck.registeredUsers || null,
        });
      }

      // Process face recognition attendance with check-in/check-out
      const result =
        await AttendanceService.processFaceRecognitionAttendanceWithType(
          imageData,
          userId,
          finalAttendanceType
        );

      if (!result.success) {
        return res.status(400).json({
          message: result.message || "Face recognition attendance failed",
          error: result.error,
          errorCode: result.errorCode,
        });
      }

      return res.status(201).json({
        message: `Face recognition ${finalAttendanceType} marked successfully`,
        attendance: result.data,
        workingHours: result.workingHours || null,
        faceRecognitionData: {
          confidence: result.data.confidence,
          recognizedName: result.data.recognizedName,
        },
      });
    }

    // Handle manual attendance
    const attendanceData = {
      userId,
      method,
      status,
      attendance_type: finalAttendanceType, // Add attendance type
      confidence: confidence || null,
      recognizedName: recognizedName || null,
      faceRecognitionDetails: faceRecognitionDetails || null,
      systemInfo: {
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip || req.connection.remoteAddress,
        platform: req.get("sec-ch-ua-platform") || "Unknown",
        browser: req.get("sec-ch-ua") || "Unknown",
      },
      location: location || null,
      notes: notes || null,
      metadata: {
        source: "web_application",
        apiVersion: "1.0",
        requestId: req.headers["x-request-id"] || null,
      },
    };

    // Create attendance record using service with working hours calculation
    const result =
      await AttendanceService.createAttendanceRecordWithWorkingHours(
        attendanceData
      );

    if (!result.success) {
      console.log("❌ Service creation failed:", result.error);
      return res.status(500).json({
        message: result.message,
        error: result.error,
      });
    }

    console.log(
      `✅ ${finalAttendanceType} recorded successfully:`,
      result.data._id
    );

    // Response based on attendance type
    const responseMessage =
      finalAttendanceType === "check_in"
        ? "Check-in recorded successfully"
        : "Check-out recorded successfully";

    res.status(201).json({
      message: responseMessage,
      attendance: result.data,
      attendanceType: finalAttendanceType,
      workingHours: result.workingHours || null,
      dailySummary: result.dailySummary || null,
    });
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// Get attendance history for logged-in user
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      method: req.query.method,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await AttendanceService.getUserAttendanceHistory(
      userId,
      filters
    );

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to fetch attendance history",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Attendance history fetched successfully",
      ...result.data,
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({
      message: "Failed to fetch attendance history",
      error: error.message,
    });
  }
};

// Get today's attendance for logged-in user
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const result = await AttendanceService.getTodayAttendanceWithWorkingHours(
      userId
    );

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to check today's attendance",
        error: result.error,
      });
    }

    if (!result.hasCheckIn && !result.hasCheckOut) {
      return res.status(200).json({
        message: "No attendance marked for today",
        attendance: null,
        hasCheckIn: false,
        hasCheckOut: false,
        workingHours: null,
      });
    }

    res.status(200).json({
      message: "Today's attendance found",
      hasCheckIn: result.hasCheckIn,
      hasCheckOut: result.hasCheckOut,
      checkInRecord: result.checkInRecord,
      checkOutRecord: result.checkOutRecord,
      workingHours: result.workingHours,
      allRecords: result.allRecords,
    });
  } catch (error) {
    console.error("Error checking today attendance:", error);
    res.status(500).json({
      message: "Failed to check today's attendance",
      error: error.message,
    });
  }
};

// Get daily working hours summary
const getDailyWorkingHours = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { date } = req.query; // Optional date parameter

    const result = await AttendanceService.getDailyWorkingHours(userId, date);

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to get working hours",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Daily working hours retrieved successfully",
      workingHours: result.data,
    });
  } catch (error) {
    console.error("Error getting daily working hours:", error);
    res.status(500).json({
      message: "Failed to get working hours",
      error: error.message,
    });
  }
};

// Get all attendance records (Admin only)
const getAllAttendance = async (req, res) => {
  try {
    // Check admin privileges
    if (!["Admin", "Super_Admin", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      method: req.query.method,
      status: req.query.status,
      department: req.query.department,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await AttendanceService.getAttendanceAnalytics(filters);

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to fetch attendance records",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Attendance records fetched successfully",
      analytics: result.data,
    });
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    res.status(500).json({
      message: "Failed to fetch attendance records",
      error: error.message,
    });
  }
};

// Get attendance analytics (Admin only)
const getAttendanceAnalytics = async (req, res) => {
  try {
    // Check admin privileges
    if (!["Admin", "Super_Admin", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      department: req.query.department,
      method: req.query.method,
    };

    const result = await AttendanceService.getAttendanceAnalytics(filters);

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to fetch attendance analytics",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Attendance analytics fetched successfully",
      analytics: result.data,
    });
  } catch (error) {
    console.error("Error fetching attendance analytics:", error);
    res.status(500).json({
      message: "Failed to fetch attendance analytics",
      error: error.message,
    });
  }
};

// Get recent attendance for dashboard
const getRecentAttendance = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await AttendanceService.getRecentAttendance(limit);

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to fetch recent attendance",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Recent attendance fetched successfully",
      records: result.data,
      summary: result.summary,
      metadata: {
        requestedLimit: limit,
        actualRecords: result.data.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching recent attendance:", error);
    res.status(500).json({
      message: "Failed to fetch recent attendance",
      error: error.message,
    });
  }
};

// Delete attendance record (Admin only)
const deleteAttendance = async (req, res) => {
  try {
    // Check admin privileges
    if (!["Admin", "Super_Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const { attendanceId } = req.params;
    const adminUserId = req.user._id || req.user.id;

    const result = await AttendanceService.deleteAttendanceRecord(
      attendanceId,
      adminUserId
    );

    if (!result.success) {
      return res.status(404).json({
        message: result.error,
      });
    }

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    res.status(500).json({
      message: "Failed to delete attendance record",
      error: error.message,
    });
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    const dbStatus = await Attendance.countDocuments({});

    res.status(200).json({
      status: "healthy",
      service: "attendance-api",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        totalRecords: dbStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "attendance-api",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

// Get today's attendance summary for all employees (Admin only)
const getTodayAttendanceSummary = async (req, res) => {
  try {
    // Check admin privileges
    if (!["Admin", "Super_Admin", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    const result = await AttendanceService.getTodayAttendanceSummary();

    if (!result.success) {
      return res.status(500).json({
        message: "Failed to fetch today's attendance summary",
        error: result.error,
      });
    }

    res.status(200).json({
      message: "Today's attendance summary fetched successfully",
      ...result.data,
    });
  } catch (error) {
    console.error("Error fetching today's attendance summary:", error);
    res.status(500).json({
      message: "Failed to fetch today's attendance summary",
      error: error.message,
    });
  }
};

// Get registered users from face recognition server
const getRegisteredUsersAPI = async (req, res) => {
  try {
    console.log("📋 Fetching registered users from face recognition server");

    const registeredUsers = await getRegisteredUsers();

    res.status(200).json({
      message: "Registered users fetched successfully",
      registered_users: registeredUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching registered users:", error.message);
    res.status(500).json({
      message: "Failed to fetch registered users",
      error: error.message,
    });
  }
};

module.exports = {
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
};
