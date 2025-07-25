const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');

// Ensure uploads directory exists
const uploadDirectory = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Define allowed file types
const allowedFileTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const ext = allowedFileTypes[file.mimetype] || 'bin';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (allowedFileTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Only ${Object.keys(allowedFileTypes).join(', ')} are allowed.`, 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  }
});

// Custom error handler middleware
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large. Maximum 5MB allowed.', 413));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum 5 files allowed.', 413));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field in file upload.', 400));
    }
    return next(new AppError(err.message, 400));
  } else if (err) {
    // An unknown error occurred when uploading
    return next(err);
  }
  // No errors, proceed to next middleware
  next();
};

// Helper function to clean up uploaded files on error
const cleanUpUploads = (files) => {
  if (files && files.length > 0) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    });
  }
};

module.exports = {
  single: (fieldName) => [upload.single(fieldName), handleMulterErrors],
  array: (fieldName, maxCount) => [upload.array(fieldName, maxCount), handleMulterErrors],
  fields: (fields) => [upload.fields(fields), handleMulterErrors],
  none: () => [upload.none(), handleMulterErrors],
  cleanUpUploads
};