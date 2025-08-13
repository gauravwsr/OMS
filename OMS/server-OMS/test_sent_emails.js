// Test script for sent email functionality
const express = require('express');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');

// Mock email credentials (replace with actual ones for testing)
const testEmail = 'your-email@example.com';
const testPassword = 'your-password';

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
      
      console.log(`📥 Fetching messages ${start} to ${box.messages.total}`);
      
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

// Test sent email functionality
async function testSentEmails() {
  console.log('🧪 Testing sent email functionality...\n');
  
  if (testEmail === 'your-email@example.com') {
    console.log('❌ Please update testEmail and testPassword with actual credentials');
    return;
  }

  try {
    console.log(`📤 Fetching sent emails for: ${testEmail}`);

    // Try different possible folder names for sent emails
    const sentFolders = ['SENT', 'Sent', 'Sent Items', 'Sent Mail', 'INBOX.Sent', 'Sent Messages'];
    let emails = [];
    let foundFolder = null;
    
    for (const folder of sentFolders) {
      try {
        console.log(`🔍 Trying to fetch sent emails from folder: ${folder}`);
        emails = await fetchImapEmails(testEmail, testPassword, folder, 5); // Limit to 5 for testing
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
            console.log('No sent emails found in any folder');
          }
        }
        continue;
      }
    }
    
    // Display results
    if (emails.length > 0) {
      console.log('\n📧 Sent Emails Found:');
      emails.forEach((email, index) => {
        console.log(`\n${index + 1}. Subject: ${email.subject}`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to}`);
        console.log(`   Date: ${email.date}`);
        console.log(`   Message ID: ${email.messageId}`);
      });
    } else {
      console.log('\n📭 No sent emails found in any folder');
    }

    console.log(`\n✅ Test completed. Found folder: ${foundFolder}, Total emails: ${emails.length}`);

  } catch (error) {
    console.error('\n❌ Error testing sent emails:', error.message);
  } finally {
    // Clean up connections
    cleanupAllConnections();
    process.exit(0);
  }
}

// Run the test if email and password are provided
console.log('🔧 Sent Email Test Script');
console.log('💡 Update testEmail and testPassword variables with your actual credentials to test');
console.log('🚀 Starting test...\n');

testSentEmails();
