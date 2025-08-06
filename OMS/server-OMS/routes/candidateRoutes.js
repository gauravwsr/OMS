// routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

// Handle both file uploads (photo and cv) in one request
const uploadFields = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "cv", maxCount: 1 },
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
router.put(
  "/:id/face-encodings",
  authMiddleware.authenticate,
  candidateController.updateFaceEncodings
);
router.get(
  "/attendance/all",
  authMiddleware.authenticate,
  candidateController.getAllAttendanceRecords
);

module.exports = router;
