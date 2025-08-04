const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const {
  markFaceRecognitionAttendance,
} = require("../middlewares/faceRecognitionMiddleware");

// Service class for attendance operations
class AttendanceService {
  // Create attendance record with comprehensive data
  static async createAttendanceRecord(attendanceData) {
    try {
      // Get user details to populate required fields
      const User = require("../models/userModel");
      const user = await User.findById(attendanceData.userId);

      if (!user) {
        return {
          success: false,
          error: "User not found",
          message: "Failed to record attendance",
        };
      }

      // Create current date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS

      // Map the attendanceData to model expected fields
      const mappedData = {
        // Required fields with correct names
        employeeId: attendanceData.userId, // Map userId to employeeId
        employeeName:
          user.name || `${user.firstName} ${user.lastName}`.trim() || "Unknown",
        date: dateStr,
        time: timeStr,

        // Status with correct enum value (capitalize first letter)
        status:
          attendanceData.status === "present"
            ? "Present"
            : attendanceData.status === "late"
            ? "Late"
            : attendanceData.status === "absent"
            ? "Absent"
            : attendanceData.status === "early_leave"
            ? "Early_Leave"
            : "Present",

        // Optional fields
        method: attendanceData.method || "manual",
        employeeEmail: user.email,
        employeeRole: user.role,
        confidence: attendanceData.confidence,
        recognizedName: attendanceData.recognizedName,
        location: attendanceData.location || "Office",

        // Face recognition details
        faceRecognitionDetails: attendanceData.faceRecognitionDetails,

        // System information mapping
        systemInfo: {
          userAgent: attendanceData.systemInfo?.userAgent || "",
          ipAddress: attendanceData.systemInfo?.ipAddress || "",
          platform: attendanceData.systemInfo?.platform || "",
          browser: attendanceData.systemInfo?.browser || "",
        },

        // Additional metadata
        notes: attendanceData.notes,
        metadata: attendanceData.metadata,
      };

      const attendance = new Attendance(mappedData);
      await attendance.save();

      // Populate user details in response
      await attendance.populate(
        "employeeId",
        "name email userId department role"
      );

      return {
        success: true,
        data: attendance,
        message: "Attendance recorded successfully",
      };
    } catch (error) {
      console.error("Error creating attendance record:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to record attendance",
      };
    }
  }

