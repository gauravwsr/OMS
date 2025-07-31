// routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const upload = require("../middlewares/uploadMiddleware");

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
router.post("/", optionalUpload, candidateController.createCandidate);
router.get("/", candidateController.getAllCandidates);
router.get("/:id", candidateController.getCandidateById);
router.put("/:id", optionalUpload, candidateController.updateCandidate);
router.delete("/:id", candidateController.deleteCandidate);
router.post("/login", candidateController.loginCandidate);

module.exports = router;
