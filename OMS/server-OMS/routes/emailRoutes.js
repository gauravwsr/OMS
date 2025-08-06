const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
  configureUserEmailCredentials,
  getUserEmailConfig,
  removeUserEmailCredentials,
  getEmailSuggestions,
  sendEmail,
  fetchEmails,
  getEmailContent,
  saveDraft,
  updateDraft,
  getDrafts,
  deleteDraft,
  getSentEmails,
  getReceivedEmails,
  testEmailService
} = require('../controllers/emailController');

// Email configuration routes
router.post('/configure', authenticate, configureUserEmailCredentials);
router.get('/config', authenticate, getUserEmailConfig);
router.delete('/config', authenticate, removeUserEmailCredentials);
router.get('/suggestions', authenticate, getEmailSuggestions);

// Email operation routes
router.post('/send', authenticate, sendEmail);
router.post('/fetch', authenticate, fetchEmails);
router.post('/content/:uid', authenticate, getEmailContent);

// Draft management routes
router.post('/drafts', authenticate, saveDraft);
router.put('/drafts/:id', authenticate, updateDraft);
router.get('/drafts', authenticate, getDrafts);
router.delete('/drafts/:id', authenticate, deleteDraft);

// Email history routes
router.get('/sent', authenticate, getSentEmails);
router.get('/received', authenticate, getReceivedEmails);

// Test route
router.get('/test', testEmailService);

module.exports = router;