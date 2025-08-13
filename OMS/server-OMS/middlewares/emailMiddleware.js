const { upload, uploadToCloudinary } = require('../config/cloudinaryConfig');
const rateLimit = require('express-rate-limit');

// Use Cloudinary multer configuration for attachments
const uploadAttachments = upload.array('attachments', 10);

// Email validation middleware
const validateEmailData = (req, res, next) => {
  const { to, subject } = req.body;

  if (!to || !subject) {
    return res.status(400).json({
      success: false,
      message: 'Recipient email and subject are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Handle multiple email formats (comma-separated, array, etc.)
  const parseEmails = (emailStr) => {
    if (!emailStr) return [];
    if (Array.isArray(emailStr)) return emailStr;
    return emailStr.split(',').map(email => email.trim()).filter(email => email);
  };
  
  const toEmails = parseEmails(to);
  const ccEmails = parseEmails(req.body.cc);
  const bccEmails = parseEmails(req.body.bcc);
  
  const allEmails = [...toEmails, ...ccEmails, ...bccEmails];
  
  for (const email of allEmails) {
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: `Invalid email format: ${email}`
      });
    }
  }

  next();
};

// Rate limiting for email sending
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 email requests per windowMs
  message: {
    success: false,
    message: 'Too many email requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated users with higher limits
  skip: (req, res) => {
    // If user is authenticated and has premium account, allow more emails
    return req.user && req.user.plan === 'premium';
  }
});

// Premium users get higher limits
const premiumEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for premium users
  message: {
    success: false,
    message: 'Email limit reached. Please try again later.',
    retryAfter: '15 minutes'
  }
});

// Middleware to process attachment information
const processAttachments = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    console.log(`📎 Processing ${req.files.length} attachments:`);
    
    req.attachmentInfo = req.files.map((file, index) => {
      const info = {
        originalName: file.originalname,
        fileName: file.filename || `attachment_${Date.now()}_${index}`,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer
      };
      
      // Add Cloudinary info if available
      if (file.cloudinary) {
        info.cloudinary = {
          public_id: file.cloudinary.public_id,
          secure_url: file.cloudinary.secure_url,
          resource_type: file.cloudinary.resource_type,
          format: file.cloudinary.format,
          bytes: file.cloudinary.bytes,
          created_at: file.cloudinary.created_at
        };
      }
      
      console.log(`  📄 ${info.originalName} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
      return info;
    });
    
    // Store total attachment size
    req.totalAttachmentSize = req.files.reduce((total, file) => total + file.size, 0);
    console.log(`📎 Total attachment size: ${(req.totalAttachmentSize / 1024 / 1024).toFixed(2)} MB`);
  } else {
    req.attachmentInfo = [];
    req.totalAttachmentSize = 0;
  }
  
  next();
};

// Middleware to sanitize email content
const sanitizeEmailContent = (req, res, next) => {
  if (req.body.body) {
    // Basic HTML sanitization (in production, use a proper library like DOMPurify)
    req.body.body = req.body.body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
  }
  next();
};

// Middleware to log email activities
const logEmailActivity = (req, res, next) => {
  const userId = req.user ? (req.user.id || req.user._id) : 'anonymous';
  const { to, subject } = req.body;
  const attachmentCount = req.files ? req.files.length : 0;
  
  console.log(`📧 Email Activity - User: ${userId}, To: ${to}, Subject: ${subject}, Attachments: ${attachmentCount}`);
  next();
};

module.exports = {
  uploadAttachments,
  uploadToCloudinary,
  validateEmailData,
  emailRateLimit,
  premiumEmailRateLimit,
  processAttachments,
  sanitizeEmailContent,
  logEmailActivity
};
