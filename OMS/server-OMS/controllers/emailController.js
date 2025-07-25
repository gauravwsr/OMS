// const multer = require('multer');
// const fs = require('fs');
// const nodemailer = require('nodemailer');
// const { simpleParser } = require('mailparser');
// const Imap = require('node-imap');
// const Email = require('../models/Email');
// const Draft = require('../models/Draft');

// // Configure Multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// // Configure Nodemailer
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// // IMAP Configuration
// const imap = new Imap({
//   user: process.env.IMAP_USER,
//   password: process.env.IMAP_PASS,
//   host: process.env.IMAP_HOST,
//   port: process.env.IMAP_PORT,
//   tls: true,
//   timeout: 30000,
//   authTimeout: 30000, // Authentication timeout
// });

// // Function to connect IMAP
// function connectImap() {
//   imap.connect();
// }

// imap.on('error', (err) => {
//   console.error('IMAP error:', err);
//   // Attempt to reconnect after a delay
//   setTimeout(connectImap, 5000);
// });

// imap.on('end', () => {
//   console.log('IMAP connection ended. Reconnecting...');
//   setTimeout(connectImap, 5000);
// });

// // Initial connection
// connectImap();

// // Send Email
// const sendEmail = async (req, res) => {
//   const { email, subject, body } = req.body;
//   const file = req.file;

//   if (!email || !subject || !body) {
//     return res.status(400).send({ message: 'Recipient email, subject, and body are required' });
//   }

//   const mailOptions = {
//     from: process.env.SMTP_USER,
//     to: email,
//     subject: subject,
//     text: body,
//     attachments: file ? [{ filename: file.originalname, path: file.path }] : [],
//   };

//   let newEmail;

//   try {
//     // Save email details to the database with status 'draft'
//     console.log('Saving email details to the database...');
//     newEmail = new Email({
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: subject,
//       body: body,
//       attachments: file ? [file.path] : [],
//       status: 'draft',
//     });
//     await newEmail.save();
//     console.log('Email details saved to the database.');

//     // Send the email
//     console.log('Sending email...');
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully:', info);

//     // Update email status to 'sent' after successful sending
//     newEmail.status = 'sent';
//     await newEmail.save();

//     if (file) {
//       fs.unlink(file.path, (err) => {
//         if (err) console.error('Error deleting uploaded file:', err);
//       });
//     }

//     res.status(200).send({ message: 'Email sent successfully!', info });
//   } catch (error) {
//     console.error('Error sending email:', error);

//     // Update email status to 'draft' if sending fails
//     if (newEmail) {
//       await Email.findByIdAndUpdate(newEmail._id, { status: 'draft' });
//     }

//     res.status(500).send({ message: 'Error sending email', error: error.message });
//   }
// };

// // Fetch Drafts
// const fetchDrafts = async (req, res) => {
//   try {
//     const drafts = await Draft.find();
//     res.status(200).json(drafts);
//   } catch (err) {
//     console.error("Error fetching drafts:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Fetch Sent Emails
// const fetchSentEmails = async (req, res) => {
//   try {
//     const sentEmails = await Email.find({ status: 'sent' }).sort({ date: -1 });
//     res.status(200).send({ emails: sentEmails });
//   } catch (err) {
//     console.error('Error fetching sent emails:', err);
//     res.status(500).send({ message: 'Error fetching sent emails', error: err.message });
//   }
// };

// // Fetch Inbox Emails
// const fetchInboxEmails = async (req, res) => {
//   const emails = [];

//   try {
//     await new Promise((resolve, reject) => {
//       imap.once('ready', () => {
//         const folderToOpen = 'INBOX';

//         imap.openBox(folderToOpen, true, (err, box) => {
//           if (err) return reject(new Error(`Error opening folder '${folderToOpen}': ${err.message}`));

//           imap.search(['ALL'], (err, results) => {
//             if (err) return reject(new Error(`Error searching emails: ${err.message}`));

//             if (results.length === 0) {
//               console.log(`No emails found in folder '${folderToOpen}'.`);
//               return resolve();
//             }

//             const fetcher = imap.fetch(results.reverse(), { bodies: '' });

//             fetcher.on('message', (msg) => {
//               msg.on('body', (stream) => {
//                 simpleParser(stream, (err, parsed) => {
//                   if (err) return console.error('Error parsing email:', err.message);

//                   if (parsed?.from?.text && parsed.subject && parsed.date) {
//                     emails.push({
//                       from: parsed.from.text,
//                       subject: parsed.subject,
//                       date: parsed.date,
//                       body: parsed.text,
//                     });
//                   }
//                 });
//               });
//             });

//             fetcher.once('end', () => {
//               console.log(`Finished fetching emails from folder '${folderToOpen}'.`);
//               resolve();
//             });
//           });
//         });
//       });

//       imap.once('error', (err) => reject(new Error(`IMAP connection error: ${err.message}`)));
//       imap.once('end', () => console.log('IMAP connection closed.'));
//       imap.connect();
//     });

//     emails.sort((a, b) => new Date(b.date) - new Date(a.date));
//     res.status(200).send({ emails });
//   } catch (err) {
//     console.error('Error fetching inbox emails:', err);
//     res.status(500).send({ message: 'Error fetching inbox emails', error: err.message });
//   }
// };

// const ImapConnection = {
//   imap: null,
//   reconnectAttempts: 0,
//   maxReconnectAttempts: 5,
//   reconnectInterval: 5000,

//   init() {
//     this.imap = new Imap({
//       user: process.env.IMAP_USER,
//       password: process.env.IMAP_PASS,
//       host: process.env.IMAP_HOST,
//       port: process.env.IMAP_PORT,
//       tls: true,
//       timeout: 30000,
//       authTimeout: 30000,
//       keepalive: true,
//       tlsOptions: { rejectUnauthorized: false }
//     });

//     this.setupListeners();
//   },

//   setupListeners() {
//     this.imap.on('ready', () => {
//       console.log('IMAP connection established');
//       this.reconnectAttempts = 0;
//     });

//     this.imap.on('error', (err) => {
//       console.error('IMAP error:', err);
//       if (err.code === 'ECONNRESET') {
//         this.handleReconnect();
//       }
//     });

//     this.imap.on('end', () => {
//       console.log('IMAP connection ended');
//       this.handleReconnect();
//     });
//   },

//   handleReconnect() {
//     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//       console.error('Max reconnection attempts reached');
//       return;
//     }

//     this.reconnectAttempts++;
//     const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
//     console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts})`);
    
//     setTimeout(() => {
//       console.log('Reconnecting...');
//       this.connect();
//     }, delay);
//   },

//   connect() {
//     if (this.imap) {
//       this.imap.connect();
//     }
//   }
// };

// // Initialize the IMAP connection
// ImapConnection.init();

// // Replace existing imap variable with ImapConnection.imap in all email-related functions 
// module.exports = {
//   sendEmail,
//   fetchDrafts,
//   fetchSentEmails,
//   fetchInboxEmails,
//   upload,
// };