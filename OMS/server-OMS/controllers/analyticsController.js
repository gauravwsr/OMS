const User = require("../models/userModel.js");
const Leave = require("../models/leaveModel.js");

// Get Leave Analytics Data
const getLeaveAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    // Build query based on filters
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (employeeId && employeeId !== "all") {
      query.userId = employeeId;
    }
    // Get leave data with employee details
    const leaves = await Leave.find(query)
      .populate("userId", "name email department")
      .sort({ createdAt: -1 });
    // Format the response
    const formattedLeaves = leaves.map((leave) => ({
      _id: leave._id,
      employeeName: leave.userId?.name || leave.employeeName || "Unknown",
      employeeEmail: leave.userId?.email || leave.employeeEmail || "Unknown",
      department: leave.userId?.department || "General",
      leaveType: leave.leaveType,
      startDate: leave.leaveDates?.start || leave.startDate,
      endDate: leave.leaveDates?.end || leave.endDate,
      totalDays: leave.totalDays,
      reason: leave.leaveReason || leave.reason,
      status: leave.status,
      createdAt: leave.appliedDate || leave.createdAt,
      approvedBy: leave.reviewedBy || leave.approvedBy,
      approvedDate: leave.reviewedDate || leave.approvedDate,
      comments: leave.reviewComments || leave.comments,
      leaveBalance: leave.leaveBalance || 0,
    }));

    res.json(formattedLeaves);
  } catch (error) {
    console.error("Error fetching leave analytics:", error);
    res.status(500).json({
      message: "Error fetching leave analytics",
      error: error.message,
    });
  }
};

// Get Attendance Analytics Data (Real data from attendance service)
const getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const AttendanceService = require("../utils/attendanceService");
    const Attendance = require("../models/attendanceModel");

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const actualEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Get all employees
    let employeeQuery = { role: "Employee" };
    if (employeeId && employeeId !== "all") {
      employeeQuery._id = employeeId;
    }

    const employees = await User.find(employeeQuery);

    // Get actual attendance data for each employee
    const attendanceData = await Promise.all(
      employees.map(async (emp) => {
        try {
          // Get all attendance records for this employee in the date range
          const attendanceRecords = await Attendance.find({
            employeeId: emp._id,
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

          // Group attendance by date to count unique days
          const attendanceDays = new Set();
          const checkInDays = new Set();
          const checkOutDays = new Set();
          let totalWorkingHours = 0;
          let completeWorkDays = 0;

          // Group records by date
          const recordsByDate = {};
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

            attendanceDays.add(dateStr);
          });

          // Calculate working hours for complete days
          Object.values(recordsByDate).forEach((dayRecords) => {
            if (dayRecords.checkIn && dayRecords.checkOut) {
              const checkInTime = new Date(dayRecords.checkIn.timestamp);
              const checkOutTime = new Date(dayRecords.checkOut.timestamp);
              const hoursWorked =
                (checkOutTime - checkInTime) / (1000 * 60 * 60);
              totalWorkingHours += hoursWorked;
              if (hoursWorked >= 7.5) {
                // Consider 7.5+ hours as complete work day
                completeWorkDays++;
              }
            }
          });

          const presentDays = attendanceDays.size;
          const absentDays = Math.max(0, totalWorkingDays - presentDays);
          const attendancePercentage =
            totalWorkingDays > 0
              ? Math.round((presentDays / totalWorkingDays) * 100)
              : 0;
          const avgWorkingHours =
            checkInDays.size > 0 ? totalWorkingHours / checkInDays.size : 0;

          return {
            employeeId: emp._id,
            employeeName: emp.name,
            email: emp.email,
            department: emp.department || "General",
            totalDays: totalWorkingDays,
            presentDays: presentDays,
            absentDays: absentDays,
            attendancePercentage: Math.min(100, attendancePercentage),
            checkInDays: checkInDays.size,
            checkOutDays: checkOutDays.size,
            completeWorkDays: completeWorkDays,
            avgWorkingHours: Math.round(avgWorkingHours * 10) / 10,
            totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
            lastAttendance:
              attendanceRecords.length > 0
                ? attendanceRecords[attendanceRecords.length - 1].timestamp
                : null,
            attendanceRecordsCount: attendanceRecords.length,
          };
        } catch (empError) {
          console.error(
            `Error processing attendance for employee ${emp.name}:`,
            empError
          );
          return {
            employeeId: emp._id,
            employeeName: emp.name,
            email: emp.email,
            department: emp.department || "General",
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            attendancePercentage: 0,
            checkInDays: 0,
            checkOutDays: 0,
            completeWorkDays: 0,
            avgWorkingHours: 0,
            totalWorkingHours: 0,
            lastAttendance: null,
            attendanceRecordsCount: 0,
            error: empError.message,
          };
        }
      })
    );

    res.json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance analytics:", error);
    res.status(500).json({
      message: "Error fetching attendance analytics",
      error: error.message,
    });
  }
};

