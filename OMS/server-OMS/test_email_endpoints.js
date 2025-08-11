const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:5001/api/emails';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function testEmailEndpoints() {
  console.log('🧪 Testing Email Endpoints...\n');

  // Test endpoints
  const endpoints = [
    { method: 'GET', path: '/check-config', description: 'Check email configuration' },
    { method: 'GET', path: '/drafts', description: 'Fetch local drafts' },
    { method: 'GET', path: '/imap-drafts', description: 'Fetch IMAP drafts' },
    { method: 'GET', path: '/all-drafts', description: 'Fetch all drafts' },
    { method: 'GET', path: '/sent', description: 'Fetch sent emails' },
    { method: 'GET', path: '/inbox', description: 'Fetch inbox emails' },
    { method: 'GET', path: '/connection-status', description: 'Check IMAP connection status' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.path}: SUCCESS`);
        console.log(`   Status: ${response.status}`);
        if (data.emails) {
          console.log(`   Emails found: ${data.emails.length}`);
        }
        if (data.activeConnections !== undefined) {
          console.log(`   Active connections: ${data.activeConnections}`);
        }
      } else {
        console.log(`❌ ${endpoint.path}: FAILED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.message}`);
      }
      
    } catch (error) {
      console.log(`💥 ${endpoint.path}: ERROR - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test save draft
  console.log('📝 Testing save draft...');
  try {
    const draftData = {
      to: 'test@example.com',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      subject: 'Test Draft',
      body: 'This is a test draft message.'
    };

    const response = await fetch(`${BASE_URL}/save-draft`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Save draft: SUCCESS');
      console.log(`   Draft ID: ${data.draft?._id}`);
    } else {
      console.log('❌ Save draft: FAILED');
      console.log(`   Error: ${data.message}`);
    }
    
  } catch (error) {
    console.log(`💥 Save draft: ERROR - ${error.message}`);
  }
}

// Run tests
testEmailEndpoints().catch(console.error);
