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

// Update leave status (Super Admin only)
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

    // Check if reviewer is Super Admin
    let reviewer;
    if (mongoose.Types.ObjectId.isValid(reviewedBy)) {
      reviewer = await User.findById(reviewedBy);
    } else {
      reviewer = await User.findOne({ email: reviewedBy });
    }
    
    if (!reviewer || reviewer.role !== 'Super_Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can approve/reject leave applications'
      });
    }

    const leaveApplication = await Leave.findByIdAndUpdate(
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

    if (!leaveApplication) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      data: leaveApplication
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

module.exports = {
  applyLeave,
  getAllLeaveApplications,
  getUserLeaveApplications,
  getUserLeaveApplicationsByEmail,
  updateLeaveStatus,
  getLeaveStatistics,
  deleteLeaveApplication
};
