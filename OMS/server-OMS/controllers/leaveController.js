// Get recent leave applications (for dashboard activity)
const getRecentLeaveApplications = async (req, res) => {
  try {
    // Get the 10 most recent leave applications for Employee or Intern
    const leaves = await Leave.find({
      status: 'Pending',
      $or: [
        { employeeRole: /Employee/i },
        { employeeRole: /Intern/i }
      ]
    })
      .sort({ appliedDate: -1 })
      .limit(10);

    // Format for dashboard
    const data = leaves.map(l => ({
      name: l.employeeName,
      role: l.employeeRole,
      appliedAt: l.appliedDate
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent leave applications' });
  }
};
const Leave = require('../models/leaveModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { userId, userEmail, leaveReason, leaveDates, leaveType, customLeaveType } = req.body;

    // Validate required fields
    if ((!userId && !userEmail) || !leaveReason || !leaveDates || !leaveType) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate dates
    const startDate = new Date(leaveDates.start);
    const endDate = new Date(leaveDates.end);
    const today = new Date();

    // Set time to beginning of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date'
      });
    }

    // Get user details
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate total days correctly
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Create leave application
    const leaveApplication = new Leave({
      userId: user._id,
      employeeName: user.name,
      employeeEmail: user.email,
      employeeRole: user.role + (user.subRole ? ` - ${user.subRole}` : ''),
      leaveReason,
      leaveDates: {
        start: startDate,
        end: endDate
      },
      totalDays,
      leaveType,
      customLeaveType: leaveType === 'Other' ? customLeaveType : undefined
    });

    await leaveApplication.save();

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leaveApplication
    });

  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave application',
      error: error.message
    });
  }
};

// Get all leave applications (for Super Admin)
const getAllLeaveApplications = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;
    let filter = {};

    // Apply filters
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      filter.appliedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaveApplications = await Leave.find(filter)
      .populate('userId', 'name email role subRole')
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      data: leaveApplications,
      count: leaveApplications.length
    });

  } catch (error) {
    console.error('Error fetching leave applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave applications',
      error: error.message
    });
  }
};

// Get leave applications by user
const getUserLeaveApplications = async (req, res) => {
  try {
    const { userId } = req.params;

    const leaveApplications = await Leave.find({ userId })
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      data: leaveApplications,
      count: leaveApplications.length
    });

  } catch (error) {
    console.error('Error fetching user leave applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave applications',
      error: error.message
    });
  }
};

// Get leave applications by user email
const getUserLeaveApplicationsByEmail = async (req, res) => {
  try {
    const { userEmail } = req.params;

    // First find the user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const leaveApplications = await Leave.find({ userId: user._id })
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      data: leaveApplications,
      count: leaveApplications.length
    });

  } catch (error) {
    console.error('Error fetching user leave applications by email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave applications',
      error: error.message
    });
  }
};

// Update leave status (Super Admin for Admin/HR/Manager leaves, Admin/HR/Manager for Employee leaves)
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, reviewComments, reviewedBy } = req.body;

    // Validate status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved or Rejected'
      });
    }

    // Check if reviewer has permission to approve/reject
    let reviewer;
    if (mongoose.Types.ObjectId.isValid(reviewedBy)) {
      reviewer = await User.findById(reviewedBy);
    } else {
      reviewer = await User.findOne({ email: reviewedBy });
    }
    
    if (!reviewer) {
      return res.status(404).json({
        success: false,
        message: 'Reviewer not found'
      });
    }

    // Get the leave application to check employee role
    const leaveApplication = await Leave.findById(leaveId).populate('userId', 'role');
    
    if (!leaveApplication) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    const employeeRole = leaveApplication.userId?.role?.toLowerCase() || '';
    const reviewerRole = reviewer.role;

    console.log('Leave approval permission check:', {
      leaveId,
      employeeRole,
      reviewerRole,
      employeeName: leaveApplication.userId?.name,
      reviewerName: reviewer.name
    });

    // Permission logic:
    // - Super Admin can approve/reject Admin, HR, Manager leaves only
    // - Admin/HR/Manager can approve/reject Employee leaves only
    
    let hasPermission = false;
    
    if (reviewerRole === 'Super_Admin') {
      // Super Admin can only approve Admin, HR, Manager leaves
      if (employeeRole.includes('admin') || employeeRole.includes('hr') || employeeRole.includes('manager') || 
          employeeRole === 'Admin' || employeeRole === 'HR' || employeeRole === 'Manager') {
        hasPermission = true;
      }
    } else if ((reviewerRole === 'Admin' || reviewerRole.includes('HR') || reviewerRole.includes('Manager'))) {
      // Admin/HR/Manager can only approve Employee leaves
      if (employeeRole === 'employee' || employeeRole === 'Employee' || 
          (!employeeRole.includes('admin') && !employeeRole.includes('hr') && !employeeRole.includes('manager') && !employeeRole.includes('super'))) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      let permissionMessage = '';
      if (reviewerRole === 'Super_Admin') {
        permissionMessage = 'Super Admin can only approve Admin, HR, or Manager leave applications';
      } else {
        permissionMessage = 'Admin/HR/Manager can only approve Employee leave applications';
      }
      
      return res.status(403).json({
        success: false,
        message: `${permissionMessage}. Current: ${reviewerRole} trying to approve ${employeeRole} leave`
      });
    }

    const updatedLeaveApplication = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status,
        reviewComments: reviewComments || '',
        reviewedBy: reviewer._id,
        reviewedDate: new Date()
      },
      { new: true }
    ).populate('userId', 'name email role subRole')
     .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      data: updatedLeaveApplication
    });

  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status',
      error: error.message
    });
  }
};

