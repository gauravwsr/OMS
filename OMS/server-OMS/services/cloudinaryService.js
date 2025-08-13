const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with credentials
const configureCloudinary = (cloudName, apiKey, apiSecret) => {
  try {
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
    } else {
      // Use environment variables if no parameters provided
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
    
    console.log('✅ Cloudinary configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Error configuring Cloudinary:', error);
    return false;
  }
};

// Upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, folder = 'email-attachments') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto', // Automatically detect file type
      public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`, // Safe filename
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ File uploaded to Cloudinary:', result.public_id);
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            original_filename: fileName,
            resource_type: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            created_at: result.created_at,
            folder: result.folder
          });
        }
      }
    ).end(fileBuffer);
  });
};

// Upload multiple files to Cloudinary
const uploadMultipleToCloudinary = async (files, folder = 'email-attachments') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, file.originalname, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${results.length} files to Cloudinary`);
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple files to Cloudinary:', error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    if (result.result === 'ok') {
      console.log('✅ File deleted from Cloudinary:', publicId);
      return { success: true, message: 'File deleted successfully' };
    } else {
      console.warn('⚠️ File may not exist in Cloudinary:', publicId);
      return { success: false, message: 'File not found or already deleted' };
    }
  } catch (error) {
    console.error('❌ Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Delete multiple files from Cloudinary
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => 
      deleteFromCloudinary(publicId)
    );
    
    const results = await Promise.all(deletePromises);
    console.log(`✅ Processed deletion of ${results.length} files from Cloudinary`);
    return results;
  } catch (error) {
    console.error('❌ Error deleting multiple files from Cloudinary:', error);
    throw error;
  }
};

// Get file info from Cloudinary
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto'
    });
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
      folder: result.folder
    };
  } catch (error) {
    console.error('❌ Error getting file info from Cloudinary:', error);
    throw error;
  }
};

// List files in a folder
const listFilesInFolder = async (folder = 'email-attachments', maxResults = 100) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
      resource_type: 'auto'
    });
    
    return result.resources.map(resource => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      resource_type: resource.resource_type,
      format: resource.format,
      bytes: resource.bytes,
      created_at: resource.created_at
    }));
  } catch (error) {
    console.error('❌ Error listing files from Cloudinary:', error);
    throw error;
  }
};

// Generate signed URL for secure access (optional)
const generateSignedUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      resource_type: 'auto',
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    
    const signedUrl = cloudinary.url(publicId, { ...defaultOptions, ...options, sign_url: true });
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw error;
  }
};

// Test Cloudinary connection
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection test successful:', result);
    return { success: true, message: 'Connection successful', result };
  } catch (error) {
    console.error('❌ Cloudinary connection test failed:', error);
    return { success: false, message: 'Connection failed', error: error.message };
  }
};

// Get storage usage statistics
const getStorageStats = async () => {
  try {
    const result = await cloudinary.api.usage();
    return {
      plan: result.plan,
      credits: result.credits,
      bytes_used: result.bytes,
      objects_used: result.objects,
      bandwidth_used: result.bandwidth,
      storage_used: result.storage,
      requests_used: result.requests
    };
  } catch (error) {
    console.error('❌ Error getting Cloudinary storage stats:', error);
    throw error;
  }
};

module.exports = {
  configureCloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getFileInfo,
  listFilesInFolder,
  generateSignedUrl,
  testConnection,
  getStorageStats,
  cloudinary
};
