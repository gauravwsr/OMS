console.log('Testing import...');
const { upload, uploadToCloudinary } = require('./config/cloudinaryConfig');
console.log('Upload type:', typeof upload);
console.log('uploadToCloudinary type:', typeof uploadToCloudinary);
console.log('Upload.array method:', typeof upload.array);
