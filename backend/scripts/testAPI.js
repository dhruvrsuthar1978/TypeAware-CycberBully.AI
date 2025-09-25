const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test state
let userToken = null;
let adminToken = null;
let testReportId = null;
let testUserId = null;

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
const testHealthCheck = async () => {
  try {
    log('\n📊 Testing Health Check...', colors.cyan);
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    
    if (response.status === 200 && response.data.status === 'OK') {
      logSuccess('Health check passed');
      logInfo(`Server uptime: ${Math.round(response.data.uptime)}s`);
      return true;
    } else {
      logError('Health check failed');
      return false;
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    return false;
  }
};

const testUserRegistration = async () => {
  try {
    log('\n👤 Testing User Registration...', colors.cyan);
    
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`
    };

    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.status === 201 && response.data.token) {
      userToken = response.data.token;
      testUserId = response.data.user.id;
      logSuccess('User registration successful');
      logInfo(`User ID: ${testUserId}`);
      logInfo(`Username: ${response.data.user.username}`);
      return true;
    } else {
      logError('User registration failed');
      return false;
    }
  } catch (error) {
    logError(`Registration error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testAdminLogin = async () => {
  try {
    log('\n👨‍💼 Testing Admin Login...', colors.cyan);
    
    const adminCredentials = {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'moderator@typeaware.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'password123'
    };

    const response = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
    
    if (response.status === 200 && response.data.token) {
      adminToken = response.data.token;
      logSuccess('Admin login successful');
      logInfo(`Admin role: ${response.data.user.role}`);
      return true;
    } else {
      logError('Admin login failed');
      return false;
    }
  } catch (error) {
    logError(`Admin login error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testReportSubmission = async () => {
  try {
    log('\n📝 Testing Report Submission...', colors.cyan);
    
    const sampleReport = {
      browserUUID: '550e8400-e29b-41d4-a716-446655440999',
      content: {
        original: 'This is a test abusive message for API testing',
        flaggedTerms: [{
          term: 'abusive',
          positions: [17],
          severity: 'medium'
        }],
        severity: 'medium'
      },
      context: {
        platform: 'twitter',
        url: 'https://twitter.com/test/status/123',
        pageTitle: 'Test Tweet',
        elementType: 'comment'
      },
      classification: {
        category: 'harassment',
        confidence: 0.85,
        detectionMethod: 'user_report'
      },
      metadata: {
        userAgent: 'Test Agent',
        sessionId: 'test_session_123'
      }
    };

    const response = await axios.post(`${BASE_URL}/reports/submit`, sampleReport);
    
    if (response.status === 201 && response.data.reportId) {
      testReportId = response.data.reportId;
      logSuccess('Report submission successful');
      logInfo(`Report ID: ${testReportId}`);
      logInfo(`Status: ${response.data.status}`);
      return true;
    } else {
      logError('Report submission failed');
      return false;
    }
  } catch (error) {
    logError(`Report submission error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testBatchReportSubmission = async () => {
  try {
    log('\n📋 Testing Batch Report Submission...', colors.cyan);
    
    const batchReports = {
      browserUUID: '550e8400-e29b-41d4-a716-446655440998',
      reports: [
        {
          content: {
            original: 'First batch test message',
            severity: 'low'
          },
          context: {
            platform: 'youtube',
            elementType: 'comment'
          },
          classification: {
            category: 'spam',
            confidence: 0.7
          }
        },
        {
          content: {
            original: 'Second batch test message',
            severity: 'medium'
          },
          context: {
            platform: 'reddit',
            elementType: 'post'
          },
          classification: {
            category: 'harassment',
            confidence: 0.8
          }
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/reports/batch`, batchReports);
    
    if (response.status === 201 && response.data.successful.length > 0) {
      logSuccess(`Batch submission successful: ${response.data.successful.length} reports created`);
      logInfo(`Total processed: ${response.data.totalProcessed}`);
      return true;
    } else {
      logError('Batch report submission failed');
      return false;
    }
  } catch (error) {
    logError(`Batch submission error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testUserEndpoints = async () => {
  if (!userToken) {
    logWarning('Skipping user tests - no user token');
    return false;
  }

  try {
    log('\n👤 Testing User Endpoints...', colors.cyan);
    
    const headers = { Authorization: `Bearer ${userToken}` };

    // Test user profile
    const profileResponse = await axios.get(`${BASE_URL}/user/profile`, { headers });
    if (profileResponse.status === 200) {
      logSuccess('User profile fetch successful');
    }

    // Test user stats
    const statsResponse = await axios.get(`${BASE_URL}/user/stats`, { headers });
    if (statsResponse.status === 200) {
      logSuccess('User stats fetch successful');
      logInfo(`Total reports: ${statsResponse.data.stats.totalReports}`);
    }

    // Test preferences update
    const preferencesUpdate = {
      darkMode: true,
      notifications: false
    };
    const prefsResponse = await axios.put(`${BASE_URL}/user/preferences`, preferencesUpdate, { headers });
    if (prefsResponse.status === 200) {
      logSuccess('User preferences update successful');
    }

    return true;
  } catch (error) {
    logError(`User endpoints error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testAnalyticsEndpoints = async () => {
  if (!userToken) {
    logWarning('Skipping analytics tests - no user token');
    return false;
  }

  try {
    log('\n📊 Testing Analytics Endpoints...', colors.cyan);
    
    const headers = { Authorization: `Bearer ${userToken}` };

    // Test overview analytics
    const overviewResponse = await axios.get(`${BASE_URL}/analytics/overview?days=30`, { headers });
    if (overviewResponse.status === 200) {
      logSuccess('Overview analytics fetch successful');
      logInfo(`Total reports: ${overviewResponse.data.overview.totalReports}`);
    }

    // Test categories analytics
    const categoriesResponse = await axios.get(`${BASE_URL}/analytics/categories?days=30`, { headers });
    if (categoriesResponse.status === 200) {
      logSuccess('Categories analytics fetch successful');
      logInfo(`Categories found: ${categoriesResponse.data.categories.length}`);
    }

    // Test platforms analytics
    const platformsResponse = await axios.get(`${BASE_URL}/analytics/platforms?days=30`, { headers });
    if (platformsResponse.status === 200) {
      logSuccess('Platforms analytics fetch successful');
    }

    return true;
  } catch (error) {
    logError(`Analytics endpoints error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testAdminEndpoints = async () => {
  if (!adminToken) {
    logWarning('Skipping admin tests - no admin token');
    return false;
  }

  try {
    log('\n👨‍💼 Testing Admin Endpoints...', colors.cyan);
    
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Test admin dashboard
    const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard?days=7`, { headers });
    if (dashboardResponse.status === 200) {
      logSuccess('Admin dashboard fetch successful');
      logInfo(`Total reports: ${dashboardResponse.data.overview.totalReports}`);
      logInfo(`Pending reports: ${dashboardResponse.data.overview.pendingReports}`);
    }

    // Test pending reports
    const pendingResponse = await axios.get(`${BASE_URL}/admin/reports/pending?limit=5`, { headers });
    if (pendingResponse.status === 200) {
      logSuccess('Pending reports fetch successful');
      logInfo(`Pending reports found: ${pendingResponse.data.reports.length}`);
    }

    // Test flagged reports
    const flaggedResponse = await axios.get(`${BASE_URL}/admin/reports/flagged?limit=5`, { headers });
    if (flaggedResponse.status === 200) {
      logSuccess('Flagged reports fetch successful');
    }

    // Test flagged users
    const flaggedUsersResponse = await axios.get(`${BASE_URL}/admin/users/flagged?limit=5`, { headers });
    if (flaggedUsersResponse.status === 200) {
      logSuccess('Flagged users fetch successful');
      logInfo(`Flagged users found: ${flaggedUsersResponse.data.users.length}`);
    }

    // Test report review (if we have a report ID)
    if (testReportId) {
      const reviewData = {
        decision: 'confirmed',
        notes: 'API test review'
      };
      const reviewResponse = await axios.put(`${BASE_URL}/admin/reports/${testReportId}/review`, reviewData, { headers });
      if (reviewResponse.status === 200) {
        logSuccess('Report review successful');
      }
    }

    return true;
  } catch (error) {
    logError(`Admin endpoints error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

const testRateLimiting = async () => {
  try {
    log('\n🚦 Testing Rate Limiting...', colors.cyan);
    
    const requests = [];
    const sampleReport = {
      browserUUID: '550e8400-e29b-41d4-a716-446655440997',
      content: {
        original: 'Rate limit test message',
        severity: 'low'
      },
      context: {
        platform: 'other',
        elementType: 'comment'
      },
      classification: {
        category: 'other',
        confidence: 0.5
      }
    };

    // Send 12 requests quickly (should hit the 10/minute limit)
    for (let i = 0; i < 12; i++) {
      requests.push(axios.post(`${BASE_URL}/reports/submit`, sampleReport));
    }

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 201).length;
    const rateLimited = responses.filter(r => r.status === 'rejected' && r.reason.response?.status === 429).length;

    if (rateLimited > 0) {
      logSuccess(`Rate limiting working: ${successful} successful, ${rateLimited} rate limited`);
      return true;
    } else {
      logWarning('Rate limiting may not be working as expected');
      return false;
    }
  } catch (error) {
    logError(`Rate limiting test error: ${error.message}`);
    return false;
  }
};

const testErrorHandling = async () => {
  try {
    log('\n🚫 Testing Error Handling...', colors.cyan);
    
    // Test invalid endpoint
    try {
      await axios.get(`${BASE_URL}/invalid/endpoint`);
      logError('Expected 404 but got success');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('404 error handling working');
      }
    }

    // Test invalid data
    try {
      await axios.post(`${BASE_URL}/auth/register`, { invalid: 'data' });
      logError('Expected validation error but got success');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Validation error handling working');
      }
    }

    // Test unauthorized access
    try {
      await axios.get(`${BASE_URL}/admin/dashboard`);
      logError('Expected 401 but got success');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Authentication error handling working');
      }
    }

    return true;
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  log('🚀 Starting TypeAware API Test Suite...', colors.bright);
  log(`📍 Testing API at: ${BASE_URL}`, colors.blue);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Report Submission', fn: testReportSubmission },
    { name: 'Batch Report Submission', fn: testBatchReportSubmission },
    { name: 'User Endpoints', fn: testUserEndpoints },
    { name: 'Analytics Endpoints', fn: testAnalyticsEndpoints },
    { name: 'Admin Endpoints', fn: testAdminEndpoints },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Error Handling', fn: testErrorHandling }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      results.failed++;
    }
    
    // Small delay between tests
    await sleep(500);
  }

  // Summary
  log('\n📋 Test Summary', colors.bright);
  log('=' * 50, colors.blue);
  logSuccess(`Passed: ${results.passed}`);
  logError(`Failed: ${results.failed}`);
  logInfo(`Total: ${results.total}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);

  if (results.passed === results.total) {
    log('\n🎉 All tests passed! Your API is working perfectly!', colors.green);
  } else if (results.passed >= results.total * 0.8) {
    log('\n👍 Most tests passed! Check the failed tests above.', colors.yellow);
  } else {
    log('\n⚠️  Many tests failed. Please check your server and database.', colors.red);
  }
};

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
🧪 TypeAware API Test Suite

Usage:
  npm run test-api         # Run all tests
  node scripts/testAPI.js  # Run all tests

Environment Variables:
  API_BASE_URL            # API base URL (default: http://localhost:3001/api)
  DEFAULT_ADMIN_EMAIL     # Admin email for testing
  DEFAULT_ADMIN_PASSWORD  # Admin password for testing

Make sure your server is running before running tests!
  `);
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite error: ${error.message}`);
  process.exit(1);
});