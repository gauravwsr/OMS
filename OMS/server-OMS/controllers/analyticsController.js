const User = require("../models/userModel.js");
const Leave = require("../models/leaveModel.js");

// Get Leave Analytics Data
const getLeaveAnalytics = async (req, res) => {
  try {
    console.log('getLeaveAnalytics - Request received');
    console.log('User from auth middleware:', req.user ? req.user.name : 'No user');
    console.log('Query parameters:', req.query);
    
    const { startDate, endDate, employeeId } = req.query;
    
    // Build query based on filters
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (employeeId && employeeId !== 'all') {
      query.employeeId = employeeId;
    }

    console.log('MongoDB query:', query);

    // Get leave data with employee details
    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .sort({ createdAt: -1 });

    console.log('Leaves found:', leaves.length);

    // Format the response
    const formattedLeaves = leaves.map(leave => ({
      _id: leave._id,
      employeeName: leave.employeeId?.name || leave.employeeName || 'Unknown',
      employeeEmail: leave.employeeId?.email || leave.employeeEmail || 'Unknown',
      department: leave.employeeId?.department || 'General',
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      reason: leave.reason,
      status: leave.status,
      createdAt: leave.createdAt,
      approvedBy: leave.approvedBy
    }));

    res.json(formattedLeaves);
  } catch (error) {
    console.error("Error fetching leave analytics:", error);
    res.status(500).json({ 
      message: "Error fetching leave analytics", 
      error: error.message 
    });
  }
};

// Get Attendance Analytics Data (Mock data for now)
const getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    // Get all employees
    let employeeQuery = { role: 'Employee' };
    if (employeeId && employeeId !== 'all') {
      employeeQuery._id = employeeId;
    }
    
    const employees = await User.find(employeeQuery);
    
    // Generate mock attendance data
    const attendanceData = employees.map(emp => {
      const workingDays = 22; // Standard working days per month
      const presentDays = Math.floor(Math.random() * 22) + 15; // Random between 15-22
      const absentDays = workingDays - presentDays;
      const attendancePercentage = Math.round((presentDays / workingDays) * 100);
      
      return {
        employeeId: emp._id,
        employeeName: emp.name,
        email: emp.email,
        department: emp.department || 'General',
        totalDays: workingDays,
        presentDays: presentDays,
        absentDays: absentDays,
        attendancePercentage: attendancePercentage,
        lastUpdated: new Date()
      };
    });

    res.json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance analytics:", error);
    res.status(500).json({ 
      message: "Error fetching attendance analytics", 
      error: error.message 
    });
  }
};

// Get Check-In/Check-Out Analytics Data (Mock data for now)
const getCheckInOutAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    // Get all employees
    let employeeQuery = { role: 'Employee' };
    if (employeeId && employeeId !== 'all') {
      employeeQuery._id = employeeId;
    }
    
    const employees = await User.find(employeeQuery);
    
    // Generate mock check-in/out data for the last 10 days
    const checkInOutData = [];
    const daysToGenerate = 10;
    
    employees.forEach(emp => {
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const checkInHour = Math.floor(Math.random() * 3) + 8; // 8-10 AM
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkOutHour = Math.floor(Math.random() * 3) + 17; // 5-7 PM
        const checkOutMinute = Math.floor(Math.random() * 60);
        
        const workingHours = (checkOutHour - checkInHour) + ((checkOutMinute - checkInMinute) / 60);
        const isPresent = Math.random() > 0.1; // 90% attendance
        
        if (isPresent) {
          checkInOutData.push({
            employeeId: emp._id,
            employeeName: emp.name,
            email: emp.email,
            department: emp.department || 'General',
            date: date.toISOString().split('T')[0],
            checkIn: `${checkInHour}:${checkInMinute.toString().padStart(2, '0')} ${checkInHour < 12 ? 'AM' : 'PM'}`,
            checkOut: `${checkOutHour > 12 ? checkOutHour - 12 : checkOutHour}:${checkOutMinute.toString().padStart(2, '0')} ${checkOutHour < 12 ? 'AM' : 'PM'}`,
            totalHours: workingHours.toFixed(1),
            status: 'Present',
            punctuality: checkInHour <= 9 ? 'On Time' : 'Late'
          });
        }
      }
    });

    // Sort by date (most recent first)
    checkInOutData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(checkInOutData);
  } catch (error) {
    console.error("Error fetching check-in/out analytics:", error);
    res.status(500).json({ 
      message: "Error fetching check-in/out analytics", 
      error: error.message 
    });
  }
};

// Export Analytics Data
const exportAnalyticsData = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, employeeId } = req.query;
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'leave':
        // Get leave data
        let leaveQuery = {};
        if (startDate && endDate) {
          leaveQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        if (employeeId && employeeId !== 'all') {
          leaveQuery.employeeId = employeeId;
        }
        
        const leaves = await Leave.find(leaveQuery)
          .populate('employeeId', 'name email department');
        
        data = leaves.map(leave => ({
          'Employee Name': leave.employeeId?.name || leave.employeeName || 'Unknown',
          'Employee Email': leave.employeeId?.email || leave.employeeEmail || 'Unknown',
          'Department': leave.employeeId?.department || 'General',
          'Leave Type': leave.leaveType,
          'Start Date': new Date(leave.startDate).toLocaleDateString(),
          'End Date': new Date(leave.endDate).toLocaleDateString(),
          'Total Days': leave.totalDays,
          'Reason': leave.reason,
          'Status': leave.status,
          'Applied Date': new Date(leave.createdAt).toLocaleDateString(),
          'Approved By': leave.approvedBy || 'Pending'
        }));
        filename = `Leave_Analytics_${new Date().toISOString().split('T')[0]}.json`;
        break;
        
      case 'attendance':
        // Mock attendance data for export
        const employees = await User.find({ role: 'Employee' });
        data = employees.map(emp => ({
          'Employee Name': emp.name,
          'Email': emp.email,
          'Department': emp.department || 'General',
          'Total Days': 22,
          'Present Days': Math.floor(Math.random() * 22) + 15,
          'Attendance Percentage': Math.floor(Math.random() * 30) + 70 + '%'
        }));
        filename = `Attendance_Analytics_${new Date().toISOString().split('T')[0]}.json`;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json(data);
    
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    res.status(500).json({ 
      message: "Error exporting analytics data", 
      error: error.message 
    });
  }
};

module.exports = {
  getLeaveAnalytics,
  getAttendanceAnalytics,
  getCheckInOutAnalytics,
  exportAnalyticsData
};
