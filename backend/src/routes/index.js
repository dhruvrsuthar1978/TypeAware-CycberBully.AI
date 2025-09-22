// ==========================================
// 📁 src/routes/index.js - Updated Main Routes
// This combines all route files including extension routes
// ==========================================

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const extensionRoutes = require('./extension');

// Use route modules
router.use('/auth', authRoutes);
router.use('/extension', extensionRoutes);

// API info endpoint - shows what endpoints are available
router.get('/', (req, res) => {
  res.json({
    message: '🚀 TypeAware API - Level 2 Extension Integration',
    version: '2.0.0',
    status: 'active',
    features: [
      '✅ User Authentication',
      '✅ Browser Extension Integration', 
      '✅ Real-time Detection Logging',
      '✅ User Report System',
      '✅ Automatic Blocking System',
      '✅ Data Synchronization'
    ],
    endpoints: {
      // Authentication endpoints
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get user profile (requires login)',
        'GET /api/auth/verify': 'Verify token (requires login)'
      },
      
      // Extension endpoints
      extension: {
        'POST /api/extension/sync': 'Bulk sync extension data (requires login + extension headers)',
        'POST /api/extension/detection': 'Log single detection (requires login + extension headers)',
        'POST /api/extension/report': 'Submit user report (requires login + extension headers)',
        'POST /api/extension/block': 'Create/remove user blocks (requires login + extension headers)',
        'GET /api/extension/blocks': 'Get list of blocked users (requires login + extension headers)',
        'GET /api/extension/block/check': 'Check if user is blocked (requires login + extension headers)',
        'GET /api/extension/status': 'Get connection status (requires login + extension headers)',
        'POST /api/extension/feedback': 'Submit detection feedback (requires login + extension headers)',
        'GET /api/extension/stats': 'Get user statistics (requires login + extension headers)'
      }
    },
    
    // Documentation for developers
    documentation: {
      authentication: 'All extension endpoints require Authorization header with Bearer token',
      extensionHeaders: {
        'X-Extension-ID': 'Required: User extension UUID from registration',
        'X-Extension-Version': 'Optional: Extension version (e.g., "1.0.0")',
        'Content-Type': 'Required for POST requests: "application/json"'
      },
      
      // Example requests
      examples: {
        register: {
          method: 'POST',
          url: '/api/auth/register',
          body: {
            email: 'user@example.com',
            password: 'password123',
            username: 'myusername'
          }
        },
        
        login: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: 'user@example.com',
            password: 'password123'
          }
        },
        
        logDetection: {
          method: 'POST',
          url: '/api/extension/detection',
          headers: {
            'Authorization': 'Bearer your-jwt-token',
            'X-Extension-ID': 'your-extension-uuid',
            'Content-Type': 'application/json'
          },
          body: {
            originalContent: 'You are so stupid!',
            detection: {
              type: 'harassment',
              confidence: 0.85,
              method: 'nlp'
            },
            context: {
              platform: 'twitter',
              url: 'https://twitter.com/user/status/123'
            },
            userAction: 'warned'
          }
        },
        
        submitReport: {
          method: 'POST',
          url: '/api/extension/report',
          headers: {
            'Authorization': 'Bearer your-jwt-token',
            'X-Extension-ID': 'your-extension-uuid',
            'Content-Type': 'application/json'
          },
          body: {
            content: 'Abusive content here...',
            reason: 'harassment',
            platform: 'twitter',
            url: 'https://twitter.com/user/status/123',
            targetUser: {
              username: 'abusiveuser',
              profileUrl: 'https://twitter.com/abusiveuser'
            }
          }
        },
        
        checkBlock: {
          method: 'GET',
          url: '/api/extension/block/check?platform=twitter&username=abusiveuser',
          headers: {
            'Authorization': 'Bearer your-jwt-token',
            'X-Extension-ID': 'your-extension-uuid'
          }
        }
      }
    },
    
    // System status
    system: {
      level: 'Level 2 - Extension Integration Complete',
      database: 'MongoDB Atlas',
      models: ['User', 'Report', 'Detection', 'Block'],
      features: {
        authentication: 'JWT-based',
        extensionAuth: 'UUID + headers',
        dataSync: 'Bulk and real-time',
        blocking: '3-strike automatic system',
        reporting: 'User and AI-driven',
        platforms: 'Multi-platform support'
      }
    }
  });
});

// Health check with extended info
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Get collection counts (optional - for admin monitoring)
    let stats = {
      database: dbStatus
    };
    
    if (dbStatus === 'Connected') {
      try {
        const User = require('../models/User');
        const Report = require('../models/Report');
        const Detection = require('../models/Detection');
        const Block = require('../models/Block');
        
        const [userCount, reportCount, detectionCount, blockCount] = await Promise.all([
          User.countDocuments(),
          Report.countDocuments(),
          Detection.countDocuments(),
          Block.countDocuments()
        ]);
        
        stats.collections = {
          users: userCount,
          reports: reportCount,
          detections: detectionCount,
          blocks: blockCount
        };
      } catch (error) {
        stats.collections = 'Error fetching stats';
      }
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'TypeAware Backend API',
      version: '2.0.0',
      level: 'Extension Integration Complete',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      ...stats
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;