const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createChargeHandover,
  getAllChargeHandovers,
  getChargeHandoverById,
  updateChargeHandoverStatus,
  deleteChargeHandover,
  getEmployeeHandovers,
} = require("../controllers/chargeHandoverController");

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Create a new charge handover
// POST /api/charge-handovers
router.post("/", createChargeHandover);

// Get all charge handovers (HR Managers only)
// GET /api/charge-handovers
router.get("/", getAllChargeHandovers);

// Get a specific charge handover by ID
// GET /api/charge-handovers/:id
router.get("/:id", getChargeHandoverById);

// Update charge handover status
// PUT /api/charge-handovers/:id/status
router.put("/:id/status", updateChargeHandoverStatus);

// Delete a charge handover
// DELETE /api/charge-handovers/:id
router.delete("/:id", deleteChargeHandover);

// Get handovers for a specific employee
// GET /api/charge-handovers/employee/:employeeId
router.get("/employee/:employeeId", getEmployeeHandovers);

module.exports = router;
