const axios = require('axios');

// Test extension report submission
async function testExtensionReport() {
  const baseURL = 'http://localhost:5000/api/extension';

  try {
    console.log('Testing extension report submission...');

    // Test data
    const reportData = {
      content: 'This is a test report with offensive content',
      flagReason: 'harassment',
      platform: 'twitter',
      context: {
        pageTitle: 'Test Page',
        elementType: 'comment'
      },
      url: 'https://twitter.com/test/status/123',
      timestamp: new Date().toISOString(),
      detectionConfidence: 0.85
    };

    const headers = {
      'x-extension-id': 'test-extension-123',
      'x-extension-version': '1.0.0',
      'x-user-uuid': 'test-user-uuid-123',
      'Content-Type': 'application/json'
    };

    const response = await axios.post(`${baseURL}/reports`, reportData, { headers });

    console.log('✅ Extension report submitted successfully!');
    console.log('Response:', response.data);

    return response.data;

  } catch (error) {
    console.error('❌ Extension report test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Test extension ping
async function testExtensionPing() {
  const baseURL = 'http://localhost:5000/api/extension';

  try {
    console.log('Testing extension ping...');

    const headers = {
      'x-extension-id': 'test-extension-123',
      'x-extension-version': '1.0.0',
      'x-user-uuid': 'test-user-uuid-123'
    };

    const response = await axios.post(`${baseURL}/ping`, {}, { headers });

    console.log('✅ Extension ping successful!');
    console.log('Response:', response.data);

    return response.data;

  } catch (error) {
    console.error('❌ Extension ping test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    console.log('Starting extension API tests...\n');

    // Test ping first
    await testExtensionPing();
    console.log('');

    // Test report submission
    await testExtensionReport();
    console.log('');

    console.log('🎉 All extension tests passed!');

  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { testExtensionPing, testExtensionReport, runTests };
