const express = require("express");
const router = express.Router();
const {
  getAllClientProjects,
  getProjectsForTeamLead,
  getProjectsForEmployee,
  getClientProject,
  createClientProject,
  assignTeamLead,
  updateClientProject,
  deleteClientProject,
  addProjectNote,
  getTeamLeads,
  importRemoteProjects,
  forceSyncWithCrm,
  getCrmSyncStatus,
} = require("../controllers/clientProjectController");

// Import authentication and authorization middleware
const { protect, authorize } = require("../middlewares/auth");
const clientProjectController = require("../controllers/clientProjectController");

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/client-projects
// @desc    Get all client projects
// @access  Private
router.get("/", getAllClientProjects);

// @route   POST /api/client-projects/import-remote
// @desc    Import remote projects from external API
// @access  Private
router.post(
  "/import-remote",
  protect,
  clientProjectController.importRemoteProjects
);

// @route   GET /api/team-leads
// @desc    Get all team leads
// @access  Private
router.get("/team-leads", getTeamLeads);

// @route   GET /api/client-projects/team-lead/:identifier
// @desc    Get projects for specific team lead
// @access  Private
router.get("/team-lead/:identifier", getProjectsForTeamLead);

// @route   GET /api/client-projects/employee/:identifier
// @desc    Get projects for specific employee
// @access  Private (Employee)
router.get("/employee/:identifier", getProjectsForEmployee);

// @route   GET /api/client-projects/:id
// @desc    Get single client project
// @access  Private
router.get("/:id", getClientProject);

// @route   POST /api/client-projects
// @desc    Create new client project
// @access  Private (Project Manager only)
router.post("/", authorize("Project Manager"), createClientProject);

// @route   PUT /api/client-projects/:id/assign-team-lead
// @desc    Assign team lead to project
// @access  Private (Project Manager only)
// router.put('/:id/assign-team-lead', authorize('Project Manager'), assignTeamLead);
router.put(
  "/:id/assign-team-lead",
  protect,
  authorize("Project Manager"),
  clientProjectController.assignTeamLeadToProject
);

// @route   PUT /api/client-projects/:id
// @desc    Update client project
// @access  Private
router.put("/:id", updateClientProject);

// @route   DELETE /api/client-projects/:id
// @desc    Delete client project
// @access  Private (Project Manager only)
router.delete("/:id", authorize("Project Manager"), deleteClientProject);

// @route   POST /api/client-projects/:id/notes
// @desc    Add note to project
// @access  Private
router.post("/:id/notes", addProjectNote);

router.get(
  "/employees/sub-role/:subRole",
  clientProjectController.getEmployeesBySubRole
);

// @route   GET /api/client-projects/employees
// @desc    Get all employees
// @access  Private
router.get("/employees", clientProjectController.getAllEmployees);
router.put(
  "/:id/assign-employees",
  clientProjectController.assignEmployeesToProject
);

// @route   PUT /api/client-projects/:id/progress
// @desc    Update project progress
// @access  Private (Team Lead)
router.put("/:id/progress", clientProjectController.updateProjectProgress);

// @route   PUT /api/client-projects/:id/sync-crm
// @desc    Force sync working project with latest CRM data
// @access  Private (Project Manager only)
router.put("/:id/sync-crm", authorize("Project Manager"), forceSyncWithCrm);

// @route   GET /api/client-projects/sync-status
// @desc    Get CRM sync status for all projects
// @access  Private
router.get("/sync-status", getCrmSyncStatus);

module.exports = router;
