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
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow's date to include today's applications
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
      const response = await axios.get('http://138.197.27.240:5001/api/users/all-users', {
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

      console.log('Fetching analytics with config:', config); // Debug log
      console.log('Date Range:', dateRange); // Debug log
      console.log('Selected Employee:', selectedEmployee); // Debug log

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
      const response = await axios.get('http://138.197.27.240:5001/api/analytics/leave-analytics', config);
      console.log('Fetched Leave Data:', response.data); // Debugging log
      setLeaveData(response.data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setLeaveData([]);
    }
  };

  const fetchAttendanceData = async (config) => {
    try {
      const response = await axios.get('http://138.197.27.240:5001/api/analytics/attendance-analytics', config);
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    }
  };

  const fetchCheckInOutData = async (config) => {
    try {
      const response = await axios.get('http://138.197.27.240:5001/api/analytics/checkinout-analytics', config);
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
          'Employee Name': leave.employeeName || leave.name || 'Unknown',
          'Employee ID': leave.employeeId || 'N/A',
          'Employee Email': leave.employeeEmail || leave.email || 'N/A',
          'Department': leave.department || 'General',
          'Leave Type': leave.leaveType,
          'Start Date': new Date(leave.startDate).toLocaleDateString('en-IN'),
          'End Date': new Date(leave.endDate).toLocaleDateString('en-IN'),
          'Total Days': leave.totalDays,
          'Reason': leave.reason,
          'Status': leave.status,
          'Applied Date': new Date(leave.appliedDate || leave.createdAt).toLocaleDateString('en-IN'),
          'Approved By': leave.approvedBy || 'Pending',
          'Approved Date': leave.approvedDate ? new Date(leave.approvedDate).toLocaleDateString('en-IN') : 'N/A',
          'Comments': leave.comments || 'N/A',
          'Emergency Contact': leave.emergencyContact || 'N/A',
        }));
        fileName = 'Employee_Leave_Applications_Report';
        break;

      case 'attendance':
        dataToExport = attendanceData.map(att => ({
          'Employee Name': att.employeeName,
          'Email': att.email,
          'Department': att.department,
          'Total Days': att.totalDays,
          'Present Days': Math.min(att.presentDays, att.totalDays),
          'Absent Days': Math.max(att.absentDays, 0),
          'Attendance Percentage': `${Math.min(att.attendancePercentage, 100)}%`
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
      <div className="data-table-container">
        <div className="table-header">
          <h3>Leave Details</h3>
          <div className="header-actions">
            <div className="quick-stats">
              <span className="quick-stat">
                Most Common: <strong style={{ color: '#764ba2', fontWeight: 700 }}>
                  {(() => {
                    if (leaveData.length === 0) return 'N/A';
                    const counts = leaveData.reduce((acc, leave) => {
                      acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
                      return acc;
                    }, {});
                    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
                    return sorted[0]?.[0] || 'N/A';
                  })()}
                </strong>
              </span>
              <span className="quick-stat">
                Avg Days: <strong style={{ color: '#48bb78', fontWeight: 700 }}>
                  {leaveData.length > 0 ?
                    (Math.round(leaveData.reduce((acc, leave) => acc + leave.totalDays, 0) / leaveData.length * 10) / 10) : 0
                  } days
                </strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={downloadExcel} className="download-btn">
                📊 Download Excel
              </button>
            </div>
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
                      <div className="emp-avatar" title={leave.employeeName || leave.name || 'Unknown'}>
                        <span>{(leave.employeeName || leave.name || 'U').charAt(0)}</span>
                      </div>
                      <div className="emp-info">
                        <div className="emp-name">{leave.employeeName || leave.name || 'Unknown'}</div>
                        <div className="emp-meta">
                          <span className="emp-id">ID: {leave.employeeId || 'N/A'}</span>
                          <span className="emp-email">{leave.employeeEmail || leave.email || 'N/A'}</span>
                          <span className="emp-dept">{leave.department || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-leave-type ${leave.leaveType ? leave.leaveType.toLowerCase().replace(/\s+/g, '-') : ''}`}>
                        {leave.leaveType || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="date-range">
                        <span>{new Date(leave.startDate).toLocaleDateString('en-IN')}</span>
                        <span className="date-arrow">→</span>
                        <span>{new Date(leave.endDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="days-count">
                        <strong>{leave.totalDays}</strong> <small>{leave.totalDays === 1 ? 'day' : 'days'}</small>
                      </span>
                    </td>
                    <td className="reason-cell">
                      <span title={leave.reason}>{leave.reason?.length > 40 ? `${leave.reason.substring(0, 40)}...` : leave.reason}</span>
                    </td>
                    <td>
                      <span className={`badge badge-status ${leave.status?.toLowerCase()}`}>{leave.status}</span>
                    </td>
                    <td>
                      <span>{new Date(leave.appliedDate || leave.createdAt).toLocaleDateString('en-IN')}</span>
                    </td>
                    <td>
                      {leave.status === 'Approved' && (
                        <div className="approval-info">
                          <span className="approved-by">By: {leave.approvedBy || 'N/A'}</span><br/>
                          <span className="approved-date">{leave.approvedDate ? new Date(leave.approvedDate).toLocaleDateString('en-IN') : 'N/A'}</span><br/>
                          {leave.comments && (
                            <span className="approval-comment" title={leave.comments}>
                              💬 {leave.comments.length > 25 ? `${leave.comments.substring(0, 25)}...` : leave.comments}
                            </span>
                          )}
                        </div>
                      )}
                      {leave.status === 'Pending' && (
                        <span className="pending-text">⏳ Under Review</span>
                      )}
                      {leave.status === 'Rejected' && (
                        <div className="rejection-info">
                          <span className="rejected-by">By: {leave.approvedBy || 'N/A'}</span><br/>
                          <span className="rejected-date">{leave.approvedDate ? new Date(leave.approvedDate).toLocaleDateString('en-IN') : 'N/A'}</span><br/>
                          {leave.comments && (
                            <span className="rejection-comment" title={leave.comments}>
                              ❌ {leave.comments.length > 25 ? `${leave.comments.substring(0, 25)}...` : leave.comments}
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
                      <p>No leave applications found for the selected criteria</p>
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
                  <td>
                    <span className={
                      att.attendancePercentage >= 100 ? 'present-badge excellent' :
                      att.attendancePercentage >= 80 ? 'present-badge good' :
                      'present-badge poor'
                    }>
                      {Math.min(att.presentDays, att.totalDays)}
                    </span>
                  </td>
                  <td>{Math.max(att.absentDays, 0)}</td>
                  <td className={`attendance-percent ${att.attendancePercentage >= 90 ? 'excellent' : att.attendancePercentage >= 70 ? 'good' : 'poor'}`}>
                    {Math.min(att.attendancePercentage, 100)}%
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
