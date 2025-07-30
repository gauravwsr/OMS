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
      
      // Mock detailed leave data for demonstration
      const mockLeaveData = [
        {
          _id: '1',
          employeeName: 'John Doe',
          employeeEmail: 'john.doe@company.com',
          department: 'Development',
          employeeId: 'EMP001',
          leaveType: 'Annual Leave',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          totalDays: 3,
          reason: 'Family vacation to Goa with wife and kids',
          status: 'Approved',
          appliedDate: '2025-01-10',
          approvedBy: 'Manager Smith',
          approvedDate: '2025-01-11',
          comments: 'Approved for family time',
          emergencyContact: '+91 9876543210',
          leaveBalance: 12
        },
        {
          _id: '2',
          employeeName: 'Jane Smith',
          employeeEmail: 'jane.smith@company.com',
          department: 'Marketing',
          employeeId: 'EMP002',
          leaveType: 'Sick Leave',
          startDate: '2025-01-20',
          endDate: '2025-01-22',
          totalDays: 3,
          reason: 'Fever and medical treatment required',
          status: 'Pending',
          appliedDate: '2025-01-18',
          approvedBy: null,
          approvedDate: null,
          comments: 'Medical certificate attached',
          emergencyContact: '+91 9876543211',
          leaveBalance: 8
        },
        {
          _id: '3',
          employeeName: 'Mike Johnson',
          employeeEmail: 'mike.johnson@company.com',
          department: 'Sales',
          employeeId: 'EMP003',
          leaveType: 'Emergency Leave',
          startDate: '2025-01-25',
          endDate: '2025-01-25',
          totalDays: 1,
          reason: 'Family emergency - father hospitalized',
          status: 'Approved',
          appliedDate: '2025-01-24',
          approvedBy: 'HR Manager',
          approvedDate: '2025-01-24',
          comments: 'Emergency approved immediately',
          emergencyContact: '+91 9876543212',
          leaveBalance: 15
        },
        {
          _id: '4',
          employeeName: 'Sarah Wilson',
          employeeEmail: 'sarah.wilson@company.com',
          department: 'HR',
          employeeId: 'EMP004',
          leaveType: 'Maternity Leave',
          startDate: '2025-02-01',
          endDate: '2025-04-30',
          totalDays: 89,
          reason: 'Maternity leave for childbirth',
          status: 'Approved',
          appliedDate: '2025-01-05',
          approvedBy: 'CEO',
          approvedDate: '2025-01-06',
          comments: 'Full maternity benefits applicable',
          emergencyContact: '+91 9876543213',
          leaveBalance: 0
        },
        {
          _id: '5',
          employeeName: 'David Brown',
          employeeEmail: 'david.brown@company.com',
          department: 'Finance',
          employeeId: 'EMP005',
          leaveType: 'Casual Leave',
          startDate: '2025-01-30',
          endDate: '2025-01-30',
          totalDays: 1,
          reason: 'Personal work - bank visit',
          status: 'Rejected',
          appliedDate: '2025-01-28',
          approvedBy: 'Finance Manager',
          approvedDate: '2025-01-29',
          comments: 'Project deadline approaching, cannot approve',
          emergencyContact: '+91 9876543214',
          leaveBalance: 10
        }
      ];
      
      setLeaveData(mockLeaveData);
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
          'Leave Balance': leave.leaveBalance + ' days' || 'N/A'
        }));
        fileName = 'Employee_Leave_Applications_Report';
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
      {/* <div className="analytics-stats">
        <div className="stat-card">
          <h3>Total Leave Applications</h3>
          <p className="stat-number">{leaveData.length}</p>
          <span className="stat-subtitle">All time applications</span>
        </div>
        <div className="stat-card approved">
          <h3>Approved Leaves</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Approved').length}</p>
          <span className="stat-subtitle">
            {leaveData.length > 0 ? Math.round((leaveData.filter(l => l.status === 'Approved').length / leaveData.length) * 100) : 0}% approval rate
          </span>
        </div>
        <div className="stat-card pending">
          <h3>Pending Reviews</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Pending').length}</p>
          <span className="stat-subtitle">Awaiting approval</span>
        </div>
        <div className="stat-card rejected">
          <h3>Rejected Applications</h3>
          <p className="stat-number">{leaveData.filter(l => l.status === 'Rejected').length}</p>
          <span className="stat-subtitle">
            {leaveData.length > 0 ? Math.round((leaveData.filter(l => l.status === 'Rejected').length / leaveData.length) * 100) : 0}% rejection rate
          </span>
        </div>
      </div> */}

      <div className="data-table-container">
        <div className="table-header">
          <h3>Leave Details</h3>
          <div className="header-actions">
            <div className="quick-stats">
              <span className="quick-stat">
                Most Common: <strong>{
                  leaveData.length > 0 ? 
                  Object.entries(leaveData.reduce((acc, leave) => {
                    acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
                    return acc;
                  }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
                  : 'N/A'
                }</strong>
              </span>
              <span className="quick-stat">
                Avg Days: <strong>{
                  leaveData.length > 0 ? 
                  Math.round(leaveData.reduce((acc, leave) => acc + leave.totalDays, 0) / leaveData.length * 10) / 10
                  : 0
                } days</strong>
              </span>
            </div>
            <button onClick={downloadExcel} className="download-btn">
              📊 Download Excel
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Leave Type</th>
                <th>Leave Period</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Approval Details</th>
                <th>Leave Balance</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.length > 0 ? (
                leaveData.map((leave, index) => (
                  <tr key={leave._id || index}>
                    <td className="employee-details">
                      <div className="employee-info">
                        <strong className="employee-name">{leave.employeeName || leave.name || 'Unknown'}</strong>
                        <span className="employee-id">ID: {leave.employeeId || 'N/A'}</span>
                        <span className="employee-email">{leave.employeeEmail || leave.email || 'N/A'}</span>
                        <span className="employee-dept">{leave.department || 'General'}</span>
                      </div>
                    </td>
                    <td className="leave-type">
                      <span className={`leave-type-badge ${leave.leaveType?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="leave-period">
                      <div className="date-range">
                        <strong>From:</strong> {new Date(leave.startDate).toLocaleDateString('en-IN')}<br/>
                        <strong>To:</strong> {new Date(leave.endDate).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="duration">
                      <span className="days-count">
                        <strong>{leave.totalDays}</strong>
                        <br/>
                        <small>{leave.totalDays === 1 ? 'day' : 'days'}</small>
                      </span>
                    </td>
                    <td className="reason-cell" title={leave.reason}>
                      <div className="reason-content">
                        {leave.reason?.length > 60 ? `${leave.reason.substring(0, 60)}...` : leave.reason}
                      </div>
                    </td>
                    <td className={`status ${leave.status?.toLowerCase()}`}>
                      <span className="status-badge">{leave.status}</span>
                    </td>
                    <td className="applied-date">
                      {new Date(leave.appliedDate || leave.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="approval-details">
                      {leave.status === 'Approved' && (
                        <div className="approval-info">
                          <strong>By:</strong> {leave.approvedBy}<br/>
                          <strong>Date:</strong> {leave.approvedDate ? new Date(leave.approvedDate).toLocaleDateString('en-IN') : 'N/A'}<br/>
                          {leave.comments && (
                            <small className="approval-comment" title={leave.comments}>
                              💬 {leave.comments.length > 30 ? `${leave.comments.substring(0, 30)}...` : leave.comments}
                            </small>
                          )}
                        </div>
                      )}
                      {leave.status === 'Pending' && (
                        <div className="pending-info">
                          <span className="pending-text">⏳ Under Review</span>
                        </div>
                      )}
                      {leave.status === 'Rejected' && (
                        <div className="rejection-info">
                          <strong>By:</strong> {leave.approvedBy}<br/>
                          <strong>Date:</strong> {leave.approvedDate ? new Date(leave.approvedDate).toLocaleDateString('en-IN') : 'N/A'}<br/>
                          {leave.comments && (
                            <small className="rejection-comment" title={leave.comments}>
                              ❌ {leave.comments.length > 30 ? `${leave.comments.substring(0, 30)}...` : leave.comments}
                            </small>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="leave-balance">
                      <span className={`balance-count ${leave.leaveBalance <= 5 ? 'low' : 'normal'}`}>
                        {leave.leaveBalance} days
                      </span>
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
