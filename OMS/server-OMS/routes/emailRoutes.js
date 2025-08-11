const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const EmailCredentialService = require('../services/emailCredentialService');
const { authenticate } = require('../middlewares/authMiddleware');

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

    console.log(`📤 Fetching sent emails for: ${credentials.smtpEmail}`);

    // Try different possible folder names for sent emails
    const sentFolders = ['SENT', 'Sent', 'Sent Items', 'Sent Mail', 'INBOX.Sent', 'Sent Messages'];
    let emails = [];
    let foundFolder = null;
    
    for (const folder of sentFolders) {
      try {
        console.log(`📂 Trying to fetch sent emails from folder: ${folder}`);
        emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder);
        if (emails.length > 0) {
          console.log(`✅ Found ${emails.length} sent emails in folder: ${folder}`);
          foundFolder = folder;
          break;
        } else {
          console.log(`📭 No emails found in folder: ${folder}`);
        }
      } catch (error) {
        console.log(`❌ Failed to access sent folder ${folder}: ${error.message}`);
        if (folder === sentFolders[sentFolders.length - 1]) {
          // Last folder attempt
          if (emails.length === 0) {
            console.log('📭 No sent emails found in any folder');
          }
        }
        continue;
      }
    }
    
    // Add metadata to emails
    const sentEmails = emails.map(email => ({
      ...email,
      folder: foundFolder,
      type: 'sent'
    }));
    
    res.json({ 
      emails: sentEmails,
      folder: foundFolder,
      totalFound: sentEmails.length 
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Fetch user's drafts (from MongoDB - locally saved drafts)
router.get('/drafts', authenticate, async (req, res) => {
  try {
    const Draft = require('../models/Draft');
    
    // Fetch drafts from MongoDB for this user
    const drafts = await Draft.find({ 
      userId: req.user.id || req.user._id 
    }).sort({ date: -1 }); // Sort by most recent first
    
    // Convert MongoDB drafts to email format for consistency
    const emails = drafts.map(draft => ({
      from: 'Draft', // Indicate this is a local draft
      to: draft.to || '',
      cc: draft.cc || '',
      bcc: draft.bcc || '',
      subject: draft.subject || 'No Subject',
      body: draft.body || '',
      date: draft.date,
      messageId: draft._id.toString(),
      isDraft: true, // Flag to identify as draft
      draftId: draft._id.toString()
    }));
    
    res.json({ emails });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: error.message, emails: [] });
  }
});

// Fetch user's IMAP drafts (from email server)
router.get('/imap-drafts', authenticate, async (req, res) => {
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
        console.log(`🗂️ Trying to fetch drafts from folder: ${folder}`);
        emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder);
        if (emails.length > 0) {
          console.log(`✅ Found ${emails.length} drafts in folder: ${folder}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed to access folder ${folder}: ${error.message}`);
        if (folder === draftFolders[draftFolders.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    
    // Add flag to distinguish IMAP drafts
    const imapDrafts = emails.map(email => ({
      ...email,
      isImapDraft: true,
      source: 'imap'
    }));
    
    res.json({ emails: imapDrafts });
  } catch (error) {
    console.error('Error fetching IMAP drafts:', error);
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
    
    // Validation
    if (!to && !cc && !bcc && !subject && !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Draft is empty. Please provide at least some content.' 
      });
    }
    
    console.log('💾 Saving draft for user:', req.user.id || req.user._id);
    
    const newDraft = new Draft({
      userId: req.user.id || req.user._id,
      to: to || '',
      cc: cc || '',
      bcc: bcc || '',
      subject: subject || '',
      body: body || '',
      date: new Date()
    });

    const savedDraft = await newDraft.save();
    console.log('✅ Draft saved successfully with ID:', savedDraft._id);
    
    res.json({ 
      success: true, 
      message: 'Draft saved successfully!', 
      draft: savedDraft 
    });
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save draft: ' + error.message 
    });
  }
});

// Delete draft
router.delete('/drafts/:draftId', authenticate, async (req, res) => {
  try {
    const { draftId } = req.params;
    const Draft = require('../models/Draft');
    
    console.log('🗑️ Deleting draft:', draftId, 'for user:', req.user.id || req.user._id);
    
    const deletedDraft = await Draft.findOneAndDelete({
      _id: draftId,
      userId: req.user.id || req.user._id
    });
    
    if (!deletedDraft) {
      return res.status(404).json({ 
        success: false, 
        message: 'Draft not found or unauthorized' 
      });
    }
    
    console.log('✅ Draft deleted successfully');
    res.json({ 
      success: true, 
      message: 'Draft deleted successfully!' 
    });
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete draft: ' + error.message 
    });
  }
});

