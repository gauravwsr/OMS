import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

const HRattendance = () => {
  const [userRole, setUserRole] = useState('employee');
  const [selectedView, setSelectedView] = useState('Weekly');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDates, setLeaveDates] = useState({ start: '', end: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveType, setLeaveType] = useState('Leave');
  const [attendanceData, setAttendanceData] = useState({
    labels: ['Present', 'Absent', 'On Leave'],
    present: 60,
    absent: 20,
    onLeave: 20
  });

  // Sample employee data
  const employees = [
    {
      id: 1,
      name: 'John Smith',
      position: 'Senior Developer',
      department: 'Engineering',
      leaves: [
        { id: 1, startDate: '2025-04-16', endDate: '2025-04-18', reason: 'Family vacation', status: 'approved' }
      ],
      attendance: {
        present: [95, 85, 50, 110, 95, 95, 110],
        absent: [60, 85, 100, 70, 95, 75, 85],
        leave: [110, 95, 85, 100, 90, 47, 75]
      }
    },
    {
      id: 2,
      name: 'Emily Johnson',
      position: 'UI/UX Designer',
      department: 'Design',
      leaves: [
        { id: 2, startDate: '2025-04-07', endDate: '2025-04-07', reason: 'Medical appointment', status: 'approved' }
      ],
      attendance: {
        present: [90, 80, 60, 100, 90, 90, 100],
        absent: [50, 75, 90, 60, 85, 65, 75],
        leave: [100, 85, 75, 90, 80, 40, 65]
      }
    },
    {
      id: 3,
      name: 'Michael Chen',
      position: 'Product Manager',
      department: 'Product',
      leaves: [
        { id: 3, startDate: '2025-04-22', endDate: '2025-04-22', reason: 'Personal leave', status: 'pending' }
      ],
      attendance: {
        present: [85, 75, 45, 105, 90, 90, 105],
        absent: [55, 80, 95, 65, 90, 70, 80],
        leave: [105, 90, 80, 95, 85, 45, 70]
      }
    }
  ];

  // Holidays data
  const holidays = [
    { date: '2025-04-02', name: 'Muharram' },
    { date: '2025-04-25', name: 'Parsi new year' },
    { date: '2025-07-29', name: 'Eid - Al - Ada' },
    { date: '2025-08-15', name: 'Independence Day' },
    { date: '2025-08-16', name: 'Parsi New Year' },
    { date: '2025-08-29', name: 'Onam' },
    { date: '2025-08-16', name: 'Raksha Bandhan' }
  ];

  useEffect(() => {
    const chartDom = document.getElementById('attendanceChart');
    if (!chartDom) return;
    const myChart = echarts.init(chartDom);
    const employeeData = selectedEmployee
      ? employees.find(emp => emp.id === selectedEmployee)?.attendance
      : employees[0].attendance;
    const option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Present', 'Absents', 'Leave'],
        top: '0%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['Mar 28', 'Mar 29', 'Mar 30', 'Mar 31', 'Apr 1', 'Apr 2', 'Apr 3']
      },
      yAxis: {
        type: 'value',
        max: 120
      },
      series: [
        {
          name: 'Present',
          type: 'bar',
          data: employeeData?.present || [95, 85, 50, 110, 95, 95, 110],
          itemStyle: { color: '#FF7F50' }
        },
        {
          name: 'Absents',
          type: 'bar',
          data: employeeData?.absent || [60, 85, 100, 70, 95, 75, 85],
          itemStyle: { color: '#FFD700' }
        },
        {
          name: 'Leave',
          type: 'bar',
          data: employeeData?.leave || [110, 95, 85, 100, 90, 47, 75],
          itemStyle: { color: '#90EE90' }
        }
      ]
    };
    myChart.setOption(option);
    return () => {
      myChart.dispose();
    };
  }, [selectedEmployee]);

  useEffect(() => {
    const chartDom = document.getElementById('attendancePieChart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: attendanceData.labels
      },
      series: [
        {
          name: 'Attendance',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: attendanceData.present, name: 'Present (60%)', itemStyle: { color: '#FF9F43' } },
            { value: attendanceData.absent, name: 'Absent (20%)', itemStyle: { color: '#5BCFC5' } },
            { value: attendanceData.onLeave, name: 'On Leave (20%)', itemStyle: { color: '#FFCC80' } }
          ]
        }
      ]
    };
    
    myChart.setOption(option);
    return () => {
      myChart.dispose();
    };
  }, [attendanceData]);

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveDates.start || !leaveDates.end || !leaveReason) {
      return;
    }
    const newLeave = {
      id: leaveRequests.length + 1,
      startDate: leaveDates.start,
      endDate: leaveDates.end,
      reason: leaveReason,
      status: 'pending'
    };
    setLeaveRequests([...leaveRequests, newLeave]);
    setShowLeaveModal(false);
    setLeaveReason('');
    setLeaveDates({ start: '', end: '' });

    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed-top m-4 alert alert-success';
    notification.textContent = 'Leave request submitted successfully!';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleApproveLeave = (leaveId) => {
    setLeaveRequests(
      leaveRequests.map(leave =>
        leave.id === leaveId ? { ...leave, status: 'approved' } : leave
      )
    );
  };

  const handleRejectLeave = (leaveId) => {
    setLeaveRequests(
      leaveRequests.map(leave =>
        leave.id === leaveId ? { ...leave, status: 'rejected' } : leave
      )
    );
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    const calendarDays = [];
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      calendarDays.push({
        date: day,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
        isHoliday: false,
        isLeave: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holiday = holidays.find(h => h.date === dateStr);
      let isLeave = false;
      let leaveType = '';
      if (selectedEmployee) {
        const employee = employees.find(emp => emp.id === selectedEmployee);
        if (employee) {
          const leave = employee.leaves.find(l => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            const current = new Date(dateStr);
            return current >= start && current <= end && l.status === 'approved';
          });
          if (leave) {
            isLeave = true;
            leaveType = 'Leave';
          }
        }
      }
      calendarDays.push({
        date: day,
        month,
        year,
        isCurrentMonth: true,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        isLeave,
        leaveType
      });
    }
    
    // Next month days
    const remainingDays = 42 - calendarDays.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        date: day,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
        isHoliday: false,
        isLeave: false
      });
    }
    return calendarDays;
  };

  const renderCalendar = () => {
    const calendarDays = generateCalendarDays();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="modal d-block bg-white" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentMonth(newDate);
                  }}
                  className="btn btn-outline-secondary me-2"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h2 className="modal-title h5 mb-0">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentMonth(newDate);
                  }}
                  className="btn btn-outline-secondary ms-2"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="btn-close"
              ></button>
            </div>
            <div className="modal-body p-0">
              <div className="d-flex border-bottom">
                {weekdays.map(day => (
                  <div key={day} className="flex-grow-1 text-center p-2 fw-medium">{day}</div>
                ))}
              </div>
              <div className="d-flex flex-wrap">
                {calendarDays.map((day, index) => {
                  const isToday = day.isCurrentMonth &&
                    day.date === new Date().getDate() &&
                    day.month === new Date().getMonth() &&
                    day.year === new Date().getFullYear();
                  return (
                    <div
                      key={index}
                      className={`p-2 border-end border-bottom ${day.isCurrentMonth ? 'bg-white' : 'bg-light text-muted'}`}
                      style={{ width: '14.2857%', minHeight: '100px' }}
                    >
                      <div className={`${day.isHoliday ? 'text-primary' : day.isLeave ? 'text-warning' : (day.date % 7 === 0 || day.date % 7 === 6) ? 'text-info' : ''} ${isToday ? 'fw-bold' : ''}`}>
                        {day.date}
                      </div>
                      {day.isHoliday && (
                        <div className="mt-1 bg-primary bg-opacity-10 text-primary small p-1 rounded">
                          {day.holidayName}
                        </div>
                      )}
                      {day.isLeave && (
                        <div className="mt-1 bg-warning bg-opacity-10 text-warning small p-1 rounded">
                          {day.leaveType}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHRDashboard = () => (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 text-dark">HR Dashboard</h1>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setUserRole('employee')}
            className="btn btn-primary"
          >
            Switch to Employee View
          </button>
          <button
            onClick={() => setShowCalendar(true)}
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-calendar me-2"></i>
            View Calendar
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="fas fa-users text-warning fs-3 me-3"></i>
                <div>
                  <h3 className="card-title mb-0">254</h3>
                  <p className="text-muted mb-0">Total Employees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="fas fa-user-minus text-danger fs-3 me-3"></i>
                <div>
                  <h3 className="card-title mb-0">10</h3>
                  <p className="text-muted mb-0">On Leave</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="fas fa-home text-success fs-3 me-3"></i>
                <div>
                  <h3 className="card-title mb-0">20</h3>
                  <p className="text-muted mb-0">Working Remotely</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="fas fa-tasks text-primary fs-3 me-3"></i>
                <div>
                  <h3 className="card-title mb-0">4</h3>
                  <p className="text-muted mb-0">Pending Leaves</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Employee Selection */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5 card-title text-dark mb-3">Employee Attendance</h2>
          <div className="mb-3">
            <label className="form-label">Select Employee</label>
            <select
              className="form-select"
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
              ))}
            </select>
          </div>
          
          {/* Attendance Overview */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="h6 text-dark">Attendance Overview</h3>
              <div className="btn-group">
                <button
                  onClick={() => setSelectedView('Today')}
                  className={`btn btn-sm ${selectedView === 'Today' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedView('Month')}
                  className={`btn btn-sm ${selectedView === 'Month' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setSelectedView('Weekly')}
                  className={`btn btn-sm ${selectedView === 'Weekly' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div id="attendanceChart" style={{ height: '400px' }}></div>
          </div>
        </div>
      </div>
      
      {/* Leave Requests */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5 card-title text-dark mb-4">Leave Requests</h2>
          {leaveRequests.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Date Range</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(leave => {
                    const employee = employees.find(emp => emp.leaves.some(l => l.id === leave.id)) || employees[0];
                    return (
                      <tr key={leave.id}>
                        <td>
                          <div className="fw-medium">{employee.name}</div>
                          <div className="text-muted small">{employee.department}</div>
                        </td>
                        <td>
                          <div>
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td>{leave.reason}</td>
                        <td>
                          <span className={`badge ${
                            leave.status === 'approved' ? 'bg-success' :
                            leave.status === 'rejected' ? 'bg-danger' :
                            'bg-warning text-dark'
                          }`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {leave.status === 'pending' && (
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleApproveLeave(leave.id)}
                                className="btn btn-sm btn-success"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id)}
                                className="btn btn-sm btn-danger"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No pending leave requests.</p>
          )}
        </div>
      </div>
      
      {/* Upcoming Holidays */}
      <div className="card">
        <div className="card-body">
          <h2 className="h5 card-title text-dark mb-4">Upcoming Holidays</h2>
          <div className="list-group list-group-flush">
            <div className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-danger me-3"></span>
                <span className="text-muted">Monday 29 July</span>
              </div>
              <span className="fw-medium">Eid - Al - Ada</span>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-primary me-3"></span>
                <span className="text-muted">Tuesday 15 August</span>
              </div>
              <span className="fw-medium">Independence Day</span>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-success me-3"></span>
                <span className="text-muted">Wednesday 16 August</span>
              </div>
              <span className="fw-medium">Parsi New Year</span>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-warning me-3"></span>
                <span className="text-muted">Tuesday 29 August</span>
              </div>
              <span className="fw-medium">Onam</span>
            </div>
            <div className="list-group-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="badge bg-info me-3"></span>
                <span className="text-muted">Wednesday 16 August</span>
              </div>
              <span className="fw-medium">Raksha Bandhan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeeDashboard = () => {
    const employee = employees[0]; // Default to first employee for demo
    
    return (
      <div className="flex-1">
        {/* Top Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
          <div className="container-fluid">
            <div className="d-flex align-items-center">
              <div className="text-warning fw-bold fs-3 me-4">
                <span className="text-warning">V</span><span className="text-dark">izitor</span>
              </div>
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <a href="#" className="nav-link text-muted">Visitor</a>
                </li>
                <li className="nav-item">
                  <a href="#" className="nav-link text-warning border-bottom border-warning border-2">Attendance</a>
                </li>
              </ul>
            </div>
            <div className="d-flex align-items-center">
              <button
                onClick={() => setUserRole('hr')}
                className="btn btn-light ms-3"
              >
                Switch to HR View
              </button>
            </div>
          </div>
        </nav>

        {/* Location Bar */}
        <div className="bg-white border-bottom py-3">
          <div className="container-fluid">
            <div className="d-flex align-items-center text-muted">
              <i className="fas fa-map-marker-alt me-2"></i>
              <span>Novagems HQ</span>
              <i className="fas fa-chevron-right mx-2 small"></i>
            </div>
          </div>
        </div>

        {/* Welcome Header */}
        <div className="bg-white py-4 border-bottom">
          <div className="container-fluid">
            <h1 className="h3 text-dark">Welcome back John!</h1>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="container-fluid py-4">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="fas fa-users text-warning"></i>
                  </div>
                  <div>
                    <h3 className="card-title mb-0">254</h3>
                    <p className="text-muted small mb-0">Total Employees</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="fas fa-user-minus text-primary"></i>
                  </div>
                  <div>
                    <h3 className="card-title mb-0">10</h3>
                    <p className="text-muted small mb-0">On Leave</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="fas fa-home text-success"></i>
                  </div>
                  <div>
                    <h3 className="card-title mb-0">20</h3>
                    <p className="text-muted small mb-0">Working Remotely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-fluid py-4">
          <div className="row g-4">
            {/* Attendance Overview */}
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="h6 card-title text-dark mb-3">Attendance Overview</h2>
                  <div id="attendancePieChart" style={{ height: '250px' }}></div>
                </div>
              </div>
            </div>

            {/* Add Leave */}
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="h6 card-title text-dark mb-3">Add Leave</h2>
                  <div className="mb-3">
                    <label className="form-label">Write Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Enter reason for leave..."
                    ></textarea>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={leaveDates.start}
                        onChange={(e) => setLeaveDates({ ...leaveDates, start: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">To</label>
                      <input
                        type="date"
                        className="form-control"
                        value={leaveDates.end}
                        onChange={(e) => setLeaveDates({ ...leaveDates, end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select
                      className="form-select"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                    >
                      <option value="Leave">Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Personal Leave">Personal Leave</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (leaveDates.start && leaveDates.end && leaveReason) {
                        const newLeave = {
                          id: leaveRequests.length + 1,
                          startDate: leaveDates.start,
                          endDate: leaveDates.end,
                          reason: leaveReason,
                          status: 'pending'
                        };
                        setLeaveRequests([...leaveRequests, newLeave]);
                        setLeaveReason('');
                        setLeaveDates({ start: '', end: '' });
                      }
                    }}
                    className="btn btn-warning w-100 text-white"
                  >
                    Apply Leave
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="mt-4">
            <div className="card">
              <div className="card-body p-0">
                <div className="row g-0 bg-light py-3 px-4 border-bottom">
                  <div className="col-md-3 fw-medium text-muted">Name</div>
                  <div className="col-md-3 fw-medium text-muted">Checkin/Checkout</div>
                  <div className="col-md-3 fw-medium text-muted">Total Hours</div>
                  <div className="col-md-3 fw-medium text-muted">Status</div>
                </div>
                
                <div className="divide-y">
                  <div className="row g-0 py-3 px-4 align-items-center">
                    <div className="col-md-3 d-flex align-items-center">
                      <img src="https://public.readdy.ai/ai/img_res/45034b607a581b3243593f001b78fa81.jpg" alt="Ritika" className="rounded-circle me-3" width="32" height="32" />
                      <span>Ritika</span>
                    </div>
                    <div className="col-md-3 small text-muted">
                      <div>Jul 13, 2023 - 10:12:19 AM</div>
                      <div>Jul 13, 2023 - 04:11:12 PM</div>
                    </div>
                    <div className="col-md-3">6:58:53</div>
                    <div className="col-md-3"><span className="badge bg-success">Present</span></div>
                  </div>
                  
                  <div className="row g-0 py-3 px-4 align-items-center">
                    <div className="col-md-3 d-flex align-items-center">
                      <img src="https://public.readdy.ai/ai/img_res/5514f29e6c6ebb938811aabd6dde0696.jpg" alt="Prince" className="rounded-circle me-3" width="32" height="32" />
                      <span>Prince</span>
                    </div>
                    <div className="col-md-3 small text-muted">
                      <div>Jul 13, 2023 - 10:18:26 AM</div>
                      <div>Jul 13, 2023 - 06:24:10 PM</div>
                    </div>
                    <div className="col-md-3">8:05:44</div>
                    <div className="col-md-3"><span className="badge bg-success">Present</span></div>
                  </div>
                  
                  <div className="row g-0 py-3 px-4 align-items-center">
                    <div className="col-md-3 d-flex align-items-center">
                      <img src="https://public.readdy.ai/ai/img_res/befc5dc90c58e924fe690b8586eef980.jpg" alt="Roop" className="rounded-circle me-3" width="32" height="32" />
                      <span>Roop</span>
                    </div>
                    <div className="col-md-3 small text-muted">
                      <div>Jul 13, 2023 - 10:09:30 AM</div>
                      <div>Jul 13, 2023 - 07:18:23 PM</div>
                    </div>
                    <div className="col-md-3">9:16:33</div>
                    <div className="col-md-3"><span className="badge bg-success">Present</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Main Content */}
      {userRole === 'hr' ? renderHRDashboard() : renderEmployeeDashboard()}
      
      {/* Bottom Navigation for Employee View */}
      {userRole === 'employee' && (
        <nav className="navbar fixed-bottom navbar-light bg-white border-top">
          <div className="container-fluid">
            <div className="w-100">
              <div className="row text-center">
                <div className="col">
                  <a className="d-flex flex-column align-items-center text-warning">
                    <i className="fas fa-th-large fs-5 mb-1"></i>
                    <span className="small">Dashboard</span>
                  </a>
                </div>
                <div className="col">
                  <a className="d-flex flex-column align-items-center text-muted">
                    <i className="fas fa-user-clock fs-5 mb-1"></i>
                    <span className="small">Attendance</span>
                  </a>
                </div>
                <div className="col">
                  <a className="d-flex flex-column align-items-center text-muted">
                    <i className="fas fa-file-alt fs-5 mb-1"></i>
                    <span className="small">Leave</span>
                  </a>
                </div>
                <div className="col">
                  <a className="d-flex flex-column align-items-center text-muted">
                    <i className="fas fa-calendar fs-5 mb-1"></i>
                    <span className="small">Holiday</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      {/* Calendar Modal */}
      {showCalendar && renderCalendar()}
    </div>
  );
};

export default HRattendance;