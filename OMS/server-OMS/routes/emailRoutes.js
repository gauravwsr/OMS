const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const EmailCredentialService = require('../services/emailCredentialService');
const { authenticate } = require('../middlewares/authMiddleware');
const { uploadAttachments, uploadToCloudinary, validateEmailData, emailRateLimit, processAttachments, sanitizeEmailContent, logEmailActivity } = require('../middlewares/emailMiddleware');
const SentEmail = require('../models/SentEmail');

// Connection pool to reuse IMAP connections
const connectionPool = new Map();
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// Helper function to get or create IMAP connection
function getImapConnection(email, password) {
  const userKey = `${email}`;
  
  // Check if we have an existing connection for this user
  if (connectionPool.has(userKey)) {
    const connectionData = connectionPool.get(userKey);
    const { connection, lastUsed } = connectionData;
    
    // Check if connection is still valid and not too old
    if (connection.state === 'authenticated' && (Date.now() - lastUsed) < CONNECTION_TIMEOUT) {
      console.log(`♻️  Reusing existing IMAP connection for ${email}`);
      connectionData.lastUsed = Date.now();
      return Promise.resolve(connection);
    } else {
      // Connection is stale, remove it
      try {
        connection.end();
      } catch (e) {
        console.log('Error closing stale connection:', e.message);
      }
      connectionPool.delete(userKey);
    }
  }
  
  console.log(`🆕 Creating new IMAP connection for ${email}`);
  
  return new Promise((resolve, reject) => {
    const imapServers = [
      'imap.hostinger.com',
      'mail.hostinger.com'
    ];
    
    let serverIndex = 0;
    
    function tryConnection() {
      if (serverIndex >= imapServers.length) {
        return reject(new Error('Failed to connect to any IMAP server - connection limit may be exceeded'));
      }
      
      const currentServer = imapServers[serverIndex];
      console.log(`🔄 Connecting to IMAP server: ${currentServer} (attempt ${serverIndex + 1})`);
      
      const imap = new Imap({
        user: email,
        password: password,
        host: currentServer,
        port: 993,
        tls: true,
        tlsOptions: { 
          rejectUnauthorized: false,
          servername: currentServer
        },
        connTimeout: 15000,
        authTimeout: 15000,
        keepalive: false // Disable keepalive to reduce persistent connections
      });

      const timeout = setTimeout(() => {
        console.log(`⏰ Connection timeout for ${currentServer}`);
        imap.end();
        serverIndex++;
        if (serverIndex < imapServers.length) {
          setTimeout(tryConnection, 1000);
        } else {
          reject(new Error('Connection timeout - all servers failed'));
        }
      }, 20000);

      imap.once('ready', () => {
        console.log(`✅ IMAP connection ready with ${currentServer}`);
        clearTimeout(timeout);
        
        // Store connection in pool with timestamp
        connectionPool.set(userKey, {
          connection: imap,
          lastUsed: Date.now(),
          server: currentServer
        });
        
        // Clean up connection from pool when it ends
        imap.once('end', () => {
          console.log(`🔚 IMAP connection ended for ${email}`);
          connectionPool.delete(userKey);
        });

        imap.once('error', (err) => {
          console.log(`❌ Connection error after ready, removing from pool: ${err.message}`);
          connectionPool.delete(userKey);
        });

        resolve(imap);
      });

      imap.once('error', (err) => {
        console.error(`❌ IMAP connection error with ${currentServer}:`, err.message);
        clearTimeout(timeout);
        
        // Handle specific connection limit error
        if (err.message.includes('Maximum number of connections') || 
            err.message.includes('mail_max_userip_connections') ||
            err.message.includes('Too many connections')) {
          
          console.log('🚫 Connection limit hit - cleaning up and retrying');
          cleanupAllConnections();
          
          // Wait longer before retry
          setTimeout(() => {
            serverIndex++;
            if (serverIndex < imapServers.length) {
              tryConnection();
            } else {
              reject(new Error('Connection limit exceeded. Please wait a moment and try again.'));
            }
          }, 3000);
        } else {
          serverIndex++;
          if (serverIndex < imapServers.length) {
            setTimeout(tryConnection, 1000);
          } else {
            reject(new Error(`Failed to connect to email server: ${err.message}`));
          }
        }
      });

      try {
        imap.connect();
      } catch (connectError) {
        clearTimeout(timeout);
        console.error(`❌ Failed to initiate connection: ${connectError.message}`);
        serverIndex++;
        if (serverIndex < imapServers.length) {
          setTimeout(tryConnection, 1000);
        } else {
          reject(new Error('Failed to initiate IMAP connection'));
        }
      }
    }
    
    tryConnection();
  });
}

