const express = require("express");
const router = express.Router();
const {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  getCertificateByCertId,
  updateCertificate,
  deleteCertificate,
  getCertificateImage,
} = require("../controllers/certificateController");
const { protect } = require("../middlewares/auth");

// @route   POST /api/certificates
// @desc    Create a new certificate
// @access  Private
router.post("/", protect, createCertificate);

// @route   GET /api/certificates
// @desc    Get all certificates
// @access  Private
router.get("/", protect, getAllCertificates);

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Private
router.get("/:id", protect, getCertificateById);

// @route   GET /api/certificates/cert/:certId
// @desc    Get certificate by Certificate ID
// @access  Private
router.get("/cert/:certId", protect, getCertificateByCertId);

// @route   PUT /api/certificates/:id
// @desc    Update certificate
// @access  Private
router.put("/:id", protect, updateCertificate);

// @route   DELETE /api/certificates/:id
// @desc    Delete certificate
// @access  Private
router.delete("/:id", protect, deleteCertificate);

// @route   GET /api/certificates/:id/image
// @desc    Get certificate image
// @access  Private
router.get("/:id/image", protect, getCertificateImage);

module.exports = router;
