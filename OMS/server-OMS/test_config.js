// Test Cloudinary config directly
try {
  console.log('Testing cloudinary config...');
  const config = require('./config/cloudinaryMulterConfig');
  console.log('Config keys:', Object.keys(config));
  console.log('Upload type:', typeof config.upload);
  console.log('uploadToCloudinary type:', typeof config.uploadToCloudinary);
} catch (error) {
  console.error('Error loading config:', error);
}