// Helper function to clean up all connections
function cleanupAllConnections() {
  console.log(`🧹 Cleaning up all IMAP connections. Current count: ${connectionPool.size}`);
  
  for (const [userKey, connectionData] of connectionPool.entries()) {
    try {
      connectionData.connection.end();
    } catch (err) {
      console.log(`Error closing connection for ${userKey}:`, err.message);
    }
  }
  connectionPool.clear();
}

// Helper function to clean up connections for a specific user
function cleanupUserConnections(userKey) {
  console.log(`🧹 Cleaning up connections for user: ${userKey}`);
  
  if (connectionPool.has(userKey)) {
    const connectionData = connectionPool.get(userKey);
    try {
      connectionData.connection.end();
    } catch (err) {
      console.log('Error closing connection:', err.message);
    }
    connectionPool.delete(userKey);
  }
}

// Test route to verify authentication
router.get('/test', authenticate, async (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentication working',
    user: {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Test route for sending emails without authentication (for testing only)
router.post('/test-send', uploadAttachments, uploadToCloudinary, processAttachments, sanitizeEmailContent, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, isReply, isForward, originalMessageId } = req.body;
    const attachmentFiles = req.files || [];
    
    console.log('📧 Test sending email:', { 
      to, 
      subject, 
      attachmentCount: attachmentFiles.length,
      totalAttachmentSize: req.totalAttachmentSize ? `${Math.round(req.totalAttachmentSize / 1024)} KB` : '0 KB',
      cloudinaryEnabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    });

    // Use test SMTP credentials from environment variables
    const testSmtpEmail = process.env.SMTP_USER;
    const testSmtpPassword = process.env.SMTP_PASS;

    if (!testSmtpEmail || !testSmtpPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Test SMTP credentials not configured in environment variables' 
      });
    }

    // Create transporter with test credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: testSmtpEmail,
        pass: testSmtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Parse email addresses (support comma-separated values)
    const parseEmails = (emailStr) => {
      if (!emailStr || !emailStr.trim()) return undefined;
      return emailStr.split(',').map(email => email.trim()).filter(email => email);
    };

    // Prepare attachments for nodemailer
    const emailAttachments = attachmentFiles.map(file => {
      const attachment = {
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      };
      
      // Log Cloudinary upload if successful
      if (file.cloudinary && file.cloudinary.secure_url) {
        console.log(`📎 Attachment "${file.originalname}" uploaded to Cloudinary: ${file.cloudinary.secure_url}`);
      }
      
      return attachment;
    });

    const mailOptions = {
      from: testSmtpEmail,
      to: parseEmails(to),
      cc: parseEmails(cc),
      bcc: parseEmails(bcc),
      subject: subject,
      html: body,
      attachments: emailAttachments
    };

    // Add reply/forward headers if applicable
    if (isReply && originalMessageId) {
      mailOptions.inReplyTo = originalMessageId;
      mailOptions.references = originalMessageId;
    }

    // Remove undefined fields to avoid nodemailer issues
    if (!mailOptions.to) delete mailOptions.to;
    if (!mailOptions.cc) delete mailOptions.cc;
    if (!mailOptions.bcc) delete mailOptions.bcc;

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    // Log the action type
    const actionType = isReply ? 'Reply' : isForward ? 'Forward' : 'New Email';
    console.log(`✅ Test ${actionType} sent successfully:`, info.messageId);
    
    // Save sent email to database
    try {
      const attachmentData = req.cloudinaryFiles ? req.cloudinaryFiles.map(file => ({
        filename: file.originalname,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        cloudinary: file.cloudinary
      })) : req.attachmentInfo || [];

      const sentEmail = new SentEmail({
        userId: new mongoose.Types.ObjectId(), // Temporary user ID for test
        from: testSmtpEmail,
        to: to,
        cc: cc || '',
        bcc: bcc || '',
        subject: subject,
        body: body,
        attachments: attachmentData,
        messageId: info.messageId,
        isReply: isReply === 'true',
        isForward: isForward === 'true',
        originalMessageId: originalMessageId || null,
        status: 'sent'
      });

      await sentEmail.save();
      console.log('💾 Sent email saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save sent email to database:', dbError.message);
    }
    
    // Prepare response with Cloudinary info if available
    const responseData = {
      success: true, 
      message: `Test ${actionType} sent successfully!`,
      messageId: info.messageId,
      actionType: actionType.toLowerCase(),
      attachmentCount: attachmentFiles.length,
      from: testSmtpEmail
    };
    
    // Add Cloudinary file information to response
    if (req.cloudinaryFiles && req.cloudinaryFiles.length > 0) {
      responseData.cloudinaryFiles = req.cloudinaryFiles;
      console.log(`☁️ ${req.cloudinaryFiles.length} files stored in Cloudinary`);
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Test route for fetching sent emails without authentication (for testing only)
router.get('/test-sent', async (req, res) => {
  try {
    console.log('📬 Fetching sent emails (test mode)...');
    
    // Use test SMTP credentials from environment variables
    const testSmtpEmail = process.env.SMTP_USER;
    const testSmtpPassword = process.env.SMTP_PASS;

    if (!testSmtpEmail || !testSmtpPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Test SMTP credentials not configured in environment variables',
        emails: []
      });
    }

    let allEmails = [];

    // Try to fetch from IMAP sent folders
    try {
      console.log('🔄 Attempting to fetch sent emails from IMAP...');
      const sentFolders = ['SENT', 'Sent', 'Sent Items', 'Sent Mail', 'INBOX.Sent'];
      
      for (const folder of sentFolders) {
        try {
          const imapEmails = await fetchImapEmails(testSmtpEmail, testSmtpPassword, folder, 50);
          if (imapEmails.length > 0) {
            console.log(`📧 Found ${imapEmails.length} emails in IMAP folder: ${folder}`);
            
            // Mark IMAP emails with source
            const markedEmails = imapEmails.map(email => ({
              ...email,
              source: 'imap',
              from: testSmtpEmail // Ensure from field is set
            }));
            
            allEmails = [...allEmails, ...markedEmails];
            break; // Successfully fetched from this folder
          }
        } catch (folderError) {
          if (folder === sentFolders[sentFolders.length - 1]) {
            console.warn('⚠️ Failed to fetch from all IMAP sent folders:', folderError.message);
          }
          continue;
        }
      }
    } catch (imapError) {
      console.warn('⚠️ IMAP fetch failed:', imapError.message);
    }

    // Sort emails by date (newest first)
    allEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to reasonable number for performance
    const limitedEmails = allEmails.slice(0, 100);

    console.log(`📬 Returning ${limitedEmails.length} sent emails for test mode`);

    res.json({ 
      success: true,
      emails: limitedEmails,
      summary: {
        total: limitedEmails.length,
        local: 0,
        imap: limitedEmails.length
      }
    });
  } catch (error) {
    console.error('Error fetching test sent emails:', error);
    res.status(500).json({ 
      success: false,
      message: error.message, 
      emails: [],
      summary: { total: 0, local: 0, imap: 0 }
    });
  }
});

