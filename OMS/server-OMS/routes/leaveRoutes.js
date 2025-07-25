const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getAllLeaveApplications,
  getUserLeaveApplications,
  getUserLeaveApplicationsByEmail,
  updateLeaveStatus,
  getLeaveStatistics,
  deleteLeaveApplication
} = require('../controllers/leaveController');

// Apply for leave
router.post('/apply', applyLeave);

// Get all leave applications (Super Admin)
router.get('/all', getAllLeaveApplications);

// Get leave applications by user
router.get('/user/:userId', getUserLeaveApplications);

// Get leave applications by user email
router.get('/user-by-email/:userEmail', getUserLeaveApplicationsByEmail);

// Update leave status (Super Admin only)
router.patch('/status/:leaveId', updateLeaveStatus);

// Get leave statistics
router.get('/statistics', getLeaveStatistics);

// Delete leave application
router.delete('/:leaveId', deleteLeaveApplication);

module.exports = router;
