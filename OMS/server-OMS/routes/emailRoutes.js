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
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
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

// Fetch user's sent emails
router.get('/sent', authenticate, async (req, res) => {
  try {
    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    
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
    const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
    
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
    const { to, cc, bcc, subject, body, attachments } = req.body;
    
    if ((!to || !to.trim()) && (!cc || !cc.trim()) && (!bcc || !bcc.trim())) {
      return res.status(400).json({ message: 'At least one recipient (To, Cc, or Bcc) is required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

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

    const mailOptions = {
      from: credentials.smtpEmail,
      to: parseEmails(to),
      cc: parseEmails(cc),
      bcc: parseEmails(bcc),
      subject: subject,
      html: body,
      attachments: attachments || []
    };

    // Remove undefined fields to avoid nodemailer issues
    if (!mailOptions.to) delete mailOptions.to;
    if (!mailOptions.cc) delete mailOptions.cc;
    if (!mailOptions.bcc) delete mailOptions.bcc;

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
    const { to, cc, bcc, subject, body } = req.body;
    const Draft = require('../models/Draft');
    
    const newDraft = new Draft({
      userId: req.user.id || req.user._id,
      to: to,
      cc: cc,
      bcc: bcc,
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
      host: 'imap.hostinger.com',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.hostinger.com'
      },
      connTimeout: 60000,
      authTimeout: 60000,
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
  console.log('📬 Starting IMAP fetch for folder:', folder);
  console.log('📬 Email:', email);
  console.log('📬 Limit:', limit);
  
  return new Promise((resolve, reject) => {
    // Try different IMAP servers for Hostinger
    const imapServers = [
      'imap.hostinger.com',
      'mail.hostinger.com', 
      'imap.hostinger.in'
    ];
    
    let serverIndex = 0;
    
    function tryConnection() {
      if (serverIndex >= imapServers.length) {
        return reject(new Error('Failed to connect to any IMAP server - please check your internet connection and email credentials'));
      }
      
      const currentServer = imapServers[serverIndex];
      console.log(`🔄 Trying IMAP server: ${currentServer} (attempt ${serverIndex + 1}/${imapServers.length})`);
      
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
        connTimeout: 30000, // 30 seconds per attempt
        authTimeout: 30000,
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true
        }
      });

      const emails = [];
      let parsingPromises = [];

      // Set connection timeout for this attempt
      const timeout = setTimeout(() => {
        console.log(`⏰ IMAP connection timeout for ${currentServer}`);
        imap.end();
        serverIndex++;
        tryConnection(); // Try next server
      }, 35000); // 35 seconds

      imap.once('ready', () => {
        console.log(`✅ IMAP connection ready with ${currentServer}`);
        clearTimeout(timeout);
        
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            console.error(`❌ Error opening ${folder}:`, err.message);
            return reject(new Error(`Failed to open ${folder}: ${err.message}`));
          }

          console.log(`📂 Opened ${folder} successfully`);
          console.log(`📊 Total messages: ${box.messages.total}`);

          if (box.messages.total === 0) {
            console.log('📭 No messages found in folder');
            imap.end();
            return resolve([]);
          }

          const fetchLimit = Math.min(limit, box.messages.total);
          const start = Math.max(1, box.messages.total - fetchLimit + 1);
          
          console.log(`📥 Fetching messages ${start} to ${box.messages.total}`);
          
          const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            let parsePromise = new Promise((resolveMsg) => {
              msg.on('body', (stream, info) => {
                simpleParser(stream)
                  .then(parsed => {
                    emails.push({
                      from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown',
                      to: parsed.to?.text || parsed.to?.value?.[0]?.address || 'Unknown',
                      subject: parsed.subject || 'No Subject',
                      date: parsed.date || new Date(),
                      body: parsed.html || parsed.textAsHtml || parsed.text || '',
                      messageId: parsed.messageId,
                      seqno: seqno
                    });
                    resolveMsg();
                  })
                  .catch(err => {
                    console.error('Parse error for message', seqno, ':', err.message);
                    resolveMsg(); // Skip on error
                  });
              });
            });
            parsingPromises.push(parsePromise);
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err.message);
            imap.end();
            reject(new Error('Failed to fetch emails: ' + err.message));
          });

          fetch.once('end', async () => {
            console.log(`✅ Fetch completed. Got ${emails.length} emails`);
            await Promise.all(parsingPromises);
            imap.end();
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(emails);
          });
        });
      });

      imap.once('error', (err) => {
        console.error(`❌ IMAP connection error with ${currentServer}:`, err.message);
        clearTimeout(timeout);
        
        // Try next server if this one fails
        serverIndex++;
        if (serverIndex < imapServers.length) {
          console.log(`🔄 Trying next IMAP server...`);
          setTimeout(tryConnection, 1000); // Wait 1 second before trying next server
        } else {
          let errorMessage = 'Failed to connect to email server';
          
          if (err.message.includes('Invalid credentials') || err.message.includes('AUTHENTICATIONFAILED')) {
            errorMessage = 'Invalid email credentials - please check your email and password';
          } else if (err.message.includes('Timed out') || err.message.includes('timeout')) {
            errorMessage = 'Connection timeout - please check your internet connection';
          } else if (err.message.includes('connect ENOTFOUND')) {
            errorMessage = 'Cannot connect to email server - please check your internet connection';
          }
          
          reject(new Error(errorMessage));
        }
      });

      imap.once('end', () => {
        console.log(`📝 IMAP connection ended with ${currentServer}`);
        clearTimeout(timeout);
      });

      console.log(`🚀 Connecting to IMAP server: ${currentServer}...`);
      
      try {
        imap.connect();
      } catch (connectError) {
        console.error(`❌ Failed to initiate IMAP connection with ${currentServer}:`, connectError.message);
        clearTimeout(timeout);
        serverIndex++;
        if (serverIndex < imapServers.length) {
          tryConnection();
        } else {
          reject(new Error('Failed to connect to email server: ' + connectError.message));
        }
      }
    }
    
    // Start trying connections
    tryConnection();
  });
}

module.exports = router;
