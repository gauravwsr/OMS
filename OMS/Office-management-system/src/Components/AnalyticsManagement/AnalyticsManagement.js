import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './AnalyticsManagement.css';

const AnalyticsManagement = () => {
  const [activeTab, setActiveTab] = useState('leave');
  const [leaveData, setLeaveData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [checkInOutData, setCheckInOutData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    averageAttendance: 0,
    topPerformers: []
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.filter(user => user.role === 'Employee'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined
        }
      };

      // Fetch different data based on active tab
      switch (activeTab) {
        case 'leave':
          await fetchLeaveData(config);
          break;
        case 'attendance':
          await fetchAttendanceData(config);
          break;
        case 'checkinout':
          await fetchCheckInOutData(config);
          break;
        default:
          await fetchLeaveData(config);
      }

      await fetchAnalytics(config);
    } catch (error) {
      setError('Error fetching analytics data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveData = async (config) => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/leave-analytics', config);
      setLeaveData(response.data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setLeaveData([]);
    }
  };

  const fetchAttendanceData = async (config) => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/attendance-analytics', config);
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    }
  };

  const fetchCheckInOutData = async (config) => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/checkinout-analytics', config);
      setCheckInOutData(response.data || []);
    } catch (error) {
      console.error('Error fetching check-in/out data:', error);
      setCheckInOutData([]);
    }
  };

  const fetchAnalytics = async (config) => {
    try {
      const analyticsData = {
        totalEmployees: employees.length,
        totalLeaves: leaveData.length,
        averageAttendance: attendanceData.length > 0 
          ? Math.round(attendanceData.reduce((acc, emp) => acc + emp.attendancePercentage, 0) / attendanceData.length)
          : 0,
        topPerformers: attendanceData
          .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
          .slice(0, 5)
      };
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const downloadExcel = () => {
    let dataToExport = [];
    let fileName = '';

    switch (activeTab) {
      case 'leave':
        dataToExport = leaveData.map(leave => ({
          'Employee Name': leave.employeeName || leave.name,
          'Employee Email': leave.employeeEmail || leave.email,
          'Leave Type': leave.leaveType,
          'Start Date': new Date(leave.startDate).toLocaleDateString(),
          'End Date': new Date(leave.endDate).toLocaleDateString(),
          'Days': leave.totalDays,
          'Reason': leave.reason,
          'Status': leave.status,
          'Applied Date': new Date(leave.createdAt).toLocaleDateString(),
          'Approved By': leave.approvedBy || 'Pending'
        }));
        fileName = 'Employee_Leave_Report';
        break;

      case 'attendance':
        dataToExport = attendanceData.map(att => ({
          'Employee Name': att.employeeName,
          'Email': att.email,
          'Department': att.department,
          'Total Days': att.totalDays,
          'Present Days': att.presentDays,
          'Absent Days': att.absentDays,
          'Attendance Percentage': `${att.attendancePercentage}%`
        }));
        fileName = 'Employee_Attendance_Report';
        break;

      case 'checkinout':
        dataToExport = checkInOutData.map(record => ({
          'Employee Name': record.employeeName,
          'Email': record.email,
          'Date': record.date,
          'Check In': record.checkIn,
          'Check Out': record.checkOut,
          'Total Hours': record.totalHours,
          'Status': record.status
        }));
        fileName = 'Employee_CheckInOut_Report';
        break;

      default:
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const currentDate = new Date().toISOString().split('T')[0];
    saveAs(data, `${fileName}_${currentDate}.xlsx`);
  };

  const renderLeaveAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-stats">
        <div className="stat-card">
          <h3>Total Leaves</h3>
          <p className="stat-number">{leaveData.length}</p>
        </div>
        <div className="stat-card">
          <h3>Approved Leaves</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Approved').length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Leaves</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Pending').length}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected Leaves</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Rejected').length}</p>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <h3>Leave Details</h3>
          <button onClick={downloadExcel} className="download-btn">
            📊 Download Excel
          </button>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.map((leave, index) => (
                <tr key={index}>
                  <td>{leave.employeeName || leave.name}</td>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.totalDays}</td>
                  <td className={`status ${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </td>
                  <td className="reason-cell">{leave.reason}</td>
                </tr>
              ))}
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
          <h3>Total Employees</h3>
          <p className="stat-number">{attendanceData.length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Attendance</h3>
          <p className="stat-number">{analytics.averageAttendance}%</p>
        </div>
        <div className="stat-card">
          <h3>High Performers</h3>
          <p className="stat-number">{attendanceData.filter(a => a.attendancePercentage >= 90).length}</p>
        </div>
        <div className="stat-card">
          <h3>Low Attendance</h3>
          <p className="stat-number">{attendanceData.filter(a => a.attendancePercentage < 70).length}</p>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <h3>Attendance Details</h3>
          <button onClick={downloadExcel} className="download-btn">
            📊 Download Excel
          </button>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Total Days</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Attendance %</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((att, index) => (
                <tr key={index}>
                  <td>{att.employeeName}</td>
                  <td>{att.department}</td>
                  <td>{att.totalDays}</td>
                  <td>{att.presentDays}</td>
                  <td>{att.absentDays}</td>
                  <td className={`attendance-percent ${att.attendancePercentage >= 90 ? 'excellent' : att.attendancePercentage >= 70 ? 'good' : 'poor'}`}>
                    {att.attendancePercentage}%
                  </td>
                  <td>
                    <span className={`performance-badge ${att.attendancePercentage >= 90 ? 'excellent' : att.attendancePercentage >= 70 ? 'good' : 'poor'}`}>
                      {att.attendancePercentage >= 90 ? 'Excellent' : att.attendancePercentage >= 70 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCheckInOutAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-stats">
        <div className="stat-card">
          <h3>Total Records</h3>
          <p className="stat-number">{checkInOutData.length}</p>
        </div>
        <div className="stat-card">
          <h3>On Time</h3>
          <p className="stat-number">{checkInOutData.filter(r => r.checkIn.includes('8:') || r.checkIn.includes('9:')).length}</p>
        </div>
        <div className="stat-card">
          <h3>Late Arrivals</h3>
          <p className="stat-number">{checkInOutData.filter(r => r.checkIn.includes('10:') || r.checkIn.includes('11:')).length}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Working Hours</h3>
          <p className="stat-number">8.2 hrs</p>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <h3>Check-In/Check-Out Details</h3>
          <button onClick={downloadExcel} className="download-btn">
            📊 Download Excel
          </button>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Punctuality</th>
              </tr>
            </thead>
            <tbody>
              {checkInOutData.map((record, index) => (
                <tr key={index}>
                  <td>{record.employeeName}</td>
                  <td>{record.date}</td>
                  <td className={record.checkIn.includes('10:') || record.checkIn.includes('11:') ? 'late' : 'on-time'}>
                    {record.checkIn}
                  </td>
                  <td>{record.checkOut}</td>
                  <td>{record.totalHours}</td>
                  <td className={`status ${record.status.toLowerCase()}`}>
                    {record.status}
                  </td>
                  <td>
                    <span className={`punctuality-badge ${record.checkIn.includes('8:') || record.checkIn.includes('9:') ? 'on-time' : 'late'}`}>
                      {record.checkIn.includes('8:') || record.checkIn.includes('9:') ? 'On Time' : 'Late'}
                    </span>
                  </td>
                </tr>
              ))}
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

      <div className="analytics-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>Employee:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          🏖️ Leave Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          📅 Attendance Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'checkinout' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkinout')}
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
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'leave' && renderLeaveAnalytics()}
          {activeTab === 'attendance' && renderAttendanceAnalytics()}
          {activeTab === 'checkinout' && renderCheckInOutAnalytics()}
        </>
      )}
    </div>
  );
};

export default AnalyticsManagement;