// Combined drafts endpoint (local + IMAP drafts)
router.get('/all-drafts', authenticate, async (req, res) => {
  try {
    const Draft = require('../models/Draft');
    
    // Get local drafts from MongoDB
    const localDrafts = await Draft.find({ 
      userId: req.user.id || req.user._id 
    }).sort({ date: -1 });
    
    const localDraftEmails = localDrafts.map(draft => ({
      from: 'Local Draft',
      to: draft.to || '',
      cc: draft.cc || '',
      bcc: draft.bcc || '',
      subject: draft.subject || 'No Subject',
      body: draft.body || '',
      date: draft.date,
      messageId: draft._id.toString(),
      isDraft: true,
      isLocal: true,
      draftId: draft._id.toString()
    }));
    
    // Try to get IMAP drafts
    let imapDrafts = [];
    try {
      const credentials = await EmailCredentialService.getEmailCredentials(req.user.id || req.user._id);
      
      if (credentials.configured) {
        const draftFolders = ['DRAFTS', 'Drafts', 'Draft', 'INBOX.Drafts'];
        
        for (const folder of draftFolders) {
          try {
            const emails = await fetchImapEmails(credentials.smtpEmail, credentials.smtpPassword, folder);
            if (emails.length > 0) {
              imapDrafts = emails.map(email => ({
                ...email,
                isDraft: true,
                isLocal: false,
                source: 'imap'
              }));
              break;
            }
          } catch (error) {
            console.log(`Could not access IMAP folder ${folder}`);
            continue;
          }
        }
      }
    } catch (error) {
      console.log('IMAP drafts not available:', error.message);
    }
    
    // Combine and sort all drafts
    const allDrafts = [...localDraftEmails, ...imapDrafts]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ 
      emails: allDrafts,
      localCount: localDraftEmails.length,
      imapCount: imapDrafts.length,
      totalCount: allDrafts.length
    });
  } catch (error) {
    console.error('Error fetching all drafts:', error);
    res.status(500).json({ message: error.message, emails: [] });
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
          console.error('❌ IMAP test - failed to open inbox:', err.message);
          resolve({ success: false, message: 'Failed to access inbox: ' + err.message });
        } else {
          console.log('✅ IMAP test successful - inbox accessible');
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
      // Get or create IMAP connection
      imap = await getImapConnection(email, password);
    } catch (connectionError) {
      console.error('Failed to get IMAP connection:', connectionError.message);
      return reject(connectionError);
    }

    // Set up operation timeout
    const operationTimeout = setTimeout(() => {
      console.log('⏰ IMAP operation timeout');
      resolve([]); // Return empty array instead of rejecting
    }, 30000);

    imap.openBox(folder, true, (err, box) => {
      if (err) {
        clearTimeout(operationTimeout);
        console.error(`❌ Error opening ${folder}:`, err.message);
        return reject(new Error(`Failed to open ${folder}: ${err.message}`));
      }

      console.log(`📂 Opened ${folder} successfully`);
      console.log(`📊 Total messages: ${box.messages.total}`);

      if (box.messages.total === 0) {
        clearTimeout(operationTimeout);
        console.log('📭 No messages found in folder');
        return resolve([]);
      }

      const fetchLimit = Math.min(limit, box.messages.total);
      const start = Math.max(1, box.messages.total - fetchLimit + 1);
      
      console.log(`📥 Fetching messages ${start} to ${box.messages.total}`);
      
      const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
        bodies: '',
        struct: true
      });

      const emails = [];
      let parsingPromises = [];
      let processedCount = 0;
      let expectedCount = fetchLimit;

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
        console.error('❌ Fetch error:', err.message);
        reject(new Error('Failed to fetch emails: ' + err.message));
      });

      fetch.once('end', async () => {
        clearTimeout(operationTimeout);
        console.log(`✅ Fetch completed. Processing ${processedCount} messages`);
        
        try {
          // Wait for all parsing to complete with a timeout
          await Promise.race([
            Promise.all(parsingPromises),
            new Promise(resolve => setTimeout(resolve, 15000)) // 15 second parsing timeout
          ]);
          
          emails.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log(`� Successfully processed ${emails.length} emails`);
          resolve(emails);
        } catch (processingError) {
          console.error('Error processing emails:', processingError);
          resolve(emails); // Return what we have
        }
      });
    });
  });
}

// Cleanup connections route (for debugging/admin use)
router.post('/cleanup-connections', authenticate, async (req, res) => {
  try {
    const userEmail = req.body.email;
    const userKey = userEmail || `${req.user.email}`;
    
    if (userEmail) {
      cleanupUserConnections(userKey);
    } else {
      cleanupAllConnections();
    }
    
    res.json({ 
      success: true, 
      message: userEmail ? `Connections cleaned up for ${userEmail}` : 'All connections cleaned up',
      activeConnections: connectionPool.size
    });
  } catch (error) {
    console.error('Error cleaning up connections:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get connection status route (for debugging)
router.get('/connection-status', authenticate, async (req, res) => {
  try {
    const activeConnections = [];
    for (const [userKey, connectionData] of connectionPool.entries()) {
      activeConnections.push({
        user: userKey,
        server: connectionData.server,
        lastUsed: new Date(connectionData.lastUsed).toISOString(),
        state: connectionData.connection.state
      });
    }
    
    res.json({ 
      success: true, 
      activeConnections: connectionPool.size,
      connections: activeConnections
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  console.log(`🧹 Periodic cleanup - Active connections: ${connectionPool.size}`);
  
  // Close idle connections older than CONNECTION_TIMEOUT
  for (const [userKey, connectionData] of connectionPool.entries()) {
    try {
      if (connectionData.connection.state !== 'authenticated' || 
          (now - connectionData.lastUsed) > CONNECTION_TIMEOUT) {
        console.log(`🧹 Removing inactive/old connection for ${userKey}`);
        connectionData.connection.end();
        connectionPool.delete(userKey);
        cleanedCount++;
      }
    } catch (err) {
      console.log(`Error during cleanup for ${userKey}:`, err.message);
      connectionPool.delete(userKey);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} connections. Remaining: ${connectionPool.size}`);
  }
}, 5 * 60 * 1000); // 5 minutes

// Clean up connections when server shuts down
process.on('SIGINT', () => {
  console.log('🛑 Server shutting down, cleaning up IMAP connections...');
  cleanupAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Server terminating, cleaning up IMAP connections...');
  cleanupAllConnections();
  process.exit(0);
});

module.exports = router;