  // Get attendance history for a user
  static async getUserAttendanceHistory(userId, filters = {}) {
    try {
      const {
        startDate,
        endDate,
        method,
        status,
        page = 1,
        limit = 50,
      } = filters;

      // Build query using correct field name
      const query = { employeeId: userId };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      if (method) query.method = method;
      if (status) query.status = status;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate("employeeId", "name email userId department")
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        Attendance.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          records,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: total,
            limit,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check if user has already marked attendance today
  static async checkTodayAttendance(userId) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      const attendance = await Attendance.findOne({
        employeeId: userId, // Use employeeId field
        date: dateStr, // Use date field instead of timestamp range
      }).populate("employeeId", "name email userId");

      return {
        success: true,
        hasAttendance: !!attendance,
        data: attendance,
      };
    } catch (error) {
      console.error("Error checking today attendance:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get attendance analytics for admin
  static async getAttendanceAnalytics(filters = {}) {
    try {
      const { startDate, endDate, department, method } = filters;

      // Build match criteria
      const matchCriteria = {};

      if (startDate || endDate) {
        matchCriteria.timestamp = {};
        if (startDate) matchCriteria.timestamp.$gte = new Date(startDate);
        if (endDate) matchCriteria.timestamp.$lte = new Date(endDate);
      }

      if (method) matchCriteria.method = method;

      // Base aggregation pipeline
      let pipeline = [
        { $match: matchCriteria },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ];

      // Add department filter if specified
      if (department) {
        pipeline.push({
          $match: { "user.department": department },
        });
      }

      // Analytics aggregations
      const [
        totalStats,
        methodStats,
        departmentStats,
        hourlyStats,
        dailyStats,
      ] = await Promise.all([
        // Total attendance stats
        Attendance.aggregate([
          ...pipeline,
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              uniqueUsers: { $addToSet: "$userId" },
              avgConfidence: {
                $avg: {
                  $toDouble: {
                    $replaceAll: {
                      input: "$confidence",
                      find: "%",
                      replacement: "",
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalRecords: 1,
              uniqueUsers: { $size: "$uniqueUsers" },
              avgConfidence: { $round: ["$avgConfidence", 2] },
            },
          },
        ]),

        // Method-wise stats
        Attendance.aggregate([
          ...pipeline,
          {
            $group: {
              _id: "$method",
              count: { $sum: 1 },
              avgConfidence: {
                $avg: {
                  $toDouble: {
                    $replaceAll: {
                      input: "$confidence",
                      find: "%",
                      replacement: "",
                    },
                  },
                },
              },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Department-wise stats
        Attendance.aggregate([
          ...pipeline,
          {
            $group: {
              _id: "$user.department",
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: "$userId" },
            },
          },
          {
            $project: {
              _id: 0,
              department: "$_id",
              count: 1,
              uniqueUsers: { $size: "$uniqueUsers" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Hourly distribution
        Attendance.aggregate([
          ...pipeline,
          {
            $group: {
              _id: { $hour: "$timestamp" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Daily attendance for last 30 days
        Attendance.aggregate([
          ...pipeline,
          {
            $group: {
              _id: {
                year: { $year: "$timestamp" },
                month: { $month: "$timestamp" },
                day: { $dayOfMonth: "$timestamp" },
              },
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: "$userId" },
            },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
              count: 1,
              uniqueUsers: { $size: "$uniqueUsers" },
            },
          },
          { $sort: { date: -1 } },
          { $limit: 30 },
        ]),
      ]);

      return {
        success: true,
        data: {
          overview: totalStats[0] || {
            totalRecords: 0,
            uniqueUsers: 0,
            avgConfidence: 0,
          },
          byMethod: methodStats,
          byDepartment: departmentStats,
          hourlyDistribution: hourlyStats,
          dailyTrend: dailyStats.reverse(),
        },
      };
    } catch (error) {
      console.error("Error getting attendance analytics:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process face recognition attendance
  static async processFaceRecognitionAttendance(imageData, userId) {
    try {
      // Call face recognition service
      const faceResult = await markFaceRecognitionAttendance(imageData);

      if (!faceResult.success) {
        return {
          success: false,
          error: faceResult.error,
          errorCode: faceResult.errorCode,
        };
      }

      // Extract data from face recognition response
      const { recognized_name, confidence, detection_details } =
        faceResult.data;

      // Prepare attendance data
      const attendanceData = {
        userId,
        method: "face_recognition",
        status: "present",
        confidence,
        recognizedName: recognized_name,
        faceRecognitionDetails: {
          detectionDetails: detection_details,
          processingTime: detection_details?.processing_time || "N/A",
          faceCoordinates: detection_details?.face_coordinates || null,
          imageMetadata: {
            size: imageData?.length || "Unknown",
            format: "base64",
            timestamp: new Date().toISOString(),
          },
        },
        systemInfo: {
          userAgent: "Face Recognition API",
          ipAddress: "138.197.27.240",
          platform: process.platform,
          nodeVersion: process.version,
        },
        metadata: {
          source: "face_recognition_api",
          apiVersion: "1.0",
          processingServer: "localhost5001",
        },
      };

      // Save to database
      return await this.createAttendanceRecord(attendanceData);
    } catch (error) {
      console.error("Error processing face recognition attendance:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to process face recognition attendance",
      };
    }
  }

  // Get recent attendance for dashboard with check-in/check-out and working hours
  static async getRecentAttendance(limit = 10) {
    try {
      // Get recent dates (last 7 days by default)
      const daysBack = Math.max(7, Math.ceil(limit / 2)); // Ensure we get enough data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);

      // Get all attendance records for recent dates
      const allRecords = await Attendance.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate("employeeId", "name email department role")
        .sort({ timestamp: -1 });

      // Group records by employee and date
      const employeeAttendanceMap = new Map();

      allRecords.forEach((record) => {
        const employeeId = record.employeeId._id.toString();
        const dateKey = record.date; // YYYY-MM-DD format
        const mapKey = `${employeeId}-${dateKey}`;

        if (!employeeAttendanceMap.has(mapKey)) {
          employeeAttendanceMap.set(mapKey, {
            employee: {
              id: record.employeeId._id,
              name: record.employeeName || record.employeeId.name,
              email: record.employeeId.email,
              department: record.employeeId.department,
              role: record.employeeId.role,
            },
            date: record.date,
            dateObj: new Date(record.timestamp),
            checkIn: null,
            checkOut: null,
            workingHours: null,
            status: "Incomplete",
            allRecords: [],
          });
        }

        const dayData = employeeAttendanceMap.get(mapKey);
        dayData.allRecords.push(record);

        // Set check-in and check-out based on attendance_type
        if (record.attendance_type === "check_in") {
          if (
            !dayData.checkIn ||
            record.timestamp < dayData.checkIn.timestamp
          ) {
            dayData.checkIn = record;
          }
        } else if (record.attendance_type === "check_out") {
          if (
            !dayData.checkOut ||
            record.timestamp > dayData.checkOut.timestamp
          ) {
            dayData.checkOut = record;
          }
        }
      });

      // Calculate working hours and prepare final data
      const recentAttendanceData = [];

      employeeAttendanceMap.forEach((dayData, key) => {
        // Calculate working hours if both check-in and check-out exist
        if (dayData.checkIn && dayData.checkOut) {
          const checkInTime = new Date(dayData.checkIn.timestamp);
          const checkOutTime = new Date(dayData.checkOut.timestamp);
          const diffMs = checkOutTime - checkInTime;
          const diffHours = diffMs / (1000 * 60 * 60);

          dayData.workingHours = {
            hours: Math.floor(diffHours),
            minutes: Math.floor((diffHours % 1) * 60),
            totalHours: diffHours.toFixed(2),
            checkInTime: checkInTime.toLocaleTimeString(),
            checkOutTime: checkOutTime.toLocaleTimeString(),
          };

          dayData.status =
            parseFloat(diffHours) >= 8 ? "Full Day" : "Partial Day";
        } else if (dayData.checkIn && !dayData.checkOut) {
          dayData.status = "Checked In (No Check-out)";
        } else if (!dayData.checkIn && dayData.checkOut) {
          dayData.status = "Invalid (Check-out without Check-in)";
        }

        recentAttendanceData.push(dayData);
      });

      // Sort by most recent date and limit results
      recentAttendanceData.sort((a, b) => b.dateObj - a.dateObj);
      const limitedData = recentAttendanceData.slice(0, limit);

      return {
        success: true,
        data: limitedData,
        summary: {
          totalRecords: limitedData.length,
          dateRange: {
            from: startDate.toISOString().split("T")[0],
            to: endDate.toISOString().split("T")[0],
          },
          statistics: {
            fullDays: limitedData.filter((d) => d.status === "Full Day").length,
            partialDays: limitedData.filter((d) => d.status === "Partial Day")
              .length,
            incompleteAttendance: limitedData.filter((d) =>
              d.status.includes("Checked In")
            ).length,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching recent attendance:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete attendance record (admin only)
  static async deleteAttendanceRecord(attendanceId, adminUserId) {
    try {
      const attendance = await Attendance.findById(attendanceId);

      if (!attendance) {
        return {
          success: false,
          error: "Attendance record not found",
        };
      }

      // Add audit log before deletion
      const auditLog = {
        action: "DELETE",
        performedBy: adminUserId,
        timestamp: new Date(),
        originalData: attendance.toObject(),
      };

      attendance.auditLog.push(auditLog);
      await attendance.save();

      // Now delete the record
      await Attendance.findByIdAndDelete(attendanceId);

      return {
        success: true,
        message: "Attendance record deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get today's attendance with working hours calculation
  static async getTodayAttendanceWithWorkingHours(userId) {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Get all today's records for this user
      const todayRecords = await Attendance.find({
        employeeId: userId,
        timestamp: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      }).sort({ timestamp: 1 });

      const checkInRecord = todayRecords.find(
        (record) => record.attendance_type === "check_in"
      );
      const checkOutRecord = todayRecords.find(
        (record) => record.attendance_type === "check_out"
      );

      let workingHours = null;
      if (checkInRecord && checkOutRecord) {
        const checkInTime = new Date(checkInRecord.timestamp);
        const checkOutTime = new Date(checkOutRecord.timestamp);
        const diffMs = checkOutTime - checkInTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        workingHours = {
          hours: Math.floor(diffHours),
          minutes: Math.floor((diffHours % 1) * 60),
          totalHours: diffHours.toFixed(2),
          checkInTime: checkInTime.toLocaleTimeString(),
          checkOutTime: checkOutTime.toLocaleTimeString(),
        };
      }

      return {
        success: true,
        hasCheckIn: !!checkInRecord,
        hasCheckOut: !!checkOutRecord,
        checkInRecord,
        checkOutRecord,
        workingHours,
        allRecords: todayRecords,
      };
    } catch (error) {
      console.error(
        "Error checking today's attendance with working hours:",
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create attendance record with working hours calculation
  static async createAttendanceRecordWithWorkingHours(attendanceData) {
    try {
      // Get user details to populate required fields
      const User = require("../models/userModel");
      const user = await User.findById(attendanceData.userId);

      if (!user) {
        return {
          success: false,
          error: "User not found",
          message: "Failed to record attendance",
        };
      }

      // Create current date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS

      // Map the attendanceData to model expected fields
      const mappedData = {
        // Required fields with correct names
        employeeId: attendanceData.userId,
        employeeName:
          user.name || `${user.firstName} ${user.lastName}`.trim() || "Unknown",
        date: dateStr,
        time: timeStr,

        // Status with correct enum value
        status:
          attendanceData.status === "present"
            ? "Present"
            : attendanceData.status === "late"
            ? "Late"
            : attendanceData.status === "absent"
            ? "Absent"
            : attendanceData.status === "early_leave"
            ? "Early_Leave"
            : "Present",

        // Attendance type (check_in/check_out)
        attendance_type: attendanceData.attendance_type || "check_in",

        // Optional fields
        method: attendanceData.method || "manual",
        employeeEmail: user.email,
        employeeRole: user.role,
        confidence: attendanceData.confidence,
        recognizedName: attendanceData.recognizedName,
        location: attendanceData.location || "Office",

        // Face recognition details
        faceRecognitionDetails: attendanceData.faceRecognitionDetails,

        // System information mapping
        system_info: {
          user_agent: attendanceData.systemInfo?.userAgent || "",
          screen_resolution: attendanceData.systemInfo?.screenResolution || "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        ip_address: attendanceData.systemInfo?.ipAddress || "",

        // Additional metadata
        notes: attendanceData.notes,
      };

      const attendance = new Attendance(mappedData);
      await attendance.save();

      // Populate user details in response
      await attendance.populate(
        "employeeId",
        "name email userId department role"
      );

      // Calculate working hours if this is check-out
      let workingHours = null;
      let dailySummary = null;

      if (attendanceData.attendance_type === "check_out") {
        const todayData = await this.getTodayAttendanceWithWorkingHours(
          attendanceData.userId
        );
        if (todayData.success && todayData.workingHours) {
          workingHours = todayData.workingHours;
          dailySummary = {
            checkIn: todayData.checkInRecord?.timestamp,
            checkOut: attendance.timestamp,
            totalWorkingHours: todayData.workingHours.totalHours,
            status:
              parseFloat(todayData.workingHours.totalHours) >= 8
                ? "Full Day"
                : "Partial Day",
          };
        }
      }

      return {
        success: true,
        data: attendance,
        workingHours,
        dailySummary,
        message: `${
          attendanceData.attendance_type === "check_in"
            ? "Check-in"
            : "Check-out"
        } recorded successfully`,
      };
    } catch (error) {
      console.error(
        "Error creating attendance record with working hours:",
        error
      );
      return {
        success: false,
        error: error.message,
        message: "Failed to record attendance",
      };
    }
  }

  // Process face recognition attendance with check-in/check-out type
  static async processFaceRecognitionAttendanceWithType(
    imageData,
    userId,
    attendanceType = "check_in"
  ) {
    try {
      // Validate minimum working hours for check-out (6 hours minimum)
      if (attendanceType === "check_out") {
        const todayCheck = await this.getTodayAttendanceWithWorkingHours(
          userId
        );

        if (
          todayCheck.success &&
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

            return {
              success: false,
              message: `You must work for at least ${MINIMUM_WORKING_HOURS} hours before checking out`,
              error: "MINIMUM_WORKING_HOURS_NOT_COMPLETED",
              errorCode: "MIN_HOURS_NOT_COMPLETED",
              details: {
                checkInTime: checkInTime.toISOString(),
                currentTime: currentTime.toISOString(),
                workedHours: Math.floor(timeDifferenceInHours),
                workedMinutes: Math.ceil(
                  (timeDifferenceInHours - Math.floor(timeDifferenceInHours)) *
                    60
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
            };
          }
        }
      }

      const result = await markFaceRecognitionAttendance(imageData);

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          error: result.error,
          errorCode: result.errorCode,
        };
      }

      // Create attendance record with face recognition data
      const attendanceData = {
        userId,
        method: "face_recognition",
        status: "present",
        attendance_type: attendanceType,
        confidence: result.confidence,
        recognizedName: result.recognized_name,
        faceRecognitionDetails: {
          server_response: result,
          recognition_type: "normal",
          confidence_value: parseFloat(result.confidence) || 0,
          recognition_time: new Date(),
          system_version: "1.0",
        },
        location: "Office",
        notes: `Face recognition ${attendanceType} with ${result.confidence}% confidence`,
      };

      return await this.createAttendanceRecordWithWorkingHours(attendanceData);
    } catch (error) {
      console.error("Error processing face recognition attendance:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to process face recognition attendance",
      };
    }
  }

  // Get daily working hours summary
  static async getDailyWorkingHours(userId, date = null) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate() + 1
      );

      const records = await Attendance.find({
        employeeId: userId,
        timestamp: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      }).sort({ timestamp: 1 });

      const checkIn = records.find((r) => r.attendance_type === "check_in");
      const checkOut = records.find((r) => r.attendance_type === "check_out");

      if (!checkIn) {
        return {
          success: true,
          data: {
            date: targetDate.toDateString(),
            status: "No check-in recorded",
            workingHours: 0,
            records: records,
          },
        };
      }

      if (!checkOut) {
        return {
          success: true,
          data: {
            date: targetDate.toDateString(),
            status: "Check-in recorded, but no check-out",
            checkInTime: checkIn.timestamp,
            workingHours: 0,
            records: records,
          },
        };
      }

      const workingMs = checkOut.timestamp - checkIn.timestamp;
      const workingHours = workingMs / (1000 * 60 * 60);

      return {
        success: true,
        data: {
          date: targetDate.toDateString(),
          status: "Complete day",
          checkInTime: checkIn.timestamp,
          checkOutTime: checkOut.timestamp,
          workingHours: workingHours.toFixed(2),
          workingTime: {
            hours: Math.floor(workingHours),
            minutes: Math.floor((workingHours % 1) * 60),
          },
          records: records,
        },
      };
    } catch (error) {
      console.error("Error getting daily working hours:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get today's attendance summary for all employees (Admin view)
  static async getTodayAttendanceSummary() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Get all today's records
      const todayRecords = await Attendance.find({
        timestamp: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })
        .populate("employeeId", "name email department role")
        .sort({ timestamp: 1 });

      // Group by employee
      const employeeMap = new Map();

      todayRecords.forEach((record) => {
        const employeeId = record.employeeId._id.toString();

        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, {
            employee: {
              id: record.employeeId._id,
              name: record.employeeName || record.employeeId.name,
              email: record.employeeId.email,
              department: record.employeeId.department,
              role: record.employeeId.role,
            },
            checkIn: null,
            checkOut: null,
            workingHours: null,
            status: "Absent",
            allRecords: [],
          });
        }

        const empData = employeeMap.get(employeeId);
        empData.allRecords.push(record);

        if (record.attendance_type === "check_in") {
          if (
            !empData.checkIn ||
            record.timestamp < empData.checkIn.timestamp
          ) {
            empData.checkIn = record;
          }
        } else if (record.attendance_type === "check_out") {
          if (
            !empData.checkOut ||
            record.timestamp > empData.checkOut.timestamp
          ) {
            empData.checkOut = record;
          }
        }
      });

      // Calculate working hours and status
      const attendanceSummary = [];

      employeeMap.forEach((empData, employeeId) => {
        if (empData.checkIn && empData.checkOut) {
          const checkInTime = new Date(empData.checkIn.timestamp);
          const checkOutTime = new Date(empData.checkOut.timestamp);
          const diffMs = checkOutTime - checkInTime;
          const diffHours = diffMs / (1000 * 60 * 60);

          empData.workingHours = {
            hours: Math.floor(diffHours),
            minutes: Math.floor((diffHours % 1) * 60),
            totalHours: diffHours.toFixed(2),
            checkInTime: checkInTime.toLocaleTimeString(),
            checkOutTime: checkOutTime.toLocaleTimeString(),
          };

          empData.status =
            parseFloat(diffHours) >= 8 ? "Full Day" : "Partial Day";
        } else if (empData.checkIn && !empData.checkOut) {
          empData.status = "Present (Working)";
        }

        attendanceSummary.push(empData);
      });

      // Sort by name
      attendanceSummary.sort((a, b) =>
        a.employee.name.localeCompare(b.employee.name)
      );

      // Calculate statistics
      const stats = {
        totalEmployees: attendanceSummary.length,
        present: attendanceSummary.filter((e) => e.status !== "Absent").length,
        absent: attendanceSummary.filter((e) => e.status === "Absent").length,
        fullDay: attendanceSummary.filter((e) => e.status === "Full Day")
          .length,
        partialDay: attendanceSummary.filter((e) => e.status === "Partial Day")
          .length,
        working: attendanceSummary.filter(
          (e) => e.status === "Present (Working)"
        ).length,
        avgWorkingHours:
          attendanceSummary
            .filter((e) => e.workingHours)
            .reduce(
              (sum, e) => sum + parseFloat(e.workingHours.totalHours),
              0
            ) /
          Math.max(1, attendanceSummary.filter((e) => e.workingHours).length),
      };

      return {
        success: true,
        data: {
          date: today.toISOString().split("T")[0],
          summary: attendanceSummary,
          statistics: stats,
        },
      };
    } catch (error) {
      console.error("Error fetching today's attendance summary:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = AttendanceService;
