const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const EmailCredentialService = require('../services/emailCredentialService');
const { authenticate } = require('../middlewares/authMiddleware');

// Test route to verify authentication
router.get('/test', authenticate, async (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentication working',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Check if user has email configured
router.get('/check-config', authenticate, async (req, res) => {
  try {
    console.log('Check config route called for user:', req.user._id);
    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
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
    console.log('Configure route called:', { email, testOnly, userId: req.user._id });
    
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
    const result = await EmailCredentialService.saveEmailCredentials(req.user._id, email, password);
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
    const result = await EmailCredentialService.removeEmailCredentials(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error removing email config:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test IMAP connection only
router.post('/test-imap', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
    
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
    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
    
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

// Fetch user's sent emails
router.get('/sent', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
    
    if (!credentials.configured) {
      return res.status(400).json({ message: 'Email not configured' });
    }

    // Try different possible folder names for sent emails
    const sentFolders = ['SENT', 'Sent', 'Sent Items', 'Sent Mail', 'INBOX.Sent'];
    let emails = [];
    
    for (const folder of sentFolders) {
      try {
        emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder);
        if (emails.length > 0 || folder === sentFolders[sentFolders.length - 1]) {
          break;
        }
      } catch (error) {
        if (folder === sentFolders[sentFolders.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    
    res.json({ emails });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Fetch user's drafts
router.get('/drafts', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
    
    if (!credentials.configured) {
      return res.status(400).json({ message: 'Email not configured' });
    }

    // Try different possible folder names for drafts
    const draftFolders = ['DRAFTS', 'Drafts', 'Draft', 'INBOX.Drafts'];
    let emails = [];
    
    for (const folder of draftFolders) {
      try {
        emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder);
        if (emails.length > 0 || folder === draftFolders[draftFolders.length - 1]) {
          break;
        }
      } catch (error) {
        if (folder === draftFolders[draftFolders.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    
    res.json({ emails });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Send email using user's credentials
router.post('/send', authenticate, async (req, res) => {
  try {
    const { to, subject, body, attachments } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'To, subject, and body are required' });
    }

    const credentials = await EmailCredentialService.getEmailCredentials(req.user._id);
    
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

    const mailOptions = {
      from: credentials.smtpEmail,
      to: to,
      subject: subject,
      html: body,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully!',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: error.message });
  }
});

// Save draft
router.post('/save-draft', authenticate, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const Draft = require('../models/Draft');
    
    const newDraft = new Draft({
      userId: req.user._id,
      to: to,
      subject: subject,
      body: body,
      date: new Date()
    });

    await newDraft.save();
    res.json({ success: true, message: 'Draft saved successfully!', draft: newDraft });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to test IMAP connection
function testImapConnection(email, password) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: 'mail.hostinger.com',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'mail.hostinger.com'
      },
      connTimeout: 30000,
      authTimeout: 30000,
    });

    const timeout = setTimeout(() => {
      imap.end();
      reject(new Error('IMAP connection timeout'));
    }, 30000);

    imap.once('ready', () => {
      clearTimeout(timeout);
      imap.end();
      resolve({ success: true, message: 'IMAP connection successful' });
    });

    imap.once('error', (err) => {
      clearTimeout(timeout);
      console.error('IMAP test error:', err);
      
      let errorMessage = 'IMAP connection failed';
      if (err.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email credentials';
      } else if (err.message.includes('Timed out')) {
        errorMessage = 'Connection timeout';
      } else if (err.message.includes('AUTHENTICATIONFAILED')) {
        errorMessage = 'Authentication failed';
      }
      
      resolve({ success: false, message: errorMessage });
    });

    imap.connect();
  });
}

// Helper function to fetch emails from IMAP
async function fetchImapEmails(email, password, folder = 'INBOX', limit = 50) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: 'mail.hostinger.com',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'mail.hostinger.com'
      },
      connTimeout: 30000, // 30 seconds
      authTimeout: 30000,  // 30 seconds
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          console.error(`Error opening ${folder}:`, err);
          return reject(new Error(`Failed to open ${folder}`));
        }

        if (box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }

        const fetchLimit = Math.min(limit, box.messages.total);
        const start = Math.max(1, box.messages.total - fetchLimit + 1);
        
        const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = {};
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString());
            stream.on('end', () => {
              simpleParser(buffer)
                .then(parsed => {
                  emailData.from = parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown';
                  emailData.to = parsed.to?.text || parsed.to?.value?.[0]?.address || 'Unknown';
                  emailData.subject = parsed.subject || 'No Subject';
                  emailData.date = parsed.date || new Date();
                  emailData.body = parsed.html || parsed.textAsHtml || parsed.text || '';
                  emailData.messageId = parsed.messageId;
                  emailData.seqno = seqno;
                })
                .catch(err => console.error('Parse error:', err));
            });
          });

          msg.once('end', () => {
            if (emailData.from) {
              emails.push(emailData);
            }
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          reject(new Error('Failed to fetch emails'));
        });

        fetch.once('end', () => {
          imap.end();
          // Sort by date (newest first)
          emails.sort((a, b) => new Date(b.date) - new Date(a.date));
          resolve(emails);
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      clearTimeout(timeout);
      let errorMessage = 'Failed to connect to email server';
      
      if (err.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email credentials';
      } else if (err.message.includes('Timed out')) {
        errorMessage = 'Connection timeout - please check your internet connection';
      } else if (err.message.includes('AUTHENTICATIONFAILED')) {
        errorMessage = 'Email authentication failed - please check your credentials';
      } else if (err.message.includes('connect ENOTFOUND')) {
        errorMessage = 'Cannot connect to email server - please check your internet connection';
      }
      
      reject(new Error(errorMessage));
    });

    imap.once('end', () => {
      console.log('IMAP connection ended');
    });

    // Set connection timeout
    const timeout = setTimeout(() => {
      imap.end();
      reject(new Error('IMAP connection timeout'));
    }, 60000); // Increased to 60 seconds

    imap.connect();
    
    imap.once('ready', () => clearTimeout(timeout));
    imap.once('error', () => clearTimeout(timeout));
    imap.once('end', () => clearTimeout(timeout));
  });
}

module.exports = router;