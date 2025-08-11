const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getAllLeaveApplications,
  getAdminLeaveApplications,
  getEmployeeLeaveApplications,
  getUserLeaveApplications,
  getUserLeaveApplicationsByEmail,
  updateLeaveStatus,
  getLeaveStatistics,
  deleteLeaveApplication
} = require('../controllers/leaveController');

// Apply for leave
router.post('/apply', applyLeave);

// Get recent leave applications for dashboard
router.get('/recent', require('../controllers/leaveController').getRecentLeaveApplications);

// Get all leave applications (Super Admin)
router.get('/all', getAllLeaveApplications);

// Get admin and HR leave applications (Super Admin)
router.get('/admin-hr', getAdminLeaveApplications);

// Get employee leave applications (HR Manager)
router.get('/employees', getEmployeeLeaveApplications);

// Get leave applications by user
router.get('/user/:userId', getUserLeaveApplications);

// Get leave applications by user email
router.get('/user-by-email/:userEmail', getUserLeaveApplicationsByEmail);

// Update leave status (Super Admin for Admin/HR/Manager leaves, Admin/HR/Manager for Employee leaves)
router.patch('/status/:leaveId', updateLeaveStatus);

// Get leave statistics
router.get('/statistics', getLeaveStatistics);

// Delete leave application
router.delete('/:leaveId', deleteLeaveApplication);

module.exports = router;