// Helper function to calculate working days (excluding weekends)
function calculateWorkingDays(startDate, endDate) {
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
}

// Get Check-In/Check-Out Analytics Data (Real data from attendance records)
const getCheckInOutAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const Attendance = require("../models/attendanceModel");

    // Set default date range if not provided (last 10 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 10);

    const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const actualEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Build attendance query
    let attendanceQuery = {
      timestamp: {
        $gte: actualStartDate,
        $lte: actualEndDate,
      },
    };

    // Add employee filter if specified
    if (employeeId && employeeId !== "all") {
      attendanceQuery.employeeId = employeeId;
    }

    // Get all attendance records
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate("employeeId", "name email department")
      .sort({ timestamp: -1 });

    // Group records by employee and date
    const dailyRecords = {};

    attendanceRecords.forEach((record) => {
      if (!record.employeeId) return; // Skip if employee not found

      const employeeId = record.employeeId._id.toString();
      const dateStr = record.timestamp.toISOString().split("T")[0];
      const key = `${employeeId}-${dateStr}`;

      if (!dailyRecords[key]) {
        dailyRecords[key] = {
          employeeId: record.employeeId._id,
          employeeName: record.employeeId.name,
          email: record.employeeId.email,
          department: record.employeeId.department || "General",
          date: dateStr,
          checkIn: null,
          checkOut: null,
          checkInRecord: null,
          checkOutRecord: null,
          allRecords: [],
        };
      }

      dailyRecords[key].allRecords.push(record);

      if (record.attendance_type === "check_in") {
        if (
          !dailyRecords[key].checkIn ||
          record.timestamp < dailyRecords[key].checkInRecord.timestamp
        ) {
          dailyRecords[key].checkIn = record.timestamp.toLocaleTimeString(
            "en-US",
            {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
            }
          );
          dailyRecords[key].checkInRecord = record;
        }
      } else if (record.attendance_type === "check_out") {
        if (
          !dailyRecords[key].checkOut ||
          record.timestamp > dailyRecords[key].checkOutRecord.timestamp
        ) {
          dailyRecords[key].checkOut = record.timestamp.toLocaleTimeString(
            "en-US",
            {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
            }
          );
          dailyRecords[key].checkOutRecord = record;
        }
      }
    });

    // Process and format the data
    const checkInOutData = Object.values(dailyRecords).map((record) => {
      let totalHours = "N/A";
      let status = "Incomplete";
      let punctuality = "N/A";

      if (record.checkInRecord && record.checkOutRecord) {
        const checkInTime = new Date(record.checkInRecord.timestamp);
        const checkOutTime = new Date(record.checkOutRecord.timestamp);
        const diffMs = checkOutTime - checkInTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        totalHours = `${Math.floor(diffHours)}h ${Math.floor(
          (diffHours % 1) * 60
        )}m`;
        status = diffHours >= 7.5 ? "Full Day" : "Partial Day";

        // Determine punctuality based on check-in time
        const checkInHour = checkInTime.getHours();
        const checkInMinute = checkInTime.getMinutes();
        const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;
        const nineAMInMinutes = 9 * 60; // 9:00 AM
        const tenAMInMinutes = 10 * 60; // 10:00 AM

        if (checkInTimeInMinutes <= nineAMInMinutes) {
          punctuality = "On Time";
        } else if (checkInTimeInMinutes <= tenAMInMinutes) {
          punctuality = "Slightly Late";
        } else {
          punctuality = "Late";
        }
      } else if (record.checkInRecord && !record.checkOutRecord) {
        status = "Present (No Check-out)";

        // Determine punctuality for check-in only
        const checkInTime = new Date(record.checkInRecord.timestamp);
        const checkInHour = checkInTime.getHours();
        const checkInMinute = checkInTime.getMinutes();
        const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;
        const nineAMInMinutes = 9 * 60;
        const tenAMInMinutes = 10 * 60;

        if (checkInTimeInMinutes <= nineAMInMinutes) {
          punctuality = "On Time";
        } else if (checkInTimeInMinutes <= tenAMInMinutes) {
          punctuality = "Slightly Late";
        } else {
          punctuality = "Late";
        }
      } else if (!record.checkInRecord && record.checkOutRecord) {
        status = "Invalid (No Check-in)";
      }

      return {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        email: record.email,
        department: record.department,
        date: new Date(record.date).toLocaleDateString("en-IN"),
        checkIn: record.checkIn || "N/A",
        checkOut: record.checkOut || "N/A",
        totalHours: totalHours,
        status: status,
        punctuality: punctuality,
        recordsCount: record.allRecords.length,
        hasCheckIn: !!record.checkInRecord,
        hasCheckOut: !!record.checkOutRecord,
        // Additional details for debugging
        checkInMethod: record.checkInRecord?.method || "N/A",
        checkOutMethod: record.checkOutRecord?.method || "N/A",
      };
    });

    // Sort by date (most recent first) and then by employee name
    checkInOutData.sort((a, b) => {
      const dateComparison =
        new Date(b.date.split("/").reverse().join("-")) -
        new Date(a.date.split("/").reverse().join("-"));
      if (dateComparison !== 0) return dateComparison;
      return a.employeeName.localeCompare(b.employeeName);
    });

    res.json(checkInOutData);
  } catch (error) {
    console.error("Error fetching check-in/out analytics:", error);
    res.status(500).json({
      message: "Error fetching check-in/out analytics",
      error: error.message,
    });
  }
};

