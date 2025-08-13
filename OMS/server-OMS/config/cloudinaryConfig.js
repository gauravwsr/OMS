console.log('Starting cloudinary config...');

require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Modules loaded successfully');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

// Cloudinary upload middleware
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const uploadPromises = req.files.map(async (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'email-attachments',
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                cloudinary: {
                  public_id: result.public_id,
                  secure_url: result.secure_url,
                  url: result.url,
                  format: result.format,
                  bytes: result.bytes,
                  created_at: result.created_at
                }
              });
            }
          }
        );
        
        uploadStream.end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);
    req.cloudinaryFiles = uploadResults;
    
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};

console.log('Configuration complete');

module.exports = {
  upload,
  uploadToCloudinary,
  cloudinary
};

console.log('Export complete');
