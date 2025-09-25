const axios = require('axios');

async function testEmailConfig() {
  try {
    // Test with invalid/missing token
    console.log('Testing with no token...');
    const noTokenResponse = await axios.post('http://localhost:5001/api/emails/configure', {
      email: 'test@example.com',
      password: 'testpass',
      testOnly: true
    });
    console.log('No token response:', noTokenResponse.data);
  } catch (error) {
    console.log('No token error:', error.response?.status, error.response?.data);
  }

  try {
    // Test with invalid token
    console.log('\nTesting with invalid token...');
    const invalidTokenResponse = await axios.post('http://localhost:5001/api/emails/configure', {
      email: 'test@example.com',
      password: 'testpass',
      testOnly: true
    }, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Invalid token response:', invalidTokenResponse.data);
  } catch (error) {
    console.log('Invalid token error:', error.response?.status, error.response?.data);
  }

  try {
    // Test with missing required fields
    console.log('\nTesting with missing email...');
    const missingEmailResponse = await axios.post('http://localhost:5001/api/emails/configure', {
      password: 'testpass',
      testOnly: true
    }, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Missing email response:', missingEmailResponse.data);
  } catch (error) {
    console.log('Missing email error:', error.response?.status, error.response?.data);
  }

  try {
    // Test with missing password
    console.log('\nTesting with missing password...');
    const missingPasswordResponse = await axios.post('http://localhost:5001/api/emails/configure', {
      email: 'test@example.com',
      testOnly: true
    }, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Missing password response:', missingPasswordResponse.data);
  } catch (error) {
    console.log('Missing password error:', error.response?.status, error.response?.data);
  }
}

testEmailConfig().catch(console.error);