// routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const upload = require('../middlewares/uploadMiddleware');

// Handle both file uploads (photo and cv) in one request
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);

// Routes
router.post('/', uploadFields, candidateController.createCandidate);
router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidateById);
router.put('/:id', uploadFields, candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);
router.post('/login', candidateController.loginCandidate);

module.exports = router;