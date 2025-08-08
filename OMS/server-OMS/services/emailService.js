const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');

class EmailService {
  constructor() {
    this.transporter = null;
    this.imapClient = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Only initialize if SMTP credentials are available
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });
    }
  }

  initializeIMAPClient() {
    if (process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS) {
      this.imapClient = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT || 993,
        tls: true,
        timeout: 30000,
        authTimeout: 30000,
      });

      this.imapClient.on('error', (err) => {
        console.error('IMAP error:', err.message);
      });

      this.imapClient.on('end', () => {
        console.log('IMAP connection ended.');
      });
    }
  }

  async sendEmail(emailData) {
    try {
      if (!this.transporter) {
        throw new Error('SMTP configuration not available');
      }

      const mailOptions = {
        from: emailData.from || process.env.SMTP_USER,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body || emailData.text,
        html: emailData.html,
        attachments: emailData.attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        info: info
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async fetchInboxEmails() {
    return new Promise((resolve, reject) => {
      if (!this.imapClient) {
        this.initializeIMAPClient();
        if (!this.imapClient) {
          return resolve({
            success: true,
            emails: [],
            message: 'IMAP not configured'
          });
        }
      }

      const emails = [];
      const operationTimeout = setTimeout(() => {
        reject(new Error("IMAP operation timed out"));
      }, 15000);

      this.imapClient.once('ready', () => {
        clearTimeout(operationTimeout);
        
        this.imapClient.openBox('INBOX', true, (err, box) => {
          if (err) {
            return reject(new Error(`Error opening INBOX: ${err.message}`));
          }

          this.imapClient.search(['ALL'], (err, results) => {
            if (err) {
              return reject(new Error(`Error searching emails: ${err.message}`));
            }

            if (results.length === 0) {
              return resolve({
                success: true,
                emails: [],
                message: 'No emails found'
              });
            }

            const fetcher = this.imapClient.fetch(results.slice(-10).reverse(), { bodies: '' });

            fetcher.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err.message);
                    return;
                  }

                  if (parsed?.from?.text && parsed.subject && parsed.date) {
                    emails.push({
                      from: parsed.from.text,
                      subject: parsed.subject,
                      date: parsed.date,
                      body: parsed.text || parsed.html,
                      messageId: parsed.messageId
                    });
                  }
                });
              });
            });

            fetcher.once('end', () => {
              emails.sort((a, b) => new Date(b.date) - new Date(a.date));
              resolve({
                success: true,
                emails: emails
              });
            });

            fetcher.once('error', (err) => {
              reject(new Error(`Error fetching emails: ${err.message}`));
            });
          });
        });
      });

      this.imapClient.once('error', (err) => {
        clearTimeout(operationTimeout);
        reject(new Error(`IMAP connection error: ${err.message}`));
      });

      if (this.imapClient.state !== 'authenticated') {
        this.imapClient.connect();
      }
    });
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        return {
          success: false,
          message: 'SMTP not configured'
        };
      }

      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified'
      };
    } catch (error) {
      return {
        success: false,
        message: `SMTP connection failed: ${error.message}`
      };
    }
  }
}

module.exports = EmailService;