// Export Analytics Data
const exportAnalyticsData = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, employeeId } = req.query;

    let data = [];
    let filename = "";

    switch (type) {
      case "leave":
        // Get leave data
        let leaveQuery = {};
        if (startDate && endDate) {
          leaveQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }
        if (employeeId && employeeId !== "all") {
          leaveQuery.employeeId = employeeId;
        }

        const leaves = await Leave.find(leaveQuery).populate(
          "employeeId",
          "name email department"
        );

        data = leaves.map((leave) => ({
          "Employee Name":
            leave.employeeId?.name || leave.employeeName || "Unknown",
          "Employee Email":
            leave.employeeId?.email || leave.employeeEmail || "Unknown",
          Department: leave.employeeId?.department || "General",
          "Leave Type": leave.leaveType,
          "Start Date": new Date(leave.startDate).toLocaleDateString(),
          "End Date": new Date(leave.endDate).toLocaleDateString(),
          "Total Days": leave.totalDays,
          Reason: leave.reason,
          Status: leave.status,
          "Applied Date": new Date(leave.createdAt).toLocaleDateString(),
          "Approved By": leave.approvedBy || "Pending",
        }));
        filename = `Leave_Analytics_${
          new Date().toISOString().split("T")[0]
        }.json`;
        break;

      case "attendance":
        // Mock attendance data for export
        const employees = await User.find({ role: "Employee" });
        data = employees.map((emp) => ({
          "Employee Name": emp.name,
          Email: emp.email,
          Department: emp.department || "General",
          "Total Days": 22,
          "Present Days": Math.floor(Math.random() * 22) + 15,
          "Attendance Percentage": Math.floor(Math.random() * 30) + 70 + "%",
        }));
        filename = `Attendance_Analytics_${
          new Date().toISOString().split("T")[0]
        }.json`;
        break;

      default:
        return res.status(400).json({ message: "Invalid export type" });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.json(data);
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    res.status(500).json({
      message: "Error exporting analytics data",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaveAnalytics,
  getAttendanceAnalytics,
  getCheckInOutAnalytics,
  exportAnalyticsData,
};
