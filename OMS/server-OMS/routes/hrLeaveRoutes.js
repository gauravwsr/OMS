const express = require('express');
const router = express.Router();
const {
  applyLeaves,
  getAllHrLeaveApplications,
  getUserHrLeaveApplications,
  getUserHrLeaveApplicationsByEmail,
  updateHrLeaveStatus,
  getHrLeaveStatistics,
  deleteHrLeaveApplication
} = require('../controllers/LeaveController-1');

// Apply for leave
router.post('/apply', applyLeaves);

// Get all leave applications (Super Admin)
router.get('/all', getAllHrLeaveApplications);

// Get leave applications by user
router.get('/user/:userId', getUserHrLeaveApplications);

// Get leave applications by user email
router.get('/user-by-email/:userEmail', getUserHrLeaveApplicationsByEmail);

// Update leave status (Super Admin only)
router.patch('/status/:leaveId', updateHrLeaveStatus);

// Get leave statistics
router.get('/statistics', getHrLeaveStatistics);

// Delete leave application
router.delete('/:leaveId', deleteHrLeaveApplication);

module.exports = router;
