/**
 * Test script for AI analyze endpoint
 * Tests the integration between extension and backend AI analysis
 */

const axios = require('axios');

// Backend URL - change this for production
const BACKEND_URL = 'http://localhost:5000';

// Test data
const testCases = [
  {
    name: 'Clean content',
    content: 'This is a normal, friendly message with no issues.',
    expected: { is_abusive: false, risk_level: 'NONE' }
  },
  {
    name: 'Mild profanity',
    content: 'This sucks, I\'m really pissed off about this situation.',
    expected: { is_abusive: true, risk_level: 'LOW' }
  },
  {
    name: 'Harassment',
    content: 'You\'re such a loser and nobody likes you. Go away!',
    expected: { is_abusive: true, risk_level: 'HIGH' }
  },
  {
    name: 'Threat',
    content: 'I\'ll find you and make you regret this. Watch your back.',
    expected: { is_abusive: true, risk_level: 'CRITICAL' }
  },
  {
    name: 'Hate speech',
    content: 'All people like you should be eliminated from society.',
    expected: { is_abusive: true, risk_level: 'HIGH' }
  },
  {
    name: 'Obfuscated content',
    content: 'Y0u\'r3 5uch 4 l0s3r, g0 4w4y!',
    expected: { is_abusive: true, risk_level: 'MEDIUM' }
  },
  {
    name: 'Contextual bullying',
    content: 'Why don\'t you just kill yourself already?',
    expected: { is_abusive: true, risk_level: 'CRITICAL' }
  },
  {
    name: 'Educational content',
    content: 'Remember to be kind to others and treat everyone with respect.',
    expected: { is_abusive: false, risk_level: 'NONE' }
  }
];

// Extension simulation headers
const extensionHeaders = {
  'x-extension-id': 'test-extension-id-12345',
  'x-extension-version': '1.0.0',
  'x-user-uuid': 'test-user-uuid-67890'
};

// Test contexts
const contexts = [
  { platform: 'twitter', source: 'extension' },
  { platform: 'reddit', source: 'extension' },
  { platform: 'web', source: 'extension' },
  { platform: 'youtube', source: 'extension', emotion: 'anger' }
];

