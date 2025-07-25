const express = require('express');
const router = express.Router();
const {
  getAllClientProjects,
  getProjectsForTeamLead,
  getClientProject,
  createClientProject,
  assignTeamLead,
  updateClientProject,
  deleteClientProject,
  addProjectNote,
  getTeamLeads
} = require('../controllers/clientProjectController');

// Import authentication and authorization middleware
const { protect, authorize } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/client-projects
// @desc    Get all client projects
// @access  Private
router.get('/', getAllClientProjects);

// @route   GET /api/team-leads
// @desc    Get all team leads
// @access  Private
router.get('/team-leads', getTeamLeads);

// @route   GET /api/client-projects/team-lead/:identifier
// @desc    Get projects for specific team lead
// @access  Private
router.get('/team-lead/:identifier', getProjectsForTeamLead);

// @route   GET /api/client-projects/:id
// @desc    Get single client project
// @access  Private
router.get('/:id', getClientProject);

// @route   POST /api/client-projects
// @desc    Create new client project
// @access  Private (Project Manager only)
router.post('/', authorize('Project Manager'), createClientProject);

// @route   PUT /api/client-projects/:id/assign-team-lead
// @desc    Assign team lead to project
// @access  Private (Project Manager only)
router.put('/:id/assign-team-lead', authorize('Project Manager'), assignTeamLead);

// @route   PUT /api/client-projects/:id
// @desc    Update client project
// @access  Private
router.put('/:id', updateClientProject);

// @route   DELETE /api/client-projects/:id
// @desc    Delete client project
// @access  Private (Project Manager only)
router.delete('/:id', authorize('Project Manager'), deleteClientProject);

// @route   POST /api/client-projects/:id/notes
// @desc    Add note to project
// @access  Private
router.post('/:id/notes', addProjectNote);

module.exports = router;
