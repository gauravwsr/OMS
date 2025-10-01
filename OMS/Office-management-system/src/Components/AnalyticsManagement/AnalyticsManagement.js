import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./AnalyticsManagement.css";

const AnalyticsManagement = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [leaveData, setLeaveData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [checkInOutData, setCheckInOutData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Tomorrow's date to include today's applications
  });
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    averageAttendance: 0,
    topPerformers: [],
    checkInOutStats: {
      totalRecords: 0,
      onTimeCount: 0,
      lateCount: 0,
      avgWorkingHours: 0,
    },
  });

  useEffect(() => {
    fetchEmployees();
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedEmployee, activeTab]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5001/api/all-users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployees(response.data.data.filter((user) => user.role === "Employee"));
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          employeeId: selectedEmployee !== "all" ? selectedEmployee : undefined,
        },
      };

      console.log("Fetching analytics with config:", config); // Debug log
      console.log("Date Range:", dateRange); // Debug log
      console.log("Selected Employee:", selectedEmployee); // Debug log

      // Fetch different data based on active tab
      switch (activeTab) {
        case "leave":
          await fetchLeaveData(config);
          break;
        case "attendance":
          await fetchAttendanceData(config);
          break;
        case "checkinout":
          await fetchCheckInOutData(config);
          break;
        default:
          await fetchLeaveData(config);
      }

      await fetchAnalytics(config);
    } catch (error) {
      setError("Error fetching analytics data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveData = async (config) => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/analytics/leave-analytics",
        config
      );
      console.log("Fetched Leave Data:", response.data); // Debugging log
      setLeaveData(response.data || []);
    } catch (error) {
      console.error("Error fetching leave data:", error);
      setLeaveData([]);
    }
  };

  const fetchAttendanceData = async (config) => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/analytics/attendance-analytics",
        config
      );
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData([]);
    }
  };

  const fetchCheckInOutData = async (config) => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/analytics/checkinout-analytics",
        config
      );
      setCheckInOutData(response.data || []);
    } catch (error) {
      console.error("Error fetching check-in/out data:", error);
      setCheckInOutData([]);
    }
  };

  const fetchAnalytics = async (config) => {
    try {
      // Calculate analytics based on the current active tab and fetched data
      let calculatedAnalytics = {
        totalEmployees: employees.length,
        totalLeaves: leaveData.length,
        averageAttendance: 0,
        topPerformers: [],
        checkInOutStats: {
          totalRecords: 0,
          onTimeCount: 0,
          lateCount: 0,
          avgWorkingHours: 0,
        },
      };

      // Calculate attendance analytics
      if (attendanceData.length > 0) {
        const totalAttendancePercentage = attendanceData.reduce(
          (acc, emp) => acc + (emp.attendancePercentage || 0),
          0
        );
        calculatedAnalytics.averageAttendance = Math.round(
          totalAttendancePercentage / attendanceData.length
        );

        calculatedAnalytics.topPerformers = attendanceData
          .filter((emp) => emp.attendancePercentage >= 85)
          .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
          .slice(0, 5)
          .map((emp) => ({
            name: emp.employeeName,
            percentage: emp.attendancePercentage,
            department: emp.department,
            totalDays: emp.totalDays,
            presentDays: emp.presentDays,
          }));
      }

      // Calculate check-in/out analytics
      if (checkInOutData.length > 0) {
        calculatedAnalytics.checkInOutStats.totalRecords =
          checkInOutData.length;

        calculatedAnalytics.checkInOutStats.onTimeCount = checkInOutData.filter(
          (record) => record.punctuality === "On Time"
        ).length;

        calculatedAnalytics.checkInOutStats.lateCount = checkInOutData.filter(
          (record) =>
            record.punctuality === "Late" ||
            record.punctuality === "Slightly Late"
        ).length;

        // Calculate average working hours
        const recordsWithHours = checkInOutData.filter(
          (record) =>
            record.totalHours &&
            record.totalHours !== "N/A" &&
            record.status !== "Incomplete"
        );

        if (recordsWithHours.length > 0) {
          const totalHours = recordsWithHours.reduce((acc, record) => {
            // Parse hours from format like "8h 30m"
            const match = record.totalHours.match(/(\d+)h\s*(\d+)?m?/);
            if (match) {
              const hours = parseInt(match[1]) || 0;
              const minutes = parseInt(match[2]) || 0;
              return acc + hours + minutes / 60;
            }
            return acc;
          }, 0);

          calculatedAnalytics.checkInOutStats.avgWorkingHours =
            Math.round((totalHours / recordsWithHours.length) * 10) / 10;
        }
      }

      setAnalytics(calculatedAnalytics);
    } catch (error) {
      console.error("Error calculating analytics:", error);
    }
  };

  const downloadExcel = () => {
    let dataToExport = [];
    let fileName = "";

    switch (activeTab) {
      case "leave":
        dataToExport = leaveData.map((leave) => ({
          "Employee Name": leave.employeeName || leave.name || "Unknown",
          "Employee ID": leave.employeeId || "N/A",
          "Employee Email": leave.employeeEmail || leave.email || "N/A",
          Department: leave.department || "General",
          "Leave Type": leave.leaveType,
          "Start Date": new Date(leave.startDate).toLocaleDateString("en-IN"),
          "End Date": new Date(leave.endDate).toLocaleDateString("en-IN"),
          "Total Days": leave.totalDays,
          Reason: leave.reason,
          Status: leave.status,
          "Applied Date": new Date(
            leave.appliedDate || leave.createdAt
          ).toLocaleDateString("en-IN"),
          "Approved By": leave.approvedBy || "Pending",
          "Approved Date": leave.approvedDate
            ? new Date(leave.approvedDate).toLocaleDateString("en-IN")
            : "N/A",
          Comments: leave.comments || "N/A",
          "Emergency Contact": leave.emergencyContact || "N/A",
        }));
        fileName = "Employee_Leave_Applications_Report";
        break;

      case "attendance":
        dataToExport = attendanceData.map((att) => ({
          "Employee Name": att.employeeName,
          Email: att.email,
          Department: att.department,
          "Working Days": att.totalDays,
          "Present Days": att.presentDays,
          "Absent Days": att.absentDays,
          "Attendance Percentage": `${Math.min(
            att.attendancePercentage,
            100
          )}%`,
          "Check-in Days": att.checkInDays || 0,
          "Check-out Days": att.checkOutDays || 0,
          "Complete Work Days": att.completeWorkDays || 0,
          "Average Hours/Day": `${att.avgWorkingHours || 0}h`,
          "Total Working Hours": `${att.totalWorkingHours || 0}h`,
          "Performance Rating":
            att.attendancePercentage >= 90
              ? "Excellent"
              : att.attendancePercentage >= 70
              ? "Good"
              : "Needs Improvement",
          "Last Attendance": att.lastAttendance
            ? new Date(att.lastAttendance).toLocaleDateString("en-IN")
            : "N/A",
          "Records Count": att.attendanceRecordsCount || 0,
        }));
        fileName = "Employee_Attendance_Report";
        break;

      case "checkinout":
        dataToExport = checkInOutData.map((record) => ({
          "Employee Name": record.employeeName,
          Email: record.email,
          Department: record.department,
          Date: record.date,
          "Check In": record.checkIn,
          "Check Out": record.checkOut,
          "Total Hours": record.totalHours,
          Status: record.status,
          Punctuality: record.punctuality,
          "Check-in Method": record.checkInMethod,
          "Check-out Method": record.checkOutMethod,
          "Has Check-in": record.hasCheckIn ? "Yes" : "No",
          "Has Check-out": record.hasCheckOut ? "Yes" : "No",
          "Records Count": record.recordsCount,
        }));
        fileName = "Employee_CheckInOut_Report";
        break;

      default:
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const currentDate = new Date().toISOString().split("T")[0];
    saveAs(data, `${fileName}_${currentDate}.xlsx`);
  };

  const renderLeaveAnalytics = () => (
    <div className="analytics-content">
      <div className="data-table-container">
        <div className="table-header">
          <div className="header-actions single-line">
            <h3 className="section-title-inline">Leave Details</h3>
            <span className="quick-stat">
              Most Common:{" "}
              <strong style={{ color: "#764ba2", fontWeight: 700 }}>
                {(() => {
                  if (leaveData.length === 0) return "N/A";
                  const counts = leaveData.reduce((acc, leave) => {
                    acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
                    return acc;
                  }, {});
                  const sorted = Object.entries(counts).sort(
                    ([, a], [, b]) => b - a
                  );
                  return sorted[0]?.[0] || "N/A";
                })()}
              </strong>
            </span>
            <span className="quick-stat">
              Avg Days:{" "}
              <strong style={{ color: "#48bb78", fontWeight: 700 }}>
                {leaveData.length > 0
                  ? Math.round(
                      (leaveData.reduce(
                        (acc, leave) => acc + leave.totalDays,
                        0
                      ) /
                        leaveData.length) *
                        10
                    ) / 10
                  : 0}{" "}
                days
              </strong>
            </span>
            <button onClick={downloadExcel} className="download-btn">
              📊 Download Excel
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table modern-leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Period</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Approval</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.length > 0 ? (
                leaveData.map((leave, index) => (
                  <tr key={leave._id || index}>
                    <td className="employee-details-cell">
                      <div className="employee-card">
                        <div className="employee-avatar-section">
                          <div
                            className="emp-avatar-modern"
                            title={leave.employeeName || leave.name || "Unknown"}
                          >
                            <span className="avatar-text">
                              {(leave.employeeName || leave.name || "U").charAt(0).toUpperCase()}
                            </span>
                            <div className="avatar-glow"></div>
                          </div>
                          <div className="employee-status-indicator">
                            <span className="status-dot active"></span>
                          </div>
                        </div>
                        <div className="employee-info-modern">
                          <div className="emp-name-modern">
                            {leave.employeeName || leave.name || "Unknown"}
                          </div>
                          <div className="emp-meta-modern">
                            <div className="meta-item">
                              <span className="meta-icon">🆔</span>
                              <span className="meta-text">{leave.employeeId || "N/A"}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-icon">📧</span>
                              <span className="meta-text">{leave.employeeEmail || leave.email || "N/A"}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-icon">🏢</span>
                              <span className="meta-text">{leave.department || "General"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="leave-type-container">
                        <span
                          className={`badge badge-leave-type-modern ${
                            leave.leaveType
                              ? leave.leaveType.toLowerCase().replace(/\s+/g, "-")
                              : ""
                          }`}
                        >
                          <span className="leave-icon">
                            {leave.leaveType?.toLowerCase().includes('sick') && '🤒'}
                            {leave.leaveType?.toLowerCase().includes('annual') && '🏖️'}
                            {leave.leaveType?.toLowerCase().includes('casual') && '☕'}
                            {leave.leaveType?.toLowerCase().includes('emergency') && '🚨'}
                            {leave.leaveType?.toLowerCase().includes('maternity') && '👶'}
                            {leave.leaveType?.toLowerCase().includes('earned') && '💰'}
                            {!leave.leaveType?.toLowerCase().match(/(sick|annual|casual|emergency|maternity|earned)/) && '📅'}
                          </span>
                          <span className="leave-text">{leave.leaveType || "N/A"}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="date-range-modern">
                        <div className="date-item start-date">
                          <span className="date-icon">📅</span>
                          <span className="date-text">
                            {new Date(leave.startDate).toLocaleDateString("en-IN", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="date-arrow-container">
                          <span className="date-arrow">→</span>
                        </div>
                        <div className="date-item end-date">
                          <span className="date-icon">📅</span>
                          <span className="date-text">
                            {new Date(leave.endDate).toLocaleDateString("en-IN", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="days-count-modern">
                        <div className="days-circle">
                          <span className="days-number">{leave.totalDays}</span>
                          <span className="days-label">
                            {leave.totalDays === 1 ? "day" : "days"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="reason-cell">
                      <span title={leave.reason}>
                        {leave.reason?.length > 40
                          ? `${leave.reason.substring(0, 40)}...`
                          : leave.reason}
                      </span>
                    </td>
                    <td>
                      <div className="status-container">
                        <span
                          className={`badge badge-status-modern ${leave.status?.toLowerCase()}`}
                        >
                          <span className="status-icon">
                            {leave.status?.toLowerCase() === 'approved' && '✅'}
                            {leave.status?.toLowerCase() === 'pending' && '⏳'}
                            {leave.status?.toLowerCase() === 'rejected' && '❌'}
                            {!leave.status?.toLowerCase().match(/(approved|pending|rejected)/) && '❓'}
                          </span>
                          <span className="status-text">{leave.status}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="applied-date-modern">
                        <span className="applied-icon">📝</span>
                        <span className="applied-text">
                          {new Date(
                            leave.appliedDate || leave.createdAt
                          ).toLocaleDateString("en-IN", {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      {leave.status === "Approved" && (
                        <div className="approval-info">
                          <span className="approved-by">
                            By: {leave.approvedBy || "N/A"}
                          </span>
                          <br />
                          <span className="approved-date">
                            {leave.approvedDate
                              ? new Date(leave.approvedDate).toLocaleDateString(
                                  "en-IN"
                                )
                              : "N/A"}
                          </span>
                          <br />
                          {leave.comments && (
                            <span
                              className="approval-comment"
                              title={leave.comments}
                            >
                              💬{" "}
                              {leave.comments.length > 25
                                ? `${leave.comments.substring(0, 25)}...`
                                : leave.comments}
                            </span>
                          )}
                        </div>
                      )}
                      {leave.status === "Pending" && (
                        <span className="pending-text">⏳ Under Review</span>
                      )}
                      {leave.status === "Rejected" && (
                        <div className="rejection-info">
                          <span className="rejected-by">
                            By: {leave.approvedBy || "N/A"}
                          </span>
                          <br />
                          <span className="rejected-date">
                            {leave.approvedDate
                              ? new Date(leave.approvedDate).toLocaleDateString(
                                  "en-IN"
                                )
                              : "N/A"}
                          </span>
                          <br />
                          {leave.comments && (
                            <span
                              className="rejection-comment"
                              title={leave.comments}
                            >
                              ❌{" "}
                              {leave.comments.length > 25
                                ? `${leave.comments.substring(0, 25)}...`
                                : leave.comments}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-message">
                      <span>📋</span>
                      <p>
                        No leave applications found for the selected criteria
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendanceAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>Total Employees</h3>
          <p className="stat-number">{attendanceData.length}</p>
          <span className="stat-subtext">In selected period</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Average Attendance</h3>
          <p className="stat-number">{analytics.averageAttendance}%</p>
          <span className="stat-subtext">Overall performance</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <h3>High Performers</h3>
          <p className="stat-number">
            {attendanceData.filter((a) => a.attendancePercentage >= 90).length}
          </p>
          <span className="stat-subtext">≥90% attendance</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <h3>Low Attendance</h3>
          <p className="stat-number">
            {attendanceData.filter((a) => a.attendancePercentage < 70).length}
          </p>
          <span className="stat-subtext">&lt;70% attendance</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <h3>Complete Work Days</h3>
          <p className="stat-number">
            {attendanceData.reduce(
              (acc, emp) => acc + (emp.completeWorkDays || 0),
              0
            )}
          </p>
          <span className="stat-subtext">Full 8+ hour days</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <h3>Total Working Hours</h3>
          <p className="stat-number">
            {Math.round(
              attendanceData.reduce(
                (acc, emp) => acc + (emp.totalWorkingHours || 0),
                0
              )
            )}
            h
          </p>
          <span className="stat-subtext">Across all employees</span>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <div className="header-actions single-line">
            <h3 className="section-title-inline">Detailed Attendance Analytics</h3>
            <span className="quick-stat">
                Period:{" "}
                <strong style={{ color: "#764ba2" }}>
                  {new Date(dateRange.startDate).toLocaleDateString("en-IN")} -{" "}
                  {new Date(dateRange.endDate).toLocaleDateString("en-IN")}
                </strong>
              </span>
              <span className="quick-stat">
                Avg Working Hours:{" "}
                <strong style={{ color: "#48bb78" }}>
                  {attendanceData.length > 0
                    ? Math.round(
                        (attendanceData.reduce(
                          (acc, emp) => acc + (emp.avgWorkingHours || 0),
                          0
                        ) /
                          attendanceData.length) *
                          10
                      ) / 10
                    : 0}
                  h/day
                </strong>
              </span>
            <button onClick={downloadExcel} className="download-btn">
              📊 Download Excel
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Working Days</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Attendance %</th>
                <th>Check-ins</th>
                <th>Check-outs</th>
                <th>Complete Days</th>
                <th>Avg Hours/Day</th>
                <th>Total Hours</th>
                <th>Performance</th>
                <th>Last Attendance</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((att, index) => (
                  <tr key={index}>
                    <td>
                      <div className="employee-info">
                        <strong>{att.employeeName}</strong>
                        <br />
                        <small style={{ color: "#666" }}>{att.email}</small>
                      </div>
                    </td>
                    <td>{att.department}</td>
                    <td>
                      <span className="days-badge">{att.totalDays}</span>
                    </td>
                    <td>
                      <span
                        className={
                          att.attendancePercentage >= 90
                            ? "present-badge excellent"
                            : att.attendancePercentage >= 80
                            ? "present-badge good"
                            : "present-badge poor"
                        }
                      >
                        {att.presentDays}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          att.absentDays > 5
                            ? "absent-badge high"
                            : "absent-badge normal"
                        }
                      >
                        {att.absentDays}
                      </span>
                    </td>
                    <td
                      className={`attendance-percent ${
                        att.attendancePercentage >= 90
                          ? "excellent"
                          : att.attendancePercentage >= 70
                          ? "good"
                          : "poor"
                      }`}
                    >
                      {Math.min(att.attendancePercentage, 100)}%
                    </td>
                    <td>
                      <span className="checkin-badge">
                        {att.checkInDays || 0}
                      </span>
                    </td>
                    <td>
                      <span className="checkout-badge">
                        {att.checkOutDays || 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`complete-days-badge ${
                          (att.completeWorkDays || 0) >= att.presentDays * 0.8
                            ? "good"
                            : "poor"
                        }`}
                      >
                        {att.completeWorkDays || 0}
                      </span>
                    </td>
                    <td>
                      <span className="hours-badge">
                        {att.avgWorkingHours || 0}h
                      </span>
                    </td>
                    <td>
                      <span className="total-hours-badge">
                        {att.totalWorkingHours || 0}h
                      </span>
                    </td>
                    <td>
                      <span
                        className={`performance-badge ${
                          att.attendancePercentage >= 90
                            ? "excellent"
                            : att.attendancePercentage >= 70
                            ? "good"
                            : "poor"
                        }`}
                      >
                        {att.attendancePercentage >= 90
                          ? "Excellent"
                          : att.attendancePercentage >= 70
                          ? "Good"
                          : "Needs Improvement"}
                      </span>
                    </td>
                    <td>
                      <span className="last-attendance">
                        {att.lastAttendance
                          ? new Date(att.lastAttendance).toLocaleDateString(
                              "en-IN"
                            )
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="no-data">
                    <div className="no-data-message">
                      <span>📊</span>
                      <p>No attendance data found for the selected criteria</p>
                      <small>
                        Try adjusting the date range or employee filter
                      </small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers Section */}
      {analytics.topPerformers.length > 0 && (
        <div className="top-performers-section">
          <h3>🏆 Top Performers</h3>
          <div className="performers-grid">
            {analytics.topPerformers.map((performer, index) => (
              <div key={index} className="performer-card">
                <div className="performer-rank">#{index + 1}</div>
                <div className="performer-info">
                  <h4>{performer.name}</h4>
                  <p>{performer.department}</p>
                  <div className="performer-stats">
                    <span className="attendance-percent">
                      {performer.percentage}%
                    </span>
                    <span className="attendance-days">
                      {performer.presentDays}/{performer.totalDays} days
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCheckInOutAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-stats">
        <div className="stat-card">
          <h3>Total Records</h3>
          <p className="stat-number">
            {analytics.checkInOutStats.totalRecords}
          </p>
          <span className="stat-subtext">Daily attendance records</span>
        </div>
        <div className="stat-card">
          <h3>On Time</h3>
          <p className="stat-number">{analytics.checkInOutStats.onTimeCount}</p>
          <span className="stat-subtext">
            {analytics.checkInOutStats.totalRecords > 0
              ? Math.round(
                  (analytics.checkInOutStats.onTimeCount /
                    analytics.checkInOutStats.totalRecords) *
                    100
                )
              : 0}
            % punctual
          </span>
        </div>
        <div className="stat-card">
          <h3>Late Arrivals</h3>
          <p className="stat-number">{analytics.checkInOutStats.lateCount}</p>
          <span className="stat-subtext">
            {analytics.checkInOutStats.totalRecords > 0
              ? Math.round(
                  (analytics.checkInOutStats.lateCount /
                    analytics.checkInOutStats.totalRecords) *
                    100
                )
              : 0}
            % late
          </span>
        </div>
        <div className="stat-card">
          <h3>Avg Working Hours</h3>
          <p className="stat-number">
            {analytics.checkInOutStats.avgWorkingHours}h
          </p>
          <span className="stat-subtext">Per complete day</span>
        </div>
        <div className="stat-card">
          <h3>Complete Days</h3>
          <p className="stat-number">
            {checkInOutData.filter((r) => r.status === "Full Day").length}
          </p>
          <span className="stat-subtext">8+ hours worked</span>
        </div>
        <div className="stat-card">
          <h3>Incomplete Records</h3>
          <p className="stat-number">
            {
              checkInOutData.filter(
                (r) =>
                  r.status.includes("Incomplete") ||
                  r.status.includes("No Check")
              ).length
            }
          </p>
          <span className="stat-subtext">Missing check-in/out</span>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <div className="header-actions single-line">
            <h3 className="section-title-inline">Check-In/Check-Out Details</h3>
            <span className="quick-stat">
              Period:{" "}
              <strong style={{ color: "#764ba2" }}>
                {new Date(dateRange.startDate).toLocaleDateString("en-IN")} -{" "}
                {new Date(dateRange.endDate).toLocaleDateString("en-IN")}
              </strong>
            </span>
            <span className="quick-stat">
              Punctuality Rate:{" "}
              <strong style={{ color: "#48bb78" }}>
                {analytics.checkInOutStats.totalRecords > 0
                  ? Math.round(
                      (analytics.checkInOutStats.onTimeCount /
                        analytics.checkInOutStats.totalRecords) *
                        100
                    )
                  : 0}
                %
              </strong>
            </span>
            <button onClick={downloadExcel} className="download-btn">
              📊 Download Excel
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Punctuality</th>
                <th>Method</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {checkInOutData.length > 0 ? (
                checkInOutData.map((record, index) => (
                  <tr key={index}>
                    <td>
                      <div className="employee-info">
                        <strong>{record.employeeName}</strong>
                        <br />
                        <small style={{ color: "#666" }}>{record.email}</small>
                      </div>
                    </td>
                    <td>{record.department}</td>
                    <td>
                      <span className="date-badge">{record.date}</span>
                    </td>
                    <td
                      className={
                        record.punctuality === "Late" ||
                        record.punctuality === "Slightly Late"
                          ? "late-time"
                          : "on-time"
                      }
                    >
                      <span className="time-badge">{record.checkIn}</span>
                    </td>
                    <td>
                      <span className="time-badge">{record.checkOut}</span>
                    </td>
                    <td>
                      <span
                        className={`hours-badge ${
                          record.totalHours !== "N/A" &&
                          record.totalHours.includes("h") &&
                          parseInt(record.totalHours) >= 8
                            ? "full-day"
                            : "partial-day"
                        }`}
                      >
                        {record.totalHours}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${record.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`punctuality-badge ${
                          record.punctuality === "On Time"
                            ? "on-time"
                            : record.punctuality === "Slightly Late"
                            ? "slightly-late"
                            : "late"
                        }`}
                      >
                        {record.punctuality}
                      </span>
                    </td>
                    <td>
                      <div className="method-info">
                        <span className="method-badge">
                          In: {record.checkInMethod}
                        </span>
                        {record.hasCheckOut && (
                          <span className="method-badge">
                            Out: {record.checkOutMethod}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="records-count-badge">
                        {record.recordsCount}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div className="no-data-message">
                      <span>🕐</span>
                      <p>
                        No check-in/check-out records found for the selected
                        criteria
                      </p>
                      <small>
                        Try adjusting the date range or employee filter
                      </small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="analytics-management">
      <div className="analytics-header">
        <h1>📊 Analytics Management</h1>
        <p>Comprehensive employee analytics and reporting</p>
      </div>

      {/* Filters Section */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="date-input"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="date-input"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="employee">Employee:</label>
          <select
            id="employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="employee-select"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.department || "General"})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button
            onClick={fetchAnalyticsData}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? "🔄 Loading..." : "🔍 Apply Filters"}
          </button>
          <button
            onClick={() => {
              setDateRange({
                startDate: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                )
                  .toISOString()
                  .split("T")[0],
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
              });
              setSelectedEmployee("all");
            }}
            className="reset-btn"
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === "leave" ? "active" : ""}`}
          onClick={() => setActiveTab("leave")}
        >
          🏖️ Leave Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          📅 Attendance Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "checkinout" ? "active" : ""}`}
          onClick={() => setActiveTab("checkinout")}
        >
          ⏰ Check-In/Out Analytics
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === "leave" && renderLeaveAnalytics()}
          {activeTab === "attendance" && renderAttendanceAnalytics()}
          {activeTab === "checkinout" && renderCheckInOutAnalytics()}
        </>
      )}
    </div>
  );
};

export default AnalyticsManagement;
