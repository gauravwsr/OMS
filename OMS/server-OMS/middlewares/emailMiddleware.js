const multer = require('multer');
const path = require('path');

// Configure multer for email attachments
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|csv|xlsx|xls|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

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
  const emails = Array.isArray(to) ? to : [to];
  
  for (const email of emails) {
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: `Invalid email format: ${email}`
      });
    }
  }

  next();
};

// Email rate limiting middleware
const emailRateLimit = (() => {
  const attempts = new Map();
  const RATE_LIMIT = 10; // 10 emails per hour
  const TIME_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  return (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    
    if (!attempts.has(userId)) {
      attempts.set(userId, []);
    }
    
    const userAttempts = attempts.get(userId);
    
    // Remove old attempts outside the time window
    const validAttempts = userAttempts.filter(time => now - time < TIME_WINDOW);
    attempts.set(userId, validAttempts);
    
    if (validAttempts.length >= RATE_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Email sending rate limit exceeded. Please try again later.'
      });
    }
    
    // Add current attempt
    validAttempts.push(now);
    next();
  };
})();

module.exports = {
  uploadAttachments: upload.array('attachments', 10),
  validateEmailData,
  emailRateLimit
};
