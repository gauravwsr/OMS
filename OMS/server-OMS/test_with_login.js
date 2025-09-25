const axios = require('axios');

// First, let's get a valid token by logging in
async function loginAndTestEmail() {
  try {
    // Try to login first to get a valid token
    console.log('Attempting to login...');
    const loginResponse = await axios.post('http://localhost:5001/users/login', {
      email: 'gaurav@tars.co.in',
      password: 'Tars@2001'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, got token');
    
    // Now test email configuration with valid token
    console.log('Testing email configuration with valid token...');
    const emailResponse = await axios.post('http://localhost:5001/api/emails/configure', {
      email: 'test@hostinger.com',
      password: 'testpass123',
      testOnly: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Email config response:', emailResponse.data);
    
  } catch (error) {
    console.log('Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response data:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

loginAndTestEmail().catch(console.error);