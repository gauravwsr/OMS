// Simple test script to debug email configuration endpoint
const axios = require('axios');

async function testEmailEndpoint() {
  try {
    console.log('🧪 Testing email configuration endpoint...');
    
    // Test without authentication first (should return 401)
    try {
      const response = await axios.post('http://146.190.165.62:5001/api/emails/configure', {
        smtpEmail: 'test@example.com',
        smtpPassword: 'test123',
        testOnly: true
      });
      console.log('❌ Unexpected success without auth:', response.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ Status without auth:', error.response.status);
        console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('❌ No response received:', error.message);
      } else {
        console.log('❌ Request error:', error.message);
      }
    }

    // Test health endpoint
    try {
      const healthResponse = await axios.get('http://146.190.165.62:5001/api/health');
      console.log('✅ Health check successful:', healthResponse.data.status);
    } catch (error) {
      if (error.response) {
        console.log('❌ Health check failed. Status:', error.response.status);
        console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Health check error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testEmailEndpoint();
