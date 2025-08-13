const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const cloudinaryService = require('../services/cloudinaryService');

// Configure Cloudinary credentials
router.post('/configure', authenticate, async (req, res) => {
  try {
    const { cloudName, apiKey, apiSecret } = req.body;
    
    // Validate required fields
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        message: 'Cloud name, API key, and API secret are required'
      });
    }
    
    console.log('🔧 Configuring Cloudinary with credentials:', { cloudName, apiKey: apiKey.substring(0, 8) + '***' });
    
    // Configure Cloudinary
    const configured = cloudinaryService.configureCloudinary(cloudName, apiKey, apiSecret);
    
    if (!configured) {
      return res.status(500).json({
        success: false,
        message: 'Failed to configure Cloudinary'
      });
    }
    
    // Test the connection
    const testResult = await cloudinaryService.testConnection();
    
    if (!testResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are invalid or connection failed',
        error: testResult.error
      });
    }
    
    // Store credentials in environment variables (in production, use a secure method)
    process.env.CLOUDINARY_CLOUD_NAME = cloudName;
    process.env.CLOUDINARY_API_KEY = apiKey;
    process.env.CLOUDINARY_API_SECRET = apiSecret;
    
    console.log('✅ Cloudinary configured and tested successfully');
    
    res.json({
      success: true,
      message: 'Cloudinary configured successfully',
      cloudName: cloudName,
      testResult: testResult.result
    });
    
  } catch (error) {
    console.error('❌ Error configuring Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test Cloudinary connection
router.get('/test', authenticate, async (req, res) => {
  try {
    const testResult = await cloudinaryService.testConnection();
    res.json(testResult);
  } catch (error) {
    console.error('❌ Error testing Cloudinary connection:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing connection',
      error: error.message
    });
  }
});

// Get storage usage statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await cloudinaryService.getStorageStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error getting Cloudinary stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving storage statistics',
      error: error.message
    });
  }
});

// Upload test file
router.post('/upload-test', authenticate, async (req, res) => {
  try {
    // Create a simple test file buffer
    const testContent = `Test file uploaded at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    const result = await cloudinaryService.uploadToCloudinary(
      testBuffer,
      `test_${Date.now()}.txt`,
      'test-uploads'
    );
    
    res.json({
      success: true,
      message: 'Test file uploaded successfully',
      file: result
    });
    
  } catch (error) {
    console.error('❌ Error uploading test file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading test file',
      error: error.message
    });
  }
});

// List files in a folder
router.get('/files/:folder?', authenticate, async (req, res) => {
  try {
    const folder = req.params.folder || 'email-attachments';
    const maxResults = parseInt(req.query.limit) || 100;
    
    const files = await cloudinaryService.listFilesInFolder(folder, maxResults);
    
    res.json({
      success: true,
      folder: folder,
      count: files.length,
      files: files
    });
    
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing files',
      error: error.message
    });
  }
});

// Delete file by public_id
router.delete('/file/:publicId', authenticate, async (req, res) => {
  try {
    const publicId = req.params.publicId;
    const resourceType = req.query.type || 'auto';
    
    const result = await cloudinaryService.deleteFromCloudinary(publicId, resourceType);
    
    res.json({
      success: result.success,
      message: result.message,
      public_id: publicId
    });
    
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Check if Cloudinary is configured
router.get('/status', authenticate, async (req, res) => {
  try {
    const isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (isConfigured) {
      // Test connection if configured
      const testResult = await cloudinaryService.testConnection();
      res.json({
        configured: true,
        connected: testResult.success,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        message: testResult.success ? 'Cloudinary is configured and connected' : 'Cloudinary is configured but connection failed'
      });
    } else {
      res.json({
        configured: false,
        connected: false,
        message: 'Cloudinary is not configured'
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Cloudinary status:', error);
    res.status(500).json({
      configured: false,
      connected: false,
      message: 'Error checking Cloudinary status',
      error: error.message
    });
  }
});

module.exports = router;