async function testAnalyzeEndpoint() {
  console.log('🧪 Starting AI Analyze Endpoint Tests\n');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  // Test basic functionality
  console.log('\n📋 Testing Basic AI Analysis:');
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      console.log(`Content: "${testCase.content}"`);

      const response = await axios.post(`${BACKEND_URL}/api/ai/analyze`, {
        content: testCase.content,
        context: { source: 'test', platform: 'web' }
      }, {
        headers: extensionHeaders,
        timeout: 10000
      });

      const result = response.data.data;
      console.log(`Result: Risk Level: ${result.risk_level}, Is Abusive: ${result.is_abusive}`);
      console.log(`Score: ${result.risk_score}, Categories: ${result.categories?.join(', ') || 'none'}`);

      // Basic validation
      if (typeof result.is_abusive === 'boolean' &&
          typeof result.risk_score === 'number' &&
          result.risk_level) {
        console.log('✅ Basic structure validation passed');
        passed++;
      } else {
        console.log('❌ Basic structure validation failed');
        failed++;
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      failed++;
    }
  }

  // Test with different contexts
  console.log('\n📋 Testing Context Variations:');
  const testContent = 'You\'re an idiot and I hate you!';
  for (const context of contexts) {
    try {
      console.log(`\nTesting context: ${JSON.stringify(context)}`);

      const response = await axios.post(`${BACKEND_URL}/api/ai/analyze`, {
        content: testContent,
        context: context
      }, {
        headers: extensionHeaders,
        timeout: 10000
      });

      const result = response.data.data;
      console.log(`Result: Risk Level: ${result.risk_level}, Score: ${result.risk_score}`);

      if (result.analysis_breakdown) {
        console.log(`Breakdown: Content: ${result.analysis_breakdown.content_analysis?.risk_score}, Pattern: ${result.analysis_breakdown.pattern_analysis?.risk_score}`);
      }

      passed++;

    } catch (error) {
      console.log(`❌ Context test failed: ${error.message}`);
      failed++;
    }
  }

  // Test rephrasing suggestions
  console.log('\n📋 Testing Rephrasing Suggestions:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/ai/rephrase`, {
      message: 'You\'re so stupid and worthless, nobody likes you.',
      context: { source: 'test' }
    }, {
      headers: extensionHeaders,
      timeout: 10000
    });

    const result = response.data.data;
    console.log(`Rephrasing suggestions: ${result.suggestions?.length || 0} suggestions generated`);
    if (result.suggestions?.length > 0) {
      console.log(`First suggestion: "${result.suggestions[0].suggested_text}"`);
    }
    passed++;

  } catch (error) {
    console.log(`❌ Rephrasing test failed: ${error.message}`);
    failed++;
  }

  // Test health check
  console.log('\n📋 Testing AI Health Check:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai/health`, {
      headers: extensionHeaders,
      timeout: 5000
    });

    const result = response.data.data;
    console.log(`AI Health: ${result.status}, Stats: ${JSON.stringify(result.stats)}`);
    passed++;

  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    failed++;
  }

  // Test error handling
  console.log('\n📋 Testing Error Handling:');
  try {
    // Test with empty content
    await axios.post(`${BACKEND_URL}/api/ai/analyze`, {
      content: '',
      context: {}
    }, {
      headers: extensionHeaders,
      timeout: 5000
    });
    console.log('❌ Should have failed with empty content');
    failed++;

  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Properly handled empty content');
      passed++;
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
      failed++;
    }
  }

  // Test extension integration simulation
  console.log('\n📋 Testing Extension Integration Simulation:');
  try {
    // Simulate extension report submission
    const reportResponse = await axios.post(`${BACKEND_URL}/api/extension/reports`, {
      content: 'This is a test report from extension',
      flagReason: 'harassment',
      platform: 'other',
      context: {
        url: 'https://example.com',
        detectionSource: 'ai',
        confidence: 0.85
      },
      timestamp: new Date().toISOString()
    }, {
      headers: extensionHeaders,
      timeout: 10000
    });

    console.log(`Extension report submitted: ${reportResponse.data.data?.reportId}`);
    passed++;

  } catch (error) {
    console.log(`❌ Extension integration test failed: ${error.message}`);
    failed++;
  }

  // Test extension ping
  console.log('\n📋 Testing Extension Ping:');
  try {
    const pingResponse = await axios.post(`${BACKEND_URL}/api/extension/ping`, {}, {
      headers: extensionHeaders,
      timeout: 5000
    });

    console.log(`Extension ping successful: ${pingResponse.data.data?.id}`);
    passed++;

  } catch (error) {
    console.log(`❌ Extension ping failed: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed! AI analysis is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the backend implementation.');
  }

  return { passed, failed };
}

// Performance test
async function performanceTest() {
  console.log('\n⏱️  Running Performance Test (10 concurrent requests):');

  const testContent = 'You are an amazing person and I appreciate you!';
  const startTime = Date.now();

  try {
    const promises = Array(10).fill().map(() =>
      axios.post(`${BACKEND_URL}/api/ai/analyze`, {
        content: testContent,
        context: { source: 'performance_test' }
      }, {
        headers: extensionHeaders,
        timeout: 15000
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;

    console.log(`✅ All requests completed in average ${avgTime.toFixed(0)}ms per request`);
    console.log(`📊 Total time: ${endTime - startTime}ms for 10 requests`);

    // Check response consistency
    const riskLevels = results.map(r => r.data.data.risk_level);
    const uniqueLevels = [...new Set(riskLevels)];
    console.log(`🎯 Response consistency: ${uniqueLevels.length === 1 ? 'Perfect' : 'Varied'} (${uniqueLevels.join(', ')})`);

  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 AI Analyze Endpoint Test Suite');
  console.log('Testing backend URL:', BACKEND_URL);

  try {
    // Check if backend is running
    console.log('\n🔍 Checking backend availability...');
    await axios.get(`${BACKEND_URL}/api/ai/health`, { timeout: 5000 });
    console.log('✅ Backend is running');

    // Run main tests
    const results = await testAnalyzeEndpoint();

    // Run performance test
    await performanceTest();

    console.log('\n🏁 Test suite completed!');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.log('❌ Backend is not available:', error.message);
    console.log('Please make sure the backend server is running on', BACKEND_URL);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAnalyzeEndpoint, performanceTest };
