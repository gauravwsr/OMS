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

  // Test token function
  const testTokenAuth = async () => {
    const token = localStorage.getItem('token');
    console.log('Testing token authentication...');
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Token test successful:', response.data);
    } catch (error) {
      console.error('Token test failed:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        // Optionally redirect to login
        localStorage.removeItem('token');
      }
    }
  };

  // Load mock data immediately
  const loadMockData = () => {
    console.log('Loading mock data...');
    
    const mockLeaveData = [
      {
        _id: '1',
        employeeName: 'John Doe',
        employeeEmail: 'john.doe@company.com',
        department: 'Development',
        leaveType: 'Annual',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        totalDays: 3,
        reason: 'Family vacation',
        status: 'Approved',
        createdAt: '2025-01-10',
        approvedBy: 'Manager'
      },
      {
        _id: '2',
        employeeName: 'Jane Smith',
        employeeEmail: 'jane.smith@company.com',
        department: 'Marketing',
        leaveType: 'Sick',
        startDate: '2025-01-20',
        endDate: '2025-01-22',
        totalDays: 3,
        reason: 'Medical treatment',
        status: 'Pending',
        createdAt: '2025-01-18',
        approvedBy: null
      },
      {
        _id: '3',
        employeeName: 'Mike Johnson',
        employeeEmail: 'mike.johnson@company.com',
        department: 'Sales',
        leaveType: 'Emergency',
        startDate: '2025-01-25',
        endDate: '2025-01-25',
        totalDays: 1,
        reason: 'Emergency at home',
        status: 'Approved',
        createdAt: '2025-01-24',
        approvedBy: 'HR Manager'
      }
    ];

    const mockAttendanceData = [
      {
        employeeName: 'John Doe',
        email: 'john.doe@company.com',
        department: 'Development',
        totalDays: 22,
        presentDays: 20,
        absentDays: 2,
        attendancePercentage: 91
      },
      {
        employeeName: 'Jane Smith',
        email: 'jane.smith@company.com',
        department: 'Marketing',
        totalDays: 22,
        presentDays: 18,
        absentDays: 4,
        attendancePercentage: 82
      },
      {
        employeeName: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        department: 'Sales',
        totalDays: 22,
        presentDays: 21,
        absentDays: 1,
        attendancePercentage: 95
      }
    ];

    const mockCheckInOutData = [
      {
        employeeName: 'John Doe',
        email: 'john.doe@company.com',
        date: '2025-01-29',
        checkIn: '9:00 AM',
        checkOut: '6:00 PM',
        totalHours: '9 hrs',
        status: 'Present'
      },
      {
        employeeName: 'Jane Smith',
        email: 'jane.smith@company.com',
        date: '2025-01-29',
        checkIn: '10:30 AM',
        checkOut: '7:30 PM',
        totalHours: '9 hrs',
        status: 'Present'
      },
      {
        employeeName: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        date: '2025-01-29',
        checkIn: '8:45 AM',
        checkOut: '5:45 PM',
        totalHours: '9 hrs',
        status: 'Present'
      }
    ];

    const mockEmployees = [
      { _id: '1', name: 'John Doe', role: 'Employee' },
      { _id: '2', name: 'Jane Smith', role: 'Employee' },
      { _id: '3', name: 'Mike Johnson', role: 'Employee' }
    ];

    setLeaveData(mockLeaveData);
    setAttendanceData(mockAttendanceData);
    setCheckInOutData(mockCheckInOutData);
    setEmployees(mockEmployees);
    setError('Using demo data for analytics display');
    console.log('Mock data loaded successfully');
  };

  useEffect(() => {
    console.log('Component mounted, starting data fetch...');
    // Load mock data first for immediate display
    loadMockData();
    testTokenAuth(); // Test token first
    fetchEmployees();
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    console.log('Dependencies changed, refetching data...');
    console.log('dateRange:', dateRange);
    console.log('selectedEmployee:', selectedEmployee);
    console.log('activeTab:', activeTab);
    fetchAnalyticsData();
  }, [dateRange, selectedEmployee, activeTab]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('fetchEmployees - Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.error('No token found for fetching employees');
        setError('Authentication required. Please login again.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/all-users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Employees fetched successfully:', response.data.length);
      setEmployees(response.data.filter(user => user.role === 'Employee'));
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('token');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        // Mock employees data
        const mockEmployees = [
          { _id: '1', name: 'John Doe', role: 'Employee' },
          { _id: '2', name: 'Jane Smith', role: 'Employee' },
          { _id: '3', name: 'Mike Johnson', role: 'Employee' }
        ];
        setEmployees(mockEmployees);
      }
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('fetchAnalyticsData - Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined
        }
      };

      console.log('Request config:', config);

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
      console.log('Fetching leave data with config:', config);
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('http://localhost:5000/api/analytics/leave-analytics', config);
      console.log('Leave data response:', response.data);
      setLeaveData(response.data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  const fetchAttendanceData = async (config) => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/attendance-analytics', config);
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchCheckInOutData = async (config) => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/checkinout-analytics', config);
      setCheckInOutData(response.data || []);
    } catch (error) {
      console.error('Error fetching check-in/out data:', error);
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
          'Employee Email': leave.employeeEmail || leave.email || 'N/A',
          'Department': leave.department || 'General',
          'Leave Type': leave.leaveType,
          'Start Date': new Date(leave.startDate).toLocaleDateString('en-IN'),
          'End Date': new Date(leave.endDate).toLocaleDateString('en-IN'),
          'Total Days': leave.totalDays,
          'Reason': leave.reason,
          'Status': leave.status,
          'Applied Date': new Date(leave.createdAt).toLocaleDateString('en-IN'),
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

  const renderLeaveAnalytics = () => {
    console.log('Rendering leave analytics, leaveData:', leaveData);
    console.log('leaveData length:', leaveData.length);
    
    return (
    <div className="analytics-content">
      <div className="analytics-stats">
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
      </div>

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
                <th>Employee Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.length > 0 ? (
                leaveData.map((leave, index) => (
                  <tr key={leave._id || index}>
                    <td className="employee-name">
                      <strong>{leave.employeeName || leave.name || 'Unknown'}</strong>
                    </td>
                    <td className="employee-email">
                      {leave.employeeEmail || leave.email || 'N/A'}
                    </td>
                    <td className="department">
                      <span className="dept-badge">{leave.department || 'General'}</span>
                    </td>
                    <td className="leave-type">
                      <span className={`leave-type-badge ${leave.leaveType?.toLowerCase().replace(' ', '-')}`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td>{new Date(leave.startDate).toLocaleDateString('en-IN')}</td>
                    <td>{new Date(leave.endDate).toLocaleDateString('en-IN')}</td>
                    <td className="days-count">
                      <strong>{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}</strong>
                    </td>
                    <td className={`status ${leave.status?.toLowerCase()}`}>
                      <span className="status-badge">{leave.status}</span>
                    </td>
                    <td>{new Date(leave.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="reason-cell" title={leave.reason}>
                      {leave.reason?.length > 50 ? `${leave.reason.substring(0, 50)}...` : leave.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div className="no-data-message">
                      <span>📋</span>
                      <p>No leave records found for the selected criteria</p>
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
  };

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
          {error.includes('demo data') && (
            <div className="mock-data-notice">
              <p>ℹ️ Demo Mode: Showing sample employee leave details</p>
              <p>Start the backend server to see real data</p>
            </div>
          )}
        </div>
      )}

      {/* Always show data if available, regardless of error state */}
      {!loading && (
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