// Check if user has email configured
router.get('/check-config', authenticate, async (req, res) => {
  try {
    console.log('Check config route called for user:', req.user.id || req.user._id);
    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    console.log('Credentials check result:', { configured: credentials.configured, email: credentials.smtpEmail || 'Not set' });
    
    res.json({
      configured: credentials.configured,
      email: credentials.configured ? credentials.smtpEmail : null
    });
  } catch (error) {
    console.error('Error checking email config:', error);
    res.status(500).json({ message: error.message });
  }
});

// Configure user email credentials
router.post('/configure', authenticate, async (req, res) => {
  try {
    const { email, password, testOnly } = req.body;
    console.log('Configure route called:', { email, testOnly, userId: req.user.id || req.user._id });
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Test credentials first
    const testResult = await EmailCredentialService.testEmailCredentials(email, password);
    console.log('Test result:', testResult);
    
    if (testOnly) {
      return res.json(testResult);
    }

    if (!testResult.success) {
      return res.status(400).json({ success: false, message: testResult.message });
    }

    // Save credentials
    const result = await EmailCredentialService.saveEmailCredentials(req.user.id || req.user._id, email, password);
    console.log('Save result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error configuring email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove/Reset email configuration
router.delete('/remove-config', authenticate, async (req, res) => {
  try {
    const result = await EmailCredentialService.removeEmailCredentials(req.user.id || req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error removing email config:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test IMAP connection only
router.post('/test-imap', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    
    if (!credentials.configured) {
      return res.status(400).json({ message: 'Email not configured' });
    }

    // Test IMAP connection without fetching emails
    const testResult = await testImapConnection(credentials.smtpEmail, credentials.smtpPassword);
    res.json(testResult);
  } catch (error) {
    console.error('Error testing IMAP:', error);
    res.status(500).json({ message: error.message, success: false });
  }
});

// Fetch user's inbox emails
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    
    if (!credentials.configured) {
      return res.status(400).json({ message: 'Email not configured' });
    }

    const emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, 'INBOX');
    
    res.json({ emails });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Fetch user's sent emails from both local database and IMAP
router.get('/sent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let allEmails = [];

    // 1. First, get locally stored sent emails
    try {
      const localSentEmails = await SentEmail.find({ userId })
        .sort({ sentAt: -1 })
        .limit(50)
        .lean();

      // Transform local emails to match expected format
      const transformedLocalEmails = localSentEmails.map(email => ({
        id: email._id,
        messageId: email.messageId,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        date: email.sentAt,
        attachments: email.attachments || [],
        source: 'local',
        isReply: email.isReply,
        isForward: email.isForward
      }));

      allEmails = transformedLocalEmails;
      console.log(`📋 Found ${allEmails.length} locally stored sent emails`);

    } catch (localError) {
      console.warn('⚠️ Failed to fetch local sent emails:', localError.message);
    }

    // 2. Try to fetch from IMAP as backup/additional source
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    if (credentials.configured) {
      try {
        console.log('🔄 Attempting to fetch sent emails from IMAP...');
        const sentFolders = ['SENT', 'Sent', 'Sent Items', 'Sent Mail', 'INBOX.Sent'];
        let imapEmails = [];
        
        for (const folder of sentFolders) {
          try {
            imapEmails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder, 25);
            if (imapEmails.length > 0) {
              console.log(`📧 Found ${imapEmails.length} emails in IMAP folder: ${folder}`);
              
              // Mark IMAP emails with source
              imapEmails = imapEmails.map(email => ({
                ...email,
                source: 'imap'
              }));
              
              // Merge with local emails, avoiding duplicates by messageId
              const localMessageIds = allEmails.map(e => e.messageId).filter(Boolean);
              const newImapEmails = imapEmails.filter(email => 
                !localMessageIds.includes(email.messageId) && email.messageId
              );
              
              if (newImapEmails.length > 0) {
                allEmails = [...allEmails, ...newImapEmails];
                console.log(`➕ Added ${newImapEmails.length} new emails from IMAP`);
              }
              
              break; // Successfully fetched from this folder
            }
          } catch (folderError) {
            if (folder === sentFolders[sentFolders.length - 1]) {
              console.warn('⚠️ Failed to fetch from all IMAP sent folders:', folderError.message);
            }
            continue;
          }
        }
      } catch (imapError) {
        console.warn('⚠️ IMAP fetch failed:', imapError.message);
      }
    } else {
      console.log('📧 Email not configured, using local emails only');
    }

    // 3. Sort combined emails by date (newest first)
    allEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Limit to reasonable number for performance
    const limitedEmails = allEmails.slice(0, 100);

    console.log(`📬 Returning ${limitedEmails.length} sent emails (${allEmails.filter(e => e.source === 'local').length} local, ${allEmails.filter(e => e.source === 'imap').length} IMAP)`);

    res.json({ 
      emails: limitedEmails,
      summary: {
        total: limitedEmails.length,
        local: allEmails.filter(e => e.source === 'local').length,
        imap: allEmails.filter(e => e.source === 'imap').length
      }
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ 
      message: error.message, 
      emails: [],
      summary: { total: 0, local: 0, imap: 0 }
    });
  }
});


// Fetch user's drafts
router.get('/drafts', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const credentials = await EmailCredentialService.getEmailCredentials(userId);
    
    let allDrafts = [];
    
    // First, fetch local database drafts
    try {
      const Draft = require('../models/Draft');
      const localDrafts = await Draft.find({ userId: userId })
        .sort({ date: -1 })
        .limit(50);
      
      console.log(`📝 Found ${localDrafts.length} local drafts for user ${userId}`);
      
      // Format local drafts to match email format
      const formattedLocalDrafts = localDrafts.map(draft => ({
        _id: draft._id,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject || '(No Subject)',
        body: draft.body,
        date: draft.date,
        from: 'Local Draft',
        source: 'local',
        isDraft: true
      }));
      
      allDrafts = [...allDrafts, ...formattedLocalDrafts];
    } catch (dbError) {
      console.warn('⚠️ Error fetching local drafts:', dbError.message);
    }
    
    // Then try to fetch IMAP drafts if email is configured
    if (credentials.configured) {
      try {
        const draftFolders = ['DRAFTS', 'Drafts', 'Draft', 'INBOX.Drafts'];
        
        for (const folder of draftFolders) {
          try {
            const imapDrafts = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder, 25);
            if (imapDrafts.length > 0) {
              console.log(`📧 Found ${imapDrafts.length} IMAP drafts in folder: ${folder}`);
              
              // Mark IMAP drafts with source
              const markedImapDrafts = imapDrafts.map(draft => ({
                ...draft,
                source: 'imap',
                isDraft: true
              }));
              
              allDrafts = [...allDrafts, ...markedImapDrafts];
              break;
            }
          } catch (folderError) {
            if (folder === draftFolders[draftFolders.length - 1]) {
              console.warn('⚠️ No IMAP draft folders accessible');
            }
            continue;
          }
        }
      } catch (imapError) {
        console.warn('⚠️ IMAP draft fetch failed:', imapError.message);
      }
    }
    
    // Sort all drafts by date (newest first)
    allDrafts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`📬 Returning ${allDrafts.length} total drafts (local + IMAP)`);
    
    res.json({ 
      emails: allDrafts,
      summary: {
        total: allDrafts.length,
        local: allDrafts.filter(d => d.source === 'local').length,
        imap: allDrafts.filter(d => d.source === 'imap').length
      }
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Test route for fetching drafts without authentication (for testing only)
router.get('/test-drafts', async (req, res) => {
  try {
    const Draft = require('../models/Draft');
    
    // Use a test user ID for drafts when not authenticated
    const testUserId = new require('mongoose').Types.ObjectId('000000000000000000000000');
    
    // Fetch drafts from local database for test user
    const drafts = await Draft.find({ userId: testUserId })
      .sort({ date: -1 })
      .limit(50);
    
    console.log(`📝 Found ${drafts.length} test drafts`);
    
    // Format drafts to match email format
    const formattedDrafts = drafts.map(draft => ({
      _id: draft._id,
      to: draft.to,
      cc: draft.cc,
      bcc: draft.bcc,
      subject: draft.subject || '(No Subject)',
      body: draft.body,
      date: draft.date,
      from: 'Draft', // Indicate this is a draft
      source: 'local',
      isDraft: true
    }));
    
    res.json({ 
      success: true,
      emails: formattedDrafts,
      count: formattedDrafts.length
    });
  } catch (error) {
    console.error('Error fetching test drafts:', error);
    res.status(500).json({ 
      success: false,
      message: error.message, 
      emails: [] 
    });
  }
});

// Delete draft with authentication
router.delete('/delete-draft/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const Draft = require('../models/Draft');
    
    const result = await Draft.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id || req.user._id 
    });
    
    if (result) {
      console.log('🗑️ Draft deleted:', id);
      res.json({ success: true, message: 'Draft deleted successfully!' });
    } else {
      res.status(404).json({ success: false, message: 'Draft not found' });
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for deleting draft without authentication (for testing only)
router.delete('/test-delete-draft/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const Draft = require('../models/Draft');
    
    // Use a test user ID for drafts when not authenticated
    const testUserId = new require('mongoose').Types.ObjectId('000000000000000000000000');
    
    const result = await Draft.findOneAndDelete({ 
      _id: id, 
      userId: testUserId 
    });
    
    if (result) {
      console.log('🗑️ Test draft deleted:', id);
      res.json({ success: true, message: 'Draft deleted successfully!' });
    } else {
      res.status(404).json({ success: false, message: 'Draft not found' });
    }
  } catch (error) {
    console.error('Error deleting test draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send email using user's credentials with file attachments and local storage
router.post('/send', authenticate, uploadAttachments, uploadToCloudinary, emailRateLimit, validateEmailData, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, isReply, isForward, originalMessageId } = req.body;
    const attachmentFiles = req.files || [];
    
    console.log('📧 Sending email:', { to, subject, attachmentCount: attachmentFiles.length });

    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    
    if (!credentials.configured) {
      return res.status(400).json({ message: 'Email not configured' });
    }

    // Create transporter with user's credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: credentials.smtpEmail,
        pass: credentials.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Parse email addresses (support comma-separated values)
    const parseEmails = (emailStr) => {
      if (!emailStr || !emailStr.trim()) return undefined;
      return emailStr.split(',').map(email => email.trim()).filter(email => email);
    };

    // Prepare attachments for nodemailer
    const emailAttachments = attachmentFiles.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    const mailOptions = {
      from: credentials.smtpEmail,
      to: parseEmails(to),
      cc: parseEmails(cc),
      bcc: parseEmails(bcc),
      subject: subject,
      html: body,
      attachments: emailAttachments
    };

    // Add reply/forward headers if applicable
    if (isReply && originalMessageId) {
      mailOptions.inReplyTo = originalMessageId;
      mailOptions.references = originalMessageId;
    }

    // Remove undefined fields to avoid nodemailer issues
    if (!mailOptions.to) delete mailOptions.to;
    if (!mailOptions.cc) delete mailOptions.cc;
    if (!mailOptions.bcc) delete mailOptions.bcc;

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    // Save sent email to local database
    const sentEmailData = {
      userId: req.user.id || req.user._id,
      from: credentials.smtpEmail,
      to: to || '',
      cc: cc || '',
      bcc: bcc || '',
      subject: subject,
      body: body,
      attachments: attachmentFiles.map(file => ({
        filename: file.originalname,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: '' // We're using memory storage, no file path
      })),
      messageId: info.messageId,
      isReply: isReply || false,
      isForward: isForward || false,
      originalMessageId: originalMessageId || null,
      status: 'sent',
      source: 'local'
    };

    try {
      const savedEmail = new SentEmail(sentEmailData);
      await savedEmail.save();
      console.log('✅ Email saved to local database:', savedEmail._id);
    } catch (saveError) {
      console.warn('⚠️ Failed to save email to local database:', saveError.message);
      // Continue execution - email was sent successfully
    }

    // Log the action type
    const actionType = isReply ? 'Reply' : isForward ? 'Forward' : 'New Email';
    console.log(`✅ ${actionType} sent successfully:`, info.messageId);
    
    res.json({ 
      success: true, 
      message: `${actionType} sent successfully!`,
      messageId: info.messageId,
      actionType: actionType.toLowerCase(),
      attachmentCount: attachmentFiles.length
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Save draft with file attachments
router.post('/save-draft', authenticate, uploadAttachments, uploadToCloudinary, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const attachmentFiles = req.files || [];
    const Draft = require('../models/Draft');
    
    // Process attachments
    const attachments = attachmentFiles.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    const newDraft = new Draft({
      userId: req.user.id || req.user._id,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      body: body,
      attachments: attachments,
      date: new Date()
    });

    await newDraft.save();
    console.log('📝 Draft saved with attachments:', { 
      to, 
      subject, 
      attachmentCount: attachments.length 
    });
    
    res.json({ 
      success: true, 
      message: 'Draft saved successfully!', 
      draft: {
        _id: newDraft._id,
        to: newDraft.to,
        cc: newDraft.cc,
        bcc: newDraft.bcc,
        subject: newDraft.subject,
        body: newDraft.body,
        attachments: newDraft.attachments,
        date: newDraft.date
      }
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for saving draft with attachments without authentication (for testing only)
router.post('/test-save-draft', uploadAttachments, uploadToCloudinary, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const attachmentFiles = req.files || [];
    const Draft = require('../models/Draft');
    
    // Use a test user ID for drafts when not authenticated
    const testUserId = new require('mongoose').Types.ObjectId('000000000000000000000000');
    
    // Process attachments
    const attachments = attachmentFiles.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    const newDraft = new Draft({
      userId: testUserId,
      to: to || '',
      cc: cc || '',
      bcc: bcc || '',
      subject: subject || '',
      body: body || '',
      attachments: attachments,
      date: new Date()
    });

    await newDraft.save();
    console.log('📝 Test draft saved with attachments:', { 
      to: to, 
      subject: subject, 
      bodyLength: body ? body.length : 0,
      attachmentCount: attachments.length
    });
    
    res.json({ 
      success: true, 
      message: 'Draft saved successfully!', 
      draft: {
        _id: newDraft._id,
        to: newDraft.to,
        cc: newDraft.cc,
        bcc: newDraft.bcc,
        subject: newDraft.subject,
        body: newDraft.body,
        attachments: newDraft.attachments,
        date: newDraft.date
      }
    });
  } catch (error) {
    console.error('Error saving test draft:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update existing draft with file attachments
router.put('/update-draft/:id', authenticate, uploadAttachments, uploadToCloudinary, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const attachmentFiles = req.files || [];
    const Draft = require('../models/Draft');
    
    const draftId = req.params.id;
    const userId = req.user.id || req.user._id;
    
    // Find the existing draft
    const existingDraft = await Draft.findOne({ _id: draftId, userId: userId });
    
    if (!existingDraft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    
    // Process new attachments
    const newAttachments = attachmentFiles.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    // Update the draft
    existingDraft.to = to;
    existingDraft.cc = cc;
    existingDraft.bcc = bcc;
    existingDraft.subject = subject;
    existingDraft.body = body;
    existingDraft.attachments = [...(existingDraft.attachments || []), ...newAttachments];
    existingDraft.date = new Date();
    
    await existingDraft.save();
    
    res.json({ 
      success: true, 
      message: 'Draft updated successfully!', 
      draft: {
        _id: existingDraft._id,
        to: existingDraft.to,
        cc: existingDraft.cc,
        bcc: existingDraft.bcc,
        subject: existingDraft.subject,
        body: existingDraft.body,
        attachments: existingDraft.attachments,
        date: existingDraft.date
      }
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for updating draft without authentication (for testing only)
router.put('/test-update-draft/:id', uploadAttachments, uploadToCloudinary, async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const attachmentFiles = req.files || [];
    const Draft = require('../models/Draft');
    
    const draftId = req.params.id;
    // Use a test user ID for drafts when not authenticated
    const testUserId = new require('mongoose').Types.ObjectId('000000000000000000000000');
    
    // Find the existing draft
    const existingDraft = await Draft.findOne({ _id: draftId, userId: testUserId });
    
    if (!existingDraft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    
    // Process new attachments
    const newAttachments = attachmentFiles.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    // Update the draft
    existingDraft.to = to;
    existingDraft.cc = cc;
    existingDraft.bcc = bcc;
    existingDraft.subject = subject;
    existingDraft.body = body;
    existingDraft.attachments = [...(existingDraft.attachments || []), ...newAttachments];
    existingDraft.date = new Date();
    
    await existingDraft.save();
    
    res.json({ 
      success: true, 
      message: 'Draft updated successfully!', 
      draft: {
        _id: existingDraft._id,
        to: existingDraft.to,
        cc: existingDraft.cc,
        bcc: existingDraft.bcc,
        subject: existingDraft.subject,
        body: existingDraft.body,
        attachments: existingDraft.attachments,
        date: existingDraft.date
      }
    });
  } catch (error) {
    console.error('Error updating test draft:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Helper function to test IMAP connection
function testImapConnection(email, password) {
  return new Promise(async (resolve, reject) => {
    try {
      const imap = await getImapConnection(email, password);
      
      // Test by opening INBOX briefly
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('IMAP test - failed to open inbox:', err.message);
          resolve({ success: false, message: 'Failed to access inbox: ' + err.message });
        } else {
          console.log('IMAP test successful - inbox accessible');
          resolve({ success: true, message: 'IMAP connection and inbox access successful' });
        }
      });
      
    } catch (error) {
      console.error('IMAP test error:', error);
      
      let errorMessage = 'IMAP connection test failed';
      if (error.message.includes('Invalid credentials') || error.message.includes('AUTHENTICATIONFAILED')) {
        errorMessage = 'Invalid email credentials';
      } else if (error.message.includes('Connection limit exceeded') || error.message.includes('Maximum number of connections')) {
        errorMessage = 'Too many connections. Please wait a moment and try again.';
      } else if (error.message.includes('Timed out') || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout';
      }
      
      resolve({ success: false, message: errorMessage });
    }
  });
}

// Helper function to fetch emails from IMAP with connection pooling
async function fetchImapEmails(email, password, folder = 'INBOX', limit = 50) {
  console.log('📬 Starting IMAP fetch for folder:', folder);
  console.log('📬 Email:', email);
  console.log('📬 Limit:', limit);
  
  return new Promise(async (resolve, reject) => {
    let imap;
    
    try {
      // Get or create IMAP connection using the connection pool
      imap = await getImapConnection(email, password);
    } catch (connectionError) {
      console.error('Failed to get IMAP connection:', connectionError.message);
      return reject(connectionError);
    }

    // Set up operation timeout
    const operationTimeout = setTimeout(() => {
      console.log('IMAP operation timeout');
      resolve([]); // Return empty array instead of rejecting
    }, 30000);

    imap.openBox(folder, true, (err, box) => {
      if (err) {
        clearTimeout(operationTimeout);
        console.error(`Error opening ${folder}:`, err.message);
        return reject(new Error(`Failed to open ${folder}: ${err.message}`));
      }

      console.log(`📂 Opened ${folder} successfully`);
      console.log(`📊 Total messages: ${box.messages.total}`);

      if (box.messages.total === 0) {
        clearTimeout(operationTimeout);
        console.log('No messages found in folder');
        return resolve([]);
      }

      const fetchLimit = Math.min(limit, box.messages.total);
      const start = Math.max(1, box.messages.total - fetchLimit + 1);
      
      console.log(`� Fetching messages ${start} to ${box.messages.total}`);
      
      const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
        bodies: '',
        struct: true
      });

      const emails = [];
      let parsingPromises = [];
      let processedCount = 0;

      fetch.on('message', (msg, seqno) => {
        let parsePromise = new Promise((resolveMsg) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream)
              .then(parsed => {
                // Process attachments
                const attachments = [];
                if (parsed.attachments && parsed.attachments.length > 0) {
                  parsed.attachments.forEach((attachment, index) => {
                    attachments.push({
                      filename: attachment.filename || `attachment_${index + 1}`,
                      contentType: attachment.contentType || 'application/octet-stream',
                      size: attachment.content ? attachment.content.length : 0,
                      contentId: attachment.contentId,
                      contentDisposition: attachment.contentDisposition,
                      // We don't store the actual content for performance reasons
                      hasContent: !!attachment.content
                    });
                  });
                }
                
                emails.push({
                  from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown',
                  to: parsed.to?.text || parsed.to?.value?.[0]?.address || 'Unknown',
                  cc: parsed.cc?.text || '',
                  bcc: parsed.bcc?.text || '',
                  subject: parsed.subject || 'No Subject',
                  date: parsed.date || new Date(),
                  body: parsed.html || parsed.textAsHtml || parsed.text || '',
                  messageId: parsed.messageId,
                  seqno: seqno,
                  attachments: attachments, // Add attachments array
                  hasAttachments: attachments.length > 0 // Add flag for quick checking
                });
                processedCount++;
                resolveMsg();
              })
              .catch(err => {
                console.error('Parse error for message', seqno, ':', err.message);
                processedCount++;
                resolveMsg(); // Skip on error
              });
          });
          
          msg.once('end', () => {
            // Message processing complete
          });
        });
        parsingPromises.push(parsePromise);
      });

      fetch.once('error', (err) => {
        clearTimeout(operationTimeout);
        console.error('Fetch error:', err.message);
        reject(new Error('Failed to fetch emails: ' + err.message));
      });

      fetch.once('end', async () => {
        clearTimeout(operationTimeout);
        console.log(`📨 Fetch completed. Processing ${processedCount} messages`);
        
        try {
          // Wait for all parsing to complete with a timeout
          await Promise.race([
            Promise.all(parsingPromises),
            new Promise(resolve => setTimeout(resolve, 15000)) // 15 second parsing timeout
          ]);
          
          emails.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log(`✅ Successfully processed ${emails.length} emails from ${folder}`);
          resolve(emails);
        } catch (processingError) {
          console.error('Error processing emails:', processingError);
          resolve(emails); // Return what we have
        }
      });
    });
  });
}

// Proxy route for downloading attachments (handles CORS issues)
router.get('/download-attachment', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    console.log('📥 Proxying download for:', filename || 'unnamed file');
    
    // Fetch the file from the URL (Cloudinary or other)
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'stream' });
    
    // Set appropriate headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'attachment'}"`);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Pipe the file stream to response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download file',
      error: error.message 
    });
  }
});

module.exports = router;
