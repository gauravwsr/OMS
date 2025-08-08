const HostingerEmailService = require('../config/emailConfig');
const EmailConfig = require('../models/emailModel').EmailConfig;
const Email = require('../models/emailModel').Email;
const DraftEmail = require('../models/emailModel').DraftEmail;
const EmailCredentialService = require('../services/emailCredentialService');
const bcrypt = require('bcryptjs');
const multer = require('multer');

console.log('📧 Email Controller loaded');
console.log('🔧 EmailCredentialService type:', typeof EmailCredentialService);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
    }
  }
}).array('attachments', 10); // Allow up to 10 files

// Configure user email credentials
const configureUserEmailCredentials = async (req, res) => {
  try {
    const { smtpEmail, smtpPassword, email, password, testOnly } = req.body;
    const userId = req.user.id || req.user._id;

    // Support both parameter formats
    const emailAddress = smtpEmail || email;
    const emailPassword = smtpPassword || password;

    console.log('Request body:', req.body);
    console.log('User authenticated:', {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      userType: req.user.userType
    });

    if (!emailAddress || !emailPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Test credentials first
    console.log('🔧 Testing email credentials...');
    
    let testResult;
    try {
      testResult = await EmailCredentialService.testEmailCredentials(emailAddress, emailPassword);
      console.log('📊 Test result:', testResult);
    } catch (testError) {
      console.error('❌ Test credentials error:', testError);
      return res.status(500).json({
        success: false,
        message: `Error testing credentials: ${testError.message}`
      });
    }
    
    if (!testResult.success) {
      console.log('❌ Test failed:', testResult.message);
      return res.status(400).json({
        success: false,
        message: testResult.message
      });
    }

    // If testOnly is true, just return test result without saving
    if (testOnly) {
      return res.json({
        success: true,
        message: 'Email credentials verified successfully',
        testOnly: true
      });
    }

    // Save credentials
    const result = await EmailCredentialService.saveEmailCredentials(userId, emailAddress, emailPassword);
    
    res.json(result);
  } catch (error) {
    console.error('Error configuring email credentials:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user email configuration status
const getUserEmailConfig = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    res.json({
      configured: credentials.configured,
      smtpEmail: credentials.smtpEmail || null,
      lastSync: credentials.lastSync || null
    });
  } catch (error) {
    console.error('Error getting email config:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove user email credentials
const removeUserEmailCredentials = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await EmailCredentialService.removeEmailCredentials(userId);
    res.json(result);
  } catch (error) {
    console.error('Error removing email credentials:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get email suggestions for user
const getEmailSuggestions = async (req, res) => {
  try {
    const user = req.user;
    const suggestions = EmailCredentialService.generateEmailSuggestions(user);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating email suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send email using user's credentials
const sendEmail = async (req, res) => {
  // Handle file uploads first
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    }

    try {
      const userId = req.user.id || req.user._id;
      
      // Get user's email credentials
      const credentials = await EmailCredentialService.getEmailCredentials(userId);
      
      if (!credentials.configured) {
        return res.status(400).json({
          success: false,
          message: 'Email credentials not configured. Please setup your email first.'
        });
      }

      const { to, cc, bcc, subject, text, html } = req.body;

      // Parse JSON arrays
      const toEmails = JSON.parse(to);
      const ccEmails = cc ? JSON.parse(cc) : [];
      const bccEmails = bcc ? JSON.parse(bcc) : [];

      if (!toEmails || toEmails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient is required'
        });
      }

      // Prepare attachments
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      })) : [];

      // Create Hostinger email service with user's credentials
      const emailService = new HostingerEmailService(
        credentials.smtpEmail,
        credentials.smtpPassword
      );

      // Send email
      const emailData = {
        from: credentials.smtpEmail, // Use user's email as sender
        to: toEmails,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        subject,
        text,
        html,
        attachments
      };

      const result = await emailService.sendEmail(emailData);

      // Save sent email to database
      const emailRecord = new Email({
        userId: userId,
        from: credentials.smtpEmail,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        textContent: text,
        htmlContent: html,
        attachments: attachments.map(att => ({
          filename: att.filename,
          size: att.content.length,
          contentType: att.contentType
        })),
        sentAt: new Date(),
        messageId: result.messageId || null,
        status: 'sent'
      });

      await emailRecord.save();

      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        emailId: emailRecord._id
      });

    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
};

// Fetch emails using user's credentials
const fetchEmails = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { folder = 'INBOX', limit = 10, sortBy = 'date', sortOrder = 'desc' } = req.body;

    // Get user's email credentials
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    if (!credentials.configured) {
      return res.status(400).json({
        success: false,
        message: 'Email credentials not configured. Please setup your email first.'
      });
    }

    // Create Hostinger email service with user's credentials
    const emailService = new HostingerEmailService(
      credentials.smtpEmail,
      credentials.smtpPassword
    );

    // Fetch emails
    const emails = await emailService.fetchEmails({
      folder,
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Save fetched emails to database for offline access
    for (const email of emails) {
      const existingEmail = await Email.findOne({
        userId: userId,
        messageId: email.messageId || email.uid
      });

      if (!existingEmail) {
        const emailRecord = new Email({
          userId: userId,
          messageId: email.messageId || email.uid,
          from: email.from?.address || email.from,
          to: email.to?.map(t => t.address || t) || [],
          cc: email.cc?.map(c => c.address || c) || [],
          bcc: email.bcc?.map(b => b.address || b) || [],
          subject: email.subject,
          textContent: email.text,
          htmlContent: email.html,
          receivedAt: new Date(email.date),
          folder: folder,
          flags: email.flags || [],
          attachments: email.attachments || [],
          status: 'received'
        });

        await emailRecord.save();
      }
    }

    res.json({
      success: true,
      emails: emails,
      folder: folder,
      total: emails.length
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get email content by UID
const getEmailContent = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.body;

    // Get user's email credentials
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    if (!credentials.configured) {
      return res.status(400).json({
        success: false,
        message: 'Email credentials not configured. Please setup your email first.'
      });
    }

    // Create Hostinger email service with user's credentials
    const emailService = new HostingerEmailService(
      credentials.smtpEmail,
      credentials.smtpPassword
    );

    // Fetch specific email content
    const content = await emailService.fetchEmailContent(uid, folder);

    res.json({
      success: true,
      content: content
    });

  } catch (error) {
    console.error('Error fetching email content:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save draft email
const saveDraft = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { to, cc, bcc, subject, text, html } = req.body;

    // Get user's email credentials to use sender email
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    if (!credentials.configured) {
      return res.status(400).json({
        success: false,
        message: 'Email credentials not configured. Please setup your email first.'
      });
    }

    const draft = new DraftEmail({
      userId: userId,
      from: credentials.smtpEmail,
      to: to || [],
      cc: cc || [],
      bcc: bcc || [],
      subject: subject || '',
      textContent: text || '',
      htmlContent: html || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await draft.save();

    res.json({
      success: true,
      message: 'Draft saved successfully',
      draftId: draft._id
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update draft email
const updateDraft = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { to, cc, bcc, subject, text, html } = req.body;

    const draft = await DraftEmail.findOneAndUpdate(
      { _id: id, userId: userId },
      {
        to: to || [],
        cc: cc || [],
        bcc: bcc || [],
        subject: subject || '',
        textContent: text || '',
        htmlContent: html || '',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    res.json({
      success: true,
      message: 'Draft updated successfully',
      draft: draft
    });

  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's drafts
const getDrafts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const drafts = await DraftEmail.find({ userId: userId })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      drafts: drafts
    });

  } catch (error) {
    console.error('Error getting drafts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete draft
const deleteDraft = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const draft = await DraftEmail.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's sent emails
const getSentEmails = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const sentEmails = await Email.find({ 
      userId: userId,
      status: 'sent'
    }).sort({ sentAt: -1 });

    res.json({
      success: true,
      emails: sentEmails
    });

  } catch (error) {
    console.error('Error getting sent emails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's received emails
const getReceivedEmails = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const receivedEmails = await Email.find({ 
      userId: userId,
      status: 'received'
    }).sort({ receivedAt: -1 });

    res.json({
      success: true,
      emails: receivedEmails
    });

  } catch (error) {
    console.error('Error getting received emails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Test endpoint for debugging
const testEmailService = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Email service is working',
      serviceAvailable: typeof EmailCredentialService !== 'undefined',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
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
};
