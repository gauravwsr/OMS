// Test file to debug the import issue
const multer = require('multer');
console.log('Multer:', typeof multer);

try {
  const { upload, uploadToCloudinary } = require('./config/cloudinaryMulterConfig');
  console.log('Upload:', typeof upload);
  console.log('uploadToCloudinary:', typeof uploadToCloudinary);
} catch (error) {
  console.error('Import error:', error.message);
}
