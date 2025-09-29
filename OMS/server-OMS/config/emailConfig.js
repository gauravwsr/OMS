const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

class HostingerEmailService {
  constructor(userEmail = null, userPassword = null) {
    // If user credentials provided, use them; otherwise use default
    this.smtpConfig = {
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: userEmail || process.env.SMTP_USER,
        pass: userPassword || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    this.imapConfig = {
      host: 'imap.hostinger.com',
      port: 993,
      tls: true,
      user: userEmail || process.env.IMAP_USER,
      password: userPassword || process.env.IMAP_PASS,
    };

    this.transporter = null;
    this.imapConnection = null;
  }

  // Initialize SMTP transporter
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport(this.smtpConfig);
      await this.transporter.verify();
      return true;
    } catch (error) {
      throw new Error(`SMTP initialization failed: ${error.message}`);
    }
  }

  // Send email
  async sendEmail(emailData) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: emailData.from || this.smtpConfig.auth.user,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments || []
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Check and ensure IMAP connection is ready
  async ensureImapConnection() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.imapConnection) {
          console.log('IMAP connection not initialized, initializing...');
          await this.initializeImap();
          resolve();
          return;
        }

        // Check if connection is in a ready state
        if (this.imapConnection.state === 'authenticated' || this.imapConnection.state === 'selected') {
          resolve();
          return;
        }

        // If connection exists but not ready, try to reconnect
        console.log('IMAP connection exists but not ready, reconnecting...');
        this.imapConnection.end();
        this.imapConnection = null;
        await this.initializeImap();
        resolve();
      } catch (error) {
        reject(new Error(`Failed to ensure IMAP connection: ${error.message}`));
      }
    });
  }

  // Fetch emails from specified folder
  async fetchEmails(options = {}) {
    const {
      folder = 'INBOX',
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    return new Promise(async (resolve, reject) => {
      try {
        // Ensure IMAP connection is ready
        await this.ensureImapConnection();

        this.imapConnection.openBox(folder, true, (err, box) => {
          if (err) {
            reject(new Error(`Failed to open folder ${folder}: ${err.message}`));
            return;
          }

          // Calculate range for fetching
          const total = box.messages.total;
          console.log(`Mailbox info - total: ${total}, new: ${box.messages.new}, unseen: ${box.messages.unseen}`);

          if (total === 0) {
            console.log(`No messages in ${folder}`);
            resolve([]);
            return;
          }

          // Additional validation for total count
          if (total < 0 || !Number.isInteger(total)) {
            reject(new Error(`Invalid total message count: ${total}`));
            return;
          }

          // Ensure we don't request more messages than available
          const actualLimit = Math.min(limit, total);
          const start = Math.max(1, total - actualLimit + 1);
          const end = total;

          // Validate the range
          if (start > end || start < 1 || end < 1) {
            reject(new Error(`Invalid message range: ${start}:${end} (total: ${total})`));
            return;
          }

          const fetchRange = `${start}:${end}`;
          console.log(`📬 Fetching emails from ${folder}: range ${fetchRange} (total: ${total})`);
          
          const fetch = this.imapConnection.seq.fetch(fetchRange, {
            bodies: ['HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE)', 'TEXT'],
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg, seqno) => {
            const email = { uid: seqno, seqno };
            
            msg.on('body', (stream, info) => {
              let buffer = '';
              
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', () => {
                if (info.which === 'TEXT') {
                  email.text = buffer;
                } else {
                  // Parse header
                  const header = Imap.parseHeader(buffer);
                  email.from = header.from?.[0] || '';
                  email.to = header.to || [];
                  email.cc = header.cc || [];
                  email.bcc = header.bcc || [];
                  email.subject = header.subject?.[0] || '';
                  email.date = header.date?.[0] || new Date();
                }
              });
            });

            msg.once('attributes', (attrs) => {
              email.uid = attrs.uid;
              email.flags = attrs.flags;
              email.size = attrs.size;
            });

            msg.once('end', () => {
              emails.push(email);
            });
          });

          fetch.once('error', (err) => {
            console.error('IMAP fetch error:', err.message);

            // Handle specific IMAP errors
            if (err.message.includes('Invalid messageset')) {
              console.warn('Invalid messageset detected, attempting to fetch individual messages...');

              // Fallback: try to fetch the most recent message individually
              if (total > 0) {
                const singleFetch = this.imapConnection.seq.fetch(total, {
                  bodies: ['HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE)', 'TEXT'],
                  struct: true
                });

                const fallbackEmails = [];

                singleFetch.on('message', (msg, seqno) => {
                  const email = { uid: seqno, seqno };

                  msg.on('body', (stream, info) => {
                    let buffer = '';
                    stream.on('data', (chunk) => {
                      buffer += chunk.toString('utf8');
                    });
                    stream.once('end', () => {
                      if (info.which === 'TEXT') {
                        email.text = buffer;
                      } else {
                        const header = Imap.parseHeader(buffer);
                        email.from = header.from?.[0] || '';
                        email.to = header.to || [];
                        email.cc = header.cc || [];
                        email.bcc = header.bcc || [];
                        email.subject = header.subject?.[0] || '';
                        email.date = header.date?.[0] || new Date();
                      }
                    });
                  });

                  msg.once('attributes', (attrs) => {
                    email.uid = attrs.uid;
                    email.flags = attrs.flags;
                    email.size = attrs.size;
                  });

                  msg.once('end', () => {
                    fallbackEmails.push(email);
                  });
                });

                singleFetch.once('error', (fallbackErr) => {
                  reject(new Error(`IMAP fetch failed even with fallback: ${fallbackErr.message}`));
                });

                singleFetch.once('end', () => {
                  console.log(`Fetched ${fallbackEmails.length} email(s) using fallback method`);
                  resolve(fallbackEmails);
                });
              } else {
                resolve([]);
              }
            } else {
              reject(new Error(`Fetch error: ${err.message}`));
            }
          });

          fetch.once('end', () => {
            // Sort emails
            emails.sort((a, b) => {
              const aVal = a[sortBy] || a.date;
              const bVal = b[sortBy] || b.date;
              
              if (sortOrder === 'desc') {
                return new Date(bVal) - new Date(aVal);
              } else {
                return new Date(aVal) - new Date(bVal);
              }
            });

            resolve(emails);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Fetch specific email content by UID
  async fetchEmailContent(uid, folder = 'INBOX') {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.imapConnection) {
          await this.initializeImap();
        }

        this.imapConnection.openBox(folder, true, (err, box) => {
          if (err) {
            reject(new Error(`Failed to open folder ${folder}: ${err.message}`));
            return;
          }

          const fetch = this.imapConnection.fetch(uid, {
            bodies: '',
            struct: true
          });

          let emailContent = '';

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              let buffer = '';
              
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  emailContent = parsed.html || parsed.textAsHtml || parsed.text || '';
                } catch (parseErr) {
                  emailContent = buffer;
                }
              });
            });
          });

          fetch.once('error', (err) => {
            reject(new Error(`Fetch error: ${err.message}`));
          });

          fetch.once('end', () => {
            resolve(emailContent);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Close connections
  async closeConnections() {
    try {
      if (this.imapConnection) {
        this.imapConnection.end();
        this.imapConnection = null;
      }
      
      if (this.transporter) {
        this.transporter.close();
        this.transporter = null;
      }
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }

  // Test connection
  async testConnection() {
    try {
      // Test SMTP
      await this.initializeTransporter();
      
      // Test IMAP
      await this.initializeImap();
      
      await this.closeConnections();
      
      return {
        success: true,
        message: 'Connection test successful'
      };
    } catch (error) {
      await this.closeConnections();
      throw error;
    }
  }
}

module.exports = HostingerEmailService;
