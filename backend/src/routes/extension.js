// ==========================================
// 📁 src/routes/extension.js
// These are the API endpoints for the browser extension
// ==========================================

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  syncData,
  logDetection,
  submitReport,
  manageBlock,
  getBlocks,
  checkBlock
} = require('../controllers/extensionController');

// Extension authentication middleware
const extensionAuth = (req, res, next) => {
  // Check if request has extension headers
  const extensionId = req.headers['x-extension-id'];
  const extensionVersion = req.headers['x-extension-version'];
  
  if (!extensionId) {
    return res.status(400).json({
      success: false,
      message: 'Extension ID required in headers'
    });
  }
  
  // Add extension info to request
  req.extension = {
    id: extensionId,
    version: extensionVersion || '1.0.0'
  };
  
  next();
};

// @route   POST /api/extension/sync
// @desc    Sync bulk data from extension to backend
// @access  Private (extension users only)
router.post('/sync', auth, extensionAuth, async (req, res) => {
  // Validate sync data structure
  const { reports, detections, blocks } = req.body;
  
  if (!reports && !detections && !blocks) {
    return res.status(400).json({
      success: false,
      message: 'At least one data type (reports, detections, blocks) is required'
    });
  }
  
  // Validate data types
  if (reports && !Array.isArray(reports)) {
    return res.status(400).json({
      success: false,
      message: 'Reports must be an array'
    });
  }
  
  if (detections && !Array.isArray(detections)) {
    return res.status(400).json({
      success: false,
      message: 'Detections must be an array'
    });
  }
  
  if (blocks && !Array.isArray(blocks)) {
    return res.status(400).json({
      success: false,
      message: 'Blocks must be an array'
    });
  }
  
  await syncData(req, res);
});

// @route   POST /api/extension/detection
// @desc    Log a single detection from extension
// @access  Private (extension users only)
router.post('/detection', auth, extensionAuth, async (req, res) => {
  // Validate detection data
  const { originalContent, detection, context } = req.body;
  
  if (!originalContent || !detection || !context) {
    return res.status(400).json({
      success: false,
      message: 'originalContent, detection, and context are required'
    });
  }
  
  // Validate detection structure
  if (!detection.type || !detection.confidence || !detection.method) {
    return res.status(400).json({
      success: false,
      message: 'Detection must have type, confidence, and method'
    });
  }
  
  // Validate context structure
  if (!context.platform) {
    return res.status(400).json({
      success: false,
      message: 'Context must have platform'
    });
  }
  
  await logDetection(req, res);
});

// @route   POST /api/extension/report
// @desc    Submit a user report from extension
// @access  Private (extension users only)
router.post('/report', auth, extensionAuth, async (req, res) => {
  // Validate report data
  const { content, reason, platform, url } = req.body;
  
  if (!content || !reason || !platform || !url) {
    return res.status(400).json({
      success: false,
      message: 'content, reason, platform, and url are required'
    });
  }
  
  // Validate reason
  const validReasons = ['hate-speech', 'harassment', 'spam', 'bullying', 'other'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reason. Must be one of: ' + validReasons.join(', ')
    });
  }
  
  await submitReport(req, res);
});

// @route   POST /api/extension/block
// @desc    Create or manage user blocks
// @access  Private (extension users only)
router.post('/block', auth, extensionAuth, async (req, res) => {
  // Validate block action
  const { action, blockedUser } = req.body;
  
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Action is required (create or unblock)'
    });
  }
  
  const validActions = ['create', 'unblock'];
  if (!validActions.includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be "create" or "unblock"'
    });
  }
  
  if (!blockedUser || !blockedUser.username || !blockedUser.platform) {
    return res.status(400).json({
      success: false,
      message: 'blockedUser with username and platform is required'
    });
  }
  
  await manageBlock(req, res);
});

// @route   GET /api/extension/blocks
// @desc    Get list of blocked users for extension
// @access  Private (extension users only)
router.get('/blocks', auth, extensionAuth, async (req, res) => {
  await getBlocks(req, res);
});

// @route   GET /api/extension/block/check
// @desc    Check if specific user is blocked
// @access  Private (extension users only)
router.get('/block/check', auth, extensionAuth, async (req, res) => {
  // Validate query parameters
  const { platform, username } = req.query;
  
  if (!platform || !username) {
    return res.status(400).json({
      success: false,
      message: 'platform and username query parameters are required'
    });
  }
  
  await checkBlock(req, res);
});

// @route   GET /api/extension/status
// @desc    Get extension connection status and user info
// @access  Private (extension users only)
router.get('/status', auth, extensionAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Extension connected successfully',
    data: {
      userId: req.user.userId,
      extensionId: req.user.extensionId,
      role: req.user.role,
      connected: true,
      serverTime: new Date().toISOString(),
      extensionVersion: req.extension.version
    }
  });
});

// @route   POST /api/extension/feedback
// @desc    Submit feedback about detection accuracy
// @access  Private (extension users only)
router.post('/feedback', auth, extensionAuth, async (req, res) => {
  try {
    const { detectionId, falsePositive, feedback } = req.body;
    
    if (!detectionId) {
      return res.status(400).json({
        success: false,
        message: 'Detection ID is required'
      });
    }
    
    const Detection = require('../models/Detection');
    
    const detection = await Detection.findById(detectionId);
    
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }
    
    // Check if detection belongs to user
    if (detection.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update feedback
    if (falsePositive === true) {
      await detection.markFalsePositive(feedback);
    }
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        detectionId: detection._id,
        falsePositive: detection.feedback.falsePositive
      }
    });
    
  } catch (error) {
    console.error('Extension feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// @route   GET /api/extension/stats
// @desc    Get user's extension statistics
// @access  Private (extension users only)
router.get('/stats', auth, extensionAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const User = require('../models/User');
    const Detection = require('../models/Detection');
    
    // Get user with stats
    const user = await User.findById(userId).select('stats');
    
    // Get additional detection stats
    const detectionStats = await Detection.getStatsForUser(userId);
    
    res.json({
      success: true,
      data: {
        reports: user.stats.reportsCount,
        detections: user.stats.detectionsCount,
        blockedUsers: user.stats.blockedUsersCount,
        accuracy: detectionStats.averageConfidence,
        falsePositives: detectionStats.falsePositives,
        platforms: [...new Set(detectionStats.platforms)], // Unique platforms
        detectionTypes: [...new Set(detectionStats.detectionTypes)] // Unique types
      }
    });
    
  } catch (error) {
    console.error('Extension stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

module.exports = router;