const express = require("express");
const router = express.Router();
const {
  createCompletion,
  getAllCompletions,
  getCompletionById,
  getCompletionByCertId,
  updateCompletion,
  deleteCompletion,
  getUserCompletions,
  downloadCompletionImage,
  getCompletionStats,
} = require("../controllers/completionController");
const { protect } = require("../middlewares/auth");

// @route   POST /api/completions
// @desc    Create a new completion certificate
// @access  Private
router.post("/", protect, createCompletion);

// @route   GET /api/completions
// @desc    Get all completion certificates
// @access  Private
router.get("/", protect, getAllCompletions);

// @route   GET /api/completions/user
// @desc    Get completion certificates for current user
// @access  Private
router.get("/user", protect, getUserCompletions);

// @route   GET /api/completions/stats
// @desc    Get completion certificate statistics
// @access  Private
router.get("/stats", protect, getCompletionStats);

// @route   GET /api/completions/cert/:certId
// @desc    Get completion certificate by certificate ID
// @access  Private
router.get("/cert/:certId", protect, getCompletionByCertId);

// @route   GET /api/completions/:id
// @desc    Get completion certificate by ID
// @access  Private
router.get("/:id", protect, getCompletionById);

// @route   PUT /api/completions/:id
// @desc    Update completion certificate
// @access  Private
router.put("/:id", protect, updateCompletion);

// @route   DELETE /api/completions/:id
// @desc    Delete completion certificate
// @access  Private
router.delete("/:id", protect, deleteCompletion);

// @route   GET /api/completions/:id/download
// @desc    Download completion certificate image
// @access  Private
router.get("/:id/download", protect, downloadCompletionImage);

module.exports = router;
