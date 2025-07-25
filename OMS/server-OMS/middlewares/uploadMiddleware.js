// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let dest = uploadDir;
    
    // Create subdirectories based on file type
    if (file.fieldname === 'photo') {
      dest = path.join(uploadDir, 'photos');
    } else if (file.fieldname === 'cv') {
      dest = path.join(uploadDir, 'documents');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.candidateId}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo') {
    // Accept only image files for photos
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for photos'), false);
    }
  } else if (file.fieldname === 'cv') {
    // Accept only PDF and DOC files for CVs
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF and DOC files are allowed for CVs'), false);
    }
  }
  
  cb(null, true);
};

// Configure upload settings
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

module.exports = upload;