// Get leave statistics
const getLeaveStatistics = async (req, res) => {
  try {
    const { userId, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    let matchFilter = {
      appliedDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    };

    if (userId) {
      matchFilter.userId = new mongoose.Types.ObjectId(userId);
    }

    const statistics = await Leave.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    const leaveTypeStats = await Leave.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusWise: statistics,
        leaveTypeWise: leaveTypeStats,
        year: currentYear
      }
    });

  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message
    });
  }
};

// Delete leave application (user can delete their own pending applications)
const deleteLeaveApplication = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { userId } = req.body;

    const leaveApplication = await Leave.findById(leaveId);
    
    if (!leaveApplication) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check if user owns the application and it's still pending
    if (leaveApplication.userId.toString() !== userId || leaveApplication.status !== 'Pending') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own pending leave applications'
      });
    }

    await Leave.findByIdAndDelete(leaveId);

    res.status(200).json({
      success: true,
      message: 'Leave application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting leave application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave application',
      error: error.message
    });
  }
};

// Get admin and HR leave applications (for Super Admin)
const getAdminLeaveApplications = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;
    let filter = {};

    // Apply filters
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      filter.appliedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaveApplications = await Leave.find(filter)
      .populate('userId', 'name email role subRole')
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });

    // Filter only Admin and HR roles
    const adminHRLeaves = leaveApplications.filter(leave => {
      const userRole = leave.userId?.role?.toLowerCase() || '';
      return userRole.includes('admin') || userRole.includes('hr') || userRole.includes('manager');
    });

    // Format the response
    const formattedApplications = adminHRLeaves.map(leave => ({
      _id: leave._id,
      employeeName: leave.userId?.name || 'Unknown',
      employeeEmail: leave.userId?.email || 'Unknown',
      employeeRole: leave.userId?.role || 'Unknown',
      leaveType: leave.leaveType,
      customLeaveType: leave.customLeaveType,
      leaveReason: leave.leaveReason,
      leaveDates: leave.leaveDates,
      totalDays: leave.totalDays,
      status: leave.status,
      appliedDate: leave.appliedDate,
      reviewedDate: leave.reviewedDate,
      reviewComments: leave.reviewComments,
      reviewedBy: leave.reviewedBy
    }));

    res.status(200).json({
      success: true,
      message: 'Admin/HR leave applications retrieved successfully',
      data: formattedApplications,
      count: formattedApplications.length
    });

  } catch (error) {
    console.error('Error fetching admin leave applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin/HR leave applications',
      error: error.message
    });
  }
};

// Get employee leave applications (for HR Manager)
const getEmployeeLeaveApplications = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;
    let filter = {};

    // Apply filters
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      filter.appliedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaveApplications = await Leave.find(filter)
      .populate('userId', 'name email role subRole')
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });

    // Filter only Employee roles (exclude Admin, HR, Manager)
    const employeeLeaves = leaveApplications.filter(leave => {
      const userRole = leave.userId?.role?.toLowerCase() || '';
      return userRole === 'employee' || 
             (!userRole.includes('admin') && 
              !userRole.includes('hr') && 
              !userRole.includes('manager'));
    });

    // Format the response
    const formattedApplications = employeeLeaves.map(leave => ({
      _id: leave._id,
      employeeName: leave.userId?.name || 'Unknown',
      employeeEmail: leave.userId?.email || 'Unknown',
      employeeRole: leave.userId?.role || 'Employee',
      leaveType: leave.leaveType,
      customLeaveType: leave.customLeaveType,
      leaveReason: leave.leaveReason,
      leaveDates: leave.leaveDates,
      totalDays: leave.totalDays,
      status: leave.status,
      appliedDate: leave.appliedDate,
      reviewedDate: leave.reviewedDate,
      reviewComments: leave.reviewComments,
      reviewedBy: leave.reviewedBy
    }));

    res.status(200).json({
      success: true,
      message: 'Employee leave applications retrieved successfully',
      data: formattedApplications,
      count: formattedApplications.length
    });

  } catch (error) {
    console.error('Error fetching employee leave applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee leave applications',
      error: error.message
    });
  }
};

module.exports = {
  applyLeave,
  getAllLeaveApplications,
  getAdminLeaveApplications,
  getEmployeeLeaveApplications,
  getUserLeaveApplications,
  getUserLeaveApplicationsByEmail,
  updateLeaveStatus,
  getLeaveStatistics,
  deleteLeaveApplication
  ,getRecentLeaveApplications
};
