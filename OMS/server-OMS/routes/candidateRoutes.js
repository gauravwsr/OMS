// routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

// Handle file uploads for candidate registration
const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "cv", maxCount: 1 },
  // Common documents
  { name: "document_resume", maxCount: 1 },
  { name: "document_governmentId", maxCount: 1 },
  { name: "document_panCard", maxCount: 1 },
  { name: "document_passportPhoto", maxCount: 1 },
  { name: "document_signedOfferLetter", maxCount: 1 },
  { name: "document_nda", maxCount: 1 },
  // Employee specific documents
  { name: "document_addressProof", maxCount: 1 },
  { name: "document_educationalCertificates", maxCount: 1 },
  { name: "document_experienceCertificates", maxCount: 1 },
  { name: "document_salarySlips", maxCount: 1 },
  { name: "document_bankDetails", maxCount: 1 },
  { name: "document_joiningForm", maxCount: 1 },
  { name: "document_medicalCertificate", maxCount: 1 },
  // Intern specific documents
  { name: "document_collegeId", maxCount: 1 },
  { name: "document_bonafideCertificate", maxCount: 1 },
  { name: "document_letterOfRecommendation", maxCount: 1 },
  { name: "document_transcripts", maxCount: 1 },
  { name: "document_portfolioSamples", maxCount: 1 },
]);

// Middleware to handle optional file uploads
const optionalUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    // Continue even if no files are uploaded
    if (err && err.code !== "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "File upload error: " + err.message,
      });
    }
    next();
  });
};

// Routes
router.post("/", uploadFields, candidateController.createCandidate);
router.get(
  "/",
  authMiddleware.authenticate,
  candidateController.getAllCandidates
);
router.get(
  "/:id",
  authMiddleware.authenticate,
  candidateController.getCandidateById
);
router.put(
  "/:id",
  authMiddleware.authenticate,
  uploadFields,
  candidateController.updateCandidate
);
router.delete(
  "/:id",
  authMiddleware.authenticate,
  candidateController.deleteCandidate
);
router.post("/login", candidateController.loginCandidate);

// Face Recognition and Attendance routes
router.post("/attendance/mark", candidateController.markAttendance);
router.get(
  "/:id/attendance/history",
  authMiddleware.authenticate,
  candidateController.getAttendanceHistory
);
router.put("/:id/face-encodings", candidateController.updateFaceEncodings);
router.get(
  "/attendance/all",
  authMiddleware.authenticate,
  candidateController.getAllAttendanceRecords
);

module.exports = router;
