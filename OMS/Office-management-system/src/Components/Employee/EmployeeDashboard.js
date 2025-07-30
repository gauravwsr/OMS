import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaUserTie,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTasks,
  FaProjectDiagram,
  FaCalendarCheck,
  FaCalendarTimes,
  FaBusinessTime,
  FaPhone,
  FaIdCard,
  FaBriefcase,
  FaAward,
  FaClipboardList,
  FaArrowUp,
  FaCalendarWeek,
  FaHome,
  FaBell,
  FaCogs,
} from "react-icons/fa";
import { useAuth } from "../AuthProvider/AuthContext";
import "./EmployeeDashboard.css";

const EmployeeDashboard = ({ nav }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLeaves: 0,
    workingHours: 0,
    projectsAssigned: 0,
    tasksCompleted: 0,
    attendancePercentage: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [currentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());

  // Get current user (Employee) info from auth context
  const currentUser = user || {
    name: "Employee",
    id: "employee-id",
    email: "employee@company.com",
    role: "Employee",
  };

  // Fetch employee personal information
  const fetchEmployeeInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/employee/profile/${currentUser.id || currentUser.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setEmployeeInfo(result.data || currentUser);
      } else {
        setEmployeeInfo(currentUser);
      }
    } catch (error) {
      console.error("Error fetching employee info:", error);
      setEmployeeInfo(currentUser);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/attendance/employee/${currentUser.id || currentUser.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const attendance = Array.isArray(result.data) ? result.data : [];
        
        // Get recent 7 days attendance
        const recent = attendance.slice(-7).reverse();
        setRecentAttendance(recent);
        
        calculateAttendanceStats(attendance);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // Mock data for demonstration
      const mockAttendance = generateMockAttendance();
      setRecentAttendance(mockAttendance.slice(-7).reverse());
      calculateAttendanceStats(mockAttendance);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/notifications/employee/${currentUser.id || currentUser.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setNotifications(Array.isArray(result.data) ? result.data.slice(0, 5) : []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Mock notifications
      setNotifications([
        { id: 1, message: "New project assigned: Web Development", type: "info", date: new Date().toISOString() },
        { id: 2, message: "Monthly team meeting scheduled for tomorrow", type: "warning", date: new Date().toISOString() },
        { id: 3, message: "Performance review completed", type: "success", date: new Date().toISOString() },
      ]);
    }
  };

  // Generate mock attendance data for demonstration
  const generateMockAttendance = () => {
    const mockData = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        const isPresent = Math.random() > 0.1; // 90% attendance rate
        mockData.push({
          date: date.toISOString().split('T')[0],
          status: isPresent ? 'Present' : 'Absent',
          checkIn: isPresent ? '09:' + Math.floor(Math.random() * 30).toString().padStart(2, '0') : null,
          checkOut: isPresent ? '18:' + Math.floor(Math.random() * 30).toString().padStart(2, '0') : null,
          workingHours: isPresent ? (8 + Math.random() * 2).toFixed(1) : 0,
        });
      }
    }
    
    return mockData;
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = (attendance) => {
    const currentMonthData = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const totalPresent = currentMonthData.filter(record => record.status === 'Present').length;
    const totalAbsent = currentMonthData.filter(record => record.status === 'Absent').length;
    const totalLeaves = currentMonthData.filter(record => record.status === 'Leave').length;
    const totalWorkingDays = totalPresent + totalAbsent + totalLeaves;
    const attendancePercentage = totalWorkingDays > 0 ? ((totalPresent / totalWorkingDays) * 100).toFixed(1) : 85;
    
    const totalWorkingHours = currentMonthData.reduce((sum, record) => {
      return sum + (parseFloat(record.workingHours) || 0);
    }, 0);

    setDashboardStats({
      totalPresent: totalPresent || 18,
      totalAbsent: totalAbsent || 2,
      totalLeaves: totalLeaves || 1,
      workingHours: totalWorkingHours.toFixed(1) || '144.5',
      projectsAssigned: 3,
      tasksCompleted: 15,
      attendancePercentage: parseFloat(attendancePercentage) || 85,
    });
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployeeInfo(),
        fetchAttendanceData(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getAttendanceStatusColor = (status) => {
    const colors = {
      'Present': "#10b981",
      'Absent': "#ef4444",
      'Leave': "#f59e0b",
      'Half Day': "#6366f1",
    };
    return colors[status] || "#6b7280";
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'warning': return <FaClock style={{ color: '#f59e0b' }} />;
      case 'error': return <FaCalendarTimes style={{ color: '#ef4444' }} />;
      default: return <FaBell style={{ color: '#3b82f6' }} />;
    }
  };

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <FaHome style={{ marginRight: 12 }} />
              Employee Dashboard
            </h1>
            <p>
              Welcome back, {employeeInfo?.name || currentUser.name || currentUser.username || "Employee"}! 
              Here's your personal dashboard with all important information.
            </p>
          </div>
          <div className="header-date">
            <div className="current-date">
              {new Date().toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Profile Card */}
      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <FaUserTie size={48} />
            </div>
            <div className="profile-info">
              <h2>{employeeInfo?.name || currentUser.name || "Employee Name"}</h2>
              <p className="profile-role">
                <FaBriefcase style={{ marginRight: 8 }} />
                {employeeInfo?.role || currentUser.role || "Employee"} 
                {employeeInfo?.department && ` - ${employeeInfo.department}`}
              </p>
              <p className="profile-id">
                <FaIdCard style={{ marginRight: 8 }} />
                Employee ID: {employeeInfo?.employeeId || currentUser.id || "EMP001"}
              </p>
            </div>
            <div className="profile-status">
              <div className="status-badge active">
                <FaCheckCircle size={12} />
                Active
              </div>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-row">
              <div className="detail-item">
                <FaEnvelope style={{ marginRight: 8, color: "#3b82f6" }} />
                <span>{employeeInfo?.email || currentUser.email || "employee@company.com"}</span>
              </div>
              <div className="detail-item">
                <FaPhone style={{ marginRight: 8, color: "#10b981" }} />
                <span>{employeeInfo?.phone || "+1 (555) 123-4567"}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-item">
                <FaCalendarAlt style={{ marginRight: 8, color: "#f59e0b" }} />
                <span>Joined: {formatDate(employeeInfo?.joinDate || "2024-01-15")}</span>
              </div>
              <div className="detail-item">
                <FaMapMarkerAlt style={{ marginRight: 8, color: "#ef4444" }} />
                <span>{employeeInfo?.location || "Office Location"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <FaCalendarCheck size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.totalPresent}</div>
            <div className="stat-title">Days Present</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              This month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            <FaChartLine size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.attendancePercentage}%</div>
            <div className="stat-title">Attendance Rate</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Overall performance
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <FaBusinessTime size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.workingHours}</div>
            <div className="stat-title">Working Hours</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              This month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
            <FaAward size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.tasksCompleted}</div>
            <div className="stat-title">Tasks Completed</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              This month
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Recent Attendance Section */}
        <div className="attendance-section">
          <div className="section-header">
            <h2>
              <FaCalendarWeek style={{ marginRight: 12 }} />
              Recent Attendance (Last 7 Days)
            </h2>
          </div>

          <div className="attendance-list">
            {recentAttendance.length === 0 ? (
              <div className="no-data">
                <FaCalendarTimes size={48} />
                <h3>No Attendance Data</h3>
                <p>No recent attendance records found.</p>
              </div>
            ) : (
              recentAttendance.map((record, index) => (
                <div key={index} className="attendance-item">
                  <div className="attendance-date">
                    <div className="day-name">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="date-number">
                      {new Date(record.date).getDate()}
                    </div>
                  </div>
                  
                  <div className="attendance-details">
                    <div className="attendance-status">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getAttendanceStatusColor(record.status),
                        }}
                      >
                        {record.status}
                      </span>
                    </div>
                    
                    {record.status === 'Present' && (
                      <div className="time-info">
                        <div className="time-item">
                          <FaClock style={{ marginRight: 4 }} />
                          <span>In: {record.checkIn}</span>
                        </div>
                        <div className="time-item">
                          <FaClock style={{ marginRight: 4 }} />
                          <span>Out: {record.checkOut}</span>
                        </div>
                        <div className="working-hours">
                          <FaBusinessTime style={{ marginRight: 4 }} />
                          <span>{record.workingHours} hrs</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="notifications-section">
          <div className="section-header">
            <h2>
              <FaBell style={{ marginRight: 12 }} />
              Recent Notifications
            </h2>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-data">
                <FaBell size={48} />
                <h3>No Notifications</h3>
                <p>No recent notifications found.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-date">
                      {formatDate(notification.date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div className="monthly-summary">
        <div className="section-header">
          <h2>
            <FaChartLine style={{ marginRight: 12 }} />
            {getMonthName(currentMonth)} {currentYear} Summary
          </h2>
        </div>

        <div className="summary-grid">
          <div className="summary-card present">
            <div className="summary-icon">
              <FaCheckCircle size={24} />
            </div>
            <div className="summary-info">
              <div className="summary-number">{dashboardStats.totalPresent}</div>
              <div className="summary-label">Present Days</div>
            </div>
          </div>

          <div className="summary-card absent">
            <div className="summary-icon">
              <FaCalendarTimes size={24} />
            </div>
            <div className="summary-info">
              <div className="summary-number">{dashboardStats.totalAbsent}</div>
              <div className="summary-label">Absent Days</div>
            </div>
          </div>

          <div className="summary-card leave">
            <div className="summary-icon">
              <FaCalendarAlt size={24} />
            </div>
            <div className="summary-info">
              <div className="summary-number">{dashboardStats.totalLeaves}</div>
              <div className="summary-label">Leave Days</div>
            </div>
          </div>

          <div className="summary-card projects">
            <div className="summary-icon">
              <FaProjectDiagram size={24} />
            </div>
            <div className="summary-info">
              <div className="summary-number">{dashboardStats.projectsAssigned}</div>
              <div className="summary-label">Projects Assigned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <h2>
            <FaCogs style={{ marginRight: 12 }} />
            Quick Actions
          </h2>
        </div>

        <div className="actions-grid">
          <button className="action-button">
            <FaCalendarCheck size={20} />
            <span>Mark Attendance</span>
          </button>
          
          <button className="action-button">
            <FaCalendarAlt size={20} />
            <span>Apply for Leave</span>
          </button>
          
          <button className="action-button">
            <FaTasks size={20} />
            <span>View My Tasks</span>
          </button>
          
          <button className="action-button">
            <FaProjectDiagram size={20} />
            <span>My Projects</span>
          </button>
          
          <button className="action-button">
            <FaUser size={20} />
            <span>Update Profile</span>
          </button>
          
          <button className="action-button">
            <FaClipboardList size={20} />
            <span>Timesheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
