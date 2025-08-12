const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middlewares/authMiddleware');

// Email configuration routes
router.post('/configure', authenticate, emailController.configureUserEmailCredentials);
router.get('/config', authenticate, emailController.getUserEmailConfig);
router.delete('/config', authenticate, emailController.removeUserEmailCredentials);
router.get('/suggestions', authenticate, emailController.getEmailSuggestions);

// Email operations
router.post('/send', authenticate, emailController.sendEmail);
router.post('/fetch', authenticate, emailController.fetchEmails);
router.get('/content/:uid', authenticate, emailController.getEmailContent);

// Draft operations
router.post('/drafts', authenticate, emailController.saveDraft);
router.put('/drafts/:id', authenticate, emailController.updateDraft);
router.get('/drafts', authenticate, emailController.getDrafts);
router.delete('/drafts/:id', authenticate, emailController.deleteDraft);

// Email history
router.get('/sent', authenticate, emailController.getSentEmails);
router.get('/received', authenticate, emailController.getReceivedEmails);

// Test endpoint
router.get('/test', authenticate, emailController.testEmailService);

module.exports = router;
