// Test script to verify email configuration endpoint with correct data format
const axios = require('axios');

async function testEmailConfigure() {
  try {
    console.log('🧪 Testing email configuration with correct data format...');
    
    // Test with incorrect format (should fail with 400)
    try {
      const wrongFormatResponse = await axios.post('http://localhost:5001/api/emails/configure', {
        email: 'test@example.com',
        password: 'test123',
        imapHost: 'mail.hostinger.com', // Extra field that backend doesn't expect
        smtpHost: 'smtp.hostinger.com', // Extra field that backend doesn't expect
        testOnly: true
      }, {
        headers: {
          'Authorization': 'Bearer fake-token-for-test'
        }
      });
      console.log('❌ Unexpected success with wrong format:', wrongFormatResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ Status with wrong format:', error.response.status);
        console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Test with correct format (should work - but will fail auth)
    try {
      const correctFormatResponse = await axios.post('http://localhost:5001/api/emails/configure', {
        email: 'test@example.com',
        password: 'test123',
        testOnly: true
      }, {
        headers: {
          'Authorization': 'Bearer fake-token-for-test'
        }
      });
      console.log('❌ Unexpected success with fake token:', correctFormatResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ Status with correct format but fake token:', error.response.status);
        console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Test without auth (should return 401)
    try {
      const noAuthResponse = await axios.post('http://localhost:5001/api/emails/configure', {
        email: 'test@example.com',
        password: 'test123',
        testOnly: true
      });
      console.log('❌ Unexpected success without auth:', noAuthResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('✅ Status without auth:', error.response.status);
        console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testEmailConfigure();