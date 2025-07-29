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
router.post('/applys', applyLeaves);

// Get all leave applications (Super Admin)
router.get('/alls', getAllHrLeaveApplications);

// Get leave applications by user
router.get('/users/:usersId', getUserHrLeaveApplications);

// Get leave applications by user email
router.get('/users-by-email/:usersEmail', getUserHrLeaveApplicationsByEmail);

// Update leave status (Super Admin only)
router.patch('/statu/:leavesId', updateHrLeaveStatus);

// Get leave statistics
router.get('/statistic', getHrLeaveStatistics);

// Delete leave application
router.delete('/:leavesId', deleteHrLeaveApplication);

module.exports = router;
