const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const AttendanceService = require("../utils/attendanceService");
const {
  verifyUserRegistration,
  getRegisteredUsers,
} = require("../middlewares/faceRecognitionMiddleware");
const {
  getAttendanceValidation,
  getCurrentISTTime,
  validateCheckInTime,
  validateCheckOutTime,
} = require("../utils/attendanceTimeValidation");

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

    // ===== NEW ATTENDANCE TIME VALIDATION =====
    console.log(`🕐 Validating ${finalAttendanceType} time rules...`);

    const currentISTTime = getCurrentISTTime();
    const attendanceValidation = getAttendanceValidation(
      finalAttendanceType,
      todayCheck,
      currentISTTime
    );

    console.log("📋 Attendance validation result:", attendanceValidation);

    if (!attendanceValidation.isValid) {
      const statusCode =
        attendanceValidation.type === "CHECK_IN_NOT_ALLOWED" ? 403 : 400;
      return res.status(statusCode).json({
        message: attendanceValidation.message,
        error: attendanceValidation.type,
        validation: attendanceValidation,
        currentTime: attendanceValidation.currentDateTime,
        timezone: "Asia/Kolkata (IST)",
      });
    }

    console.log(`✅ Time validation passed for ${finalAttendanceType}`);

    // Validate minimum working hours for check-out (keeping existing logic as backup)
    if (
      finalAttendanceType === "check_out" &&
      todayCheck.hasCheckIn &&
      todayCheck.checkInRecord
    ) {
      const checkInTime = new Date(todayCheck.checkInRecord.timestamp);
      const currentTime = new Date();
      const timeDifferenceInHours =
        (currentTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

      const MINIMUM_WORKING_HOURS = 8; // Changed from 6 to 8 hours as per requirements

      if (timeDifferenceInHours < MINIMUM_WORKING_HOURS) {
        const remainingTime = MINIMUM_WORKING_HOURS - timeDifferenceInHours;
        const remainingHours = Math.floor(remainingTime);
        const remainingMinutes = Math.ceil(
          (remainingTime - remainingHours) * 60
        );

        return res.status(400).json({
          message: `You can only check-out after completing 8 hours from your check-in time.`,
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
        timeValidation: {
          status: result.data.metadata?.timeValidation?.status || "Present",
          isHalfDay: result.data.isHalfDay || false,
          isLate: result.data.isLateAttendance || false,
          currentTime: attendanceValidation.currentDateTime,
          message: attendanceValidation.message,
          timezone: "Asia/Kolkata (IST)",
        },
      });
    }

    // Handle manual attendance with enhanced status based on time validation
    let attendanceStatus = status;
    let isHalfDay = false;

    // Set status based on time validation for check-in
    if (finalAttendanceType === "check_in") {
      if (attendanceValidation.isLate) {
        attendanceStatus = "Late";
        isHalfDay = true;
      } else {
        attendanceStatus = "Present";
        isHalfDay = false;
      }
    } else if (finalAttendanceType === "check_out") {
      // For check-out, maintain the existing status logic
      attendanceStatus = "Present";
    }

    const attendanceData = {
      userId,
      method,
      status: attendanceStatus,
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
      notes:
        notes ||
        `${finalAttendanceType} at ${
          attendanceValidation.currentDateTime
        } IST ${isHalfDay ? "(Half Day - Late)" : "(Full Day)"}`,
      metadata: {
        source: "web_application",
        apiVersion: "1.0",
        requestId: req.headers["x-request-id"] || null,
        timeValidation: attendanceValidation, // Include validation details
        isHalfDay: isHalfDay,
        timezone: "Asia/Kolkata",
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

    // Enhanced response message based on attendance type and time validation
    let responseMessage =
      finalAttendanceType === "check_in"
        ? "Check-in recorded successfully"
        : "Check-out recorded successfully";

    if (finalAttendanceType === "check_in" && isHalfDay) {
      responseMessage = "Late check-in recorded - Half day marked";
    }

    res.status(201).json({
      message: responseMessage,
      attendance: result.data,
      attendanceType: finalAttendanceType,
      workingHours: result.workingHours || null,
      dailySummary: result.dailySummary || null,
      timeValidation: {
        status: attendanceValidation.status,
        isHalfDay: isHalfDay,
        isLate: attendanceValidation.isLate || false,
        currentTime: attendanceValidation.currentDateTime,
        message: attendanceValidation.message,
        timezone: "Asia/Kolkata (IST)",
      },
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

// Get current time validation status
const getTimeValidationStatus = async (req, res) => {
  try {
    const { attendanceType = "check_in" } = req.query;

    // Get validation for the specified attendance type
    const validation =
      attendanceType === "check_in"
        ? validateCheckInTime()
        : validateCheckOutTime(null); // null for current time check

    const currentTime = getCurrentISTTime();

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
};

// Get user-specific attendance statistics
const getUserAttendanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months, days, startDate, endDate } = req.query;

    // Calculate date range based on parameters
    let actualEndDate = new Date();
    let actualStartDate = new Date();

    if (startDate && endDate) {
      // Custom date range
      actualStartDate = new Date(startDate);
      actualEndDate = new Date(endDate);
    } else if (days) {
      // Days-based calculation
      actualStartDate.setDate(actualStartDate.getDate() - parseInt(days));
    } else if (months) {
      // Months-based calculation
      actualStartDate.setMonth(actualStartDate.getMonth() - parseInt(months));
    } else {
      // Default to last 1 month
      actualStartDate.setMonth(actualStartDate.getMonth() - 1);
    }

    // Ensure end date is end of day
    actualEndDate.setHours(23, 59, 59, 999);

    // Get attendance records for the user
    const attendanceRecords = await Attendance.find({
      employeeId: userId,
      timestamp: {
        $gte: actualStartDate,
        $lte: actualEndDate,
      },
    }).sort({ timestamp: 1 });

    // Calculate working days (excluding weekends)
    const totalWorkingDays = calculateWorkingDays(
      actualStartDate,
      actualEndDate
    );

    // Group attendance by date
    const recordsByDate = {};
    const attendanceDays = new Set();
    const checkInDays = new Set();
    const checkOutDays = new Set();
    let totalWorkingHours = 0;
    let faceRecognitionCount = 0;

    attendanceRecords.forEach((record) => {
      const dateStr = record.timestamp.toISOString().split("T")[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = { checkIn: null, checkOut: null };
      }

      if (record.attendance_type === "check_in") {
        recordsByDate[dateStr].checkIn = record;
        checkInDays.add(dateStr);
      } else if (record.attendance_type === "check_out") {
        recordsByDate[dateStr].checkOut = record;
        checkOutDays.add(dateStr);
      }

      // Count face recognition usage
      if (record.method === "face_recognition") {
        faceRecognitionCount++;
      }

      attendanceDays.add(dateStr);
    });

    // Calculate working hours
    Object.values(recordsByDate).forEach((dayRecords) => {
      if (dayRecords.checkIn && dayRecords.checkOut) {
        const checkInTime = new Date(dayRecords.checkIn.timestamp);
        const checkOutTime = new Date(dayRecords.checkOut.timestamp);
        const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        totalWorkingHours += hoursWorked;
      }
    });

    const presentDays = attendanceDays.size;
    const attendanceRate =
      totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 100)
        : 0;
    const avgWorkingHours =
      checkInDays.size > 0 ? totalWorkingHours / checkInDays.size : 0;
    const faceRecognitionPercentage =
      attendanceRecords.length > 0
        ? Math.round((faceRecognitionCount / attendanceRecords.length) * 100)
        : 0;

    // Calculate monthly breakdown
    const monthlyData = {};
    const weeklyData = {};
    const dailyData = {};

    attendanceRecords.forEach((record) => {
      const dateStr = record.timestamp.toISOString().split("T")[0];
      const monthKey = record.timestamp.toISOString().substring(0, 7); // YYYY-MM

      // Get week number
      const date = new Date(record.timestamp);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - startOfYear) / 86400000;
      const weekNum = Math.ceil(
        (pastDaysOfYear + startOfYear.getDay() + 1) / 7
      );
      const weekKey = `${date.getFullYear()}-W${weekNum
        .toString()
        .padStart(2, "0")}`;

      // Monthly data
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          attendanceCount: 0,
          workingHours: 0,
          days: new Set(),
        };
      }
      monthlyData[monthKey].attendanceCount++;
      monthlyData[monthKey].days.add(dateStr);

      // Weekly data
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          attendanceCount: 0,
          days: new Set(),
        };
      }
      weeklyData[weekKey].attendanceCount++;
      weeklyData[weekKey].days.add(dateStr);

      // Daily data
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          attendanceCount: 0,
          records: [],
        };
      }
      dailyData[dateStr].attendanceCount++;
      dailyData[dateStr].records.push({
        type: record.attendance_type,
        time: record.timestamp.toISOString().substring(11, 19),
        method: record.method,
      });
    });

    // Convert data to arrays
    const monthlyStats = Object.values(monthlyData).map((month) => ({
      month: month.month,
      attendanceCount: month.attendanceCount,
      presentDays: month.days.size,
    }));

    const weeklyStats = Object.values(weeklyData).map((week) => ({
      week: week.week,
      attendanceCount: week.attendanceCount,
      presentDays: week.days.size,
    }));

    const dailyStats = Object.values(dailyData).map((day) => ({
      date: day.date,
      attendanceCount: day.attendanceCount,
      records: day.records,
    }));

    // Calculate period type for frontend
    let periodType = "custom";
    let periodValue = 1;

    if (days) {
      periodValue = parseInt(days);
      if (periodValue === 1) periodType = "daily";
      else if (periodValue === 7) periodType = "weekly";
      else periodType = "custom";
    } else if (months) {
      periodValue = parseInt(months);
      if (periodValue === 1) periodType = "monthly";
      else if (periodValue === 12) periodType = "yearly";
      else periodType = "custom";
    }

    res.status(200).json({
      message: "User attendance statistics fetched successfully",
      stats: {
        totalDays: totalWorkingDays,
        presentDays: presentDays,
        attendanceRate: Math.min(100, attendanceRate),
        averageHours: Math.round(avgWorkingHours * 10) / 10,
        totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
        faceRecognitionUsage: faceRecognitionPercentage,
        breakdown: {
          monthly: monthlyStats,
          weekly: weeklyStats,
          daily: dailyStats,
        },
        period: {
          startDate: actualStartDate.toISOString().split("T")[0],
          endDate: actualEndDate.toISOString().split("T")[0],
          type: periodType,
          value: periodValue,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user attendance statistics:", error);
    res.status(500).json({
      message: "Failed to fetch attendance statistics",
      error: error.message,
    });
  }
};

// Helper function to calculate working days (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
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
  getTimeValidationStatus,
  getUserAttendanceStats,
};
