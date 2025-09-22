// ==========================================
// 📁 src/controllers/extensionController.js
// This handles all API calls from the browser extension
// ==========================================

const User = require('../models/User');
const Report = require('../models/Report');
const Detection = require('../models/Detection');
const Block = require('../models/Block');

// Sync extension data with backend
const syncData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reports, detections, blocks } = req.body;

    let syncResults = {
      reports: { created: 0, errors: 0 },
      detections: { created: 0, errors: 0 },
      blocks: { created: 0, updated: 0, errors: 0 }
    };

    // Sync Reports
    if (reports && Array.isArray(reports)) {
      for (const reportData of reports) {
        try {
          const report = new Report({
            userId,
            ...reportData,
            metadata: {
              ...reportData.metadata,
              syncedAt: new Date()
            }
          });
          await report.save();
          syncResults.reports.created++;
        } catch (error) {
          console.error('Report sync error:', error);
          syncResults.reports.errors++;
        }
      }
    }

    // Sync Detections
    if (detections && Array.isArray(detections)) {
      for (const detectionData of detections) {
        try {
          const detection = new Detection({
            userId,
            ...detectionData
          });
          await detection.save();
          syncResults.detections.created++;
        } catch (error) {
          console.error('Detection sync error:', error);
          syncResults.detections.errors++;
        }
      }
    }

    // Sync Blocks
    if (blocks && Array.isArray(blocks)) {
      for (const blockData of blocks) {
        try {
          // Check if block already exists
          const existingBlock = await Block.findOne({
            userId,
            'blockedUser.username': blockData.blockedUser.username,
            'blockedUser.platform': blockData.blockedUser.platform
          });

          if (existingBlock) {
            // Update existing block
            Object.assign(existingBlock, blockData);
            await existingBlock.save();
            syncResults.blocks.updated++;
          } else {
            // Create new block
            const block = new Block({
              userId,
              ...blockData
            });
            await block.save();
            syncResults.blocks.created++;
          }
        } catch (error) {
          console.error('Block sync error:', error);
          syncResults.blocks.errors++;
        }
      }
    }

    // Update user stats
    await updateUserStats(userId);

    res.json({
      success: true,
      message: 'Data synced successfully',
      data: syncResults
    });

  } catch (error) {
    console.error('Sync data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync data',
      error: error.message
    });
  }
};

// Log a single detection from extension
const logDetection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const detectionData = req.body;

    const detection = new Detection({
      userId,
      originalContent: detectionData.originalContent,
      cleanedContent: detectionData.cleanedContent,
      detection: detectionData.detection,
      context: detectionData.context,
      userAction: detectionData.userAction || 'warned',
      extensionData: {
        version: req.headers['x-extension-version'],
        userAgent: req.headers['user-agent'],
        ...detectionData.extensionData
      }
    });

    await detection.save();

    // Update user detection count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.detectionsCount': 1 }
    });

    res.json({
      success: true,
      message: 'Detection logged successfully',
      data: {
        detectionId: detection._id,
        confidence: detection.detection.confidence,
        type: detection.detection.type
      }
    });

  } catch (error) {
    console.error('Log detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log detection',
      error: error.message
    });
  }
};

// Submit a report from extension
const submitReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reportData = req.body;

    const report = new Report({
      userId,
      content: reportData.content,
      reason: reportData.reason,
      platform: reportData.platform,
      url: reportData.url,
      targetUser: reportData.targetUser,
      detectionMethod: reportData.detectionMethod || 'user-report',
      severity: reportData.severity || 'medium',
      metadata: {
        userAgent: req.headers['user-agent'],
        extensionVersion: req.headers['x-extension-version'],
        timestamp: new Date(),
        ...reportData.metadata
      }
    });

    await report.save();

    // Update user report count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.reportsCount': 1 }
    });

    res.json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report._id,
        status: report.status
      }
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

// Create or update a block
const manageBlock = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { action, blockedUser, blockData } = req.body;

    if (action === 'create') {
      // Check if block already exists
      const existingBlock = await Block.findOne({
        userId,
        'blockedUser.username': blockedUser.username,
        'blockedUser.platform': blockedUser.platform,
        'blockStatus.isActive': true
      });

      if (existingBlock) {
        // Extend existing block
        await existingBlock.extendBlock(blockData.duration || 10);
        
        return res.json({
          success: true,
          message: 'Block extended successfully',
          data: {
            blockId: existingBlock._id,
            expiresAt: existingBlock.blockStatus.expiresAt
          }
        });
      }

      // Create new block
      const block = new Block({
        userId,
        blockedUser,
        blockReason: blockData.blockReason,
        blockStatus: blockData.blockStatus,
        actions: blockData.actions,
        metadata: {
          extensionVersion: req.headers['x-extension-version'],
          userAgent: req.headers['user-agent'],
          autoBlocked: blockData.autoBlocked !== false
        }
      });

      await block.save();

      res.json({
        success: true,
        message: 'User blocked successfully',
        data: {
          blockId: block._id,
          expiresAt: block.blockStatus.expiresAt,
          duration: block.blockStatus.duration
        }
      });

    } else if (action === 'unblock') {
      const block = await Block.findOne({
        userId,
        'blockedUser.username': blockedUser.username,
        'blockedUser.platform': blockedUser.platform,
        'blockStatus.isActive': true
      });

      if (!block) {
        return res.status(404).json({
          success: false,
          message: 'Block not found'
        });
      }

      await block.unblock('Manual unblock from extension');

      res.json({
        success: true,
        message: 'User unblocked successfully',
        data: {
          blockId: block._id
        }
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Use "create" or "unblock"'
      });
    }

  } catch (error) {
    console.error('Manage block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage block',
      error: error.message
    });
  }
};

// Get active blocks for user
const getBlocks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { platform } = req.query;

    let query = {
      userId,
      'blockStatus.isActive': true
    };

    if (platform) {
      query['blockedUser.platform'] = platform;
    }

    const blocks = await Block.find(query)
      .select('blockedUser blockStatus blockReason stats')
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance

    res.json({
      success: true,
      data: {
        blocks: blocks.map(block => ({
          id: block._id,
          blockedUser: block.blockedUser,
          blockStatus: block.blockStatus,
          violationCount: block.blockReason.violationCount,
          isExpired: block.isExpired,
          expiresAt: block.blockStatus.expiresAt
        })),
        total: blocks.length
      }
    });

  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocks',
      error: error.message
    });
  }
};

// Check if specific user is blocked
const checkBlock = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { platform, username } = req.query;

    if (!platform || !username) {
      return res.status(400).json({
        success: false,
        message: 'Platform and username are required'
      });
    }

    const block = await Block.findOne({
      userId,
      'blockedUser.platform': platform,
      'blockedUser.username': username,
      'blockStatus.isActive': true
    });

    const isBlocked = block && !block.isExpired;

    res.json({
      success: true,
      data: {
        isBlocked,
        block: isBlocked ? {
          id: block._id,
          blockType: block.blockStatus.blockType,
          expiresAt: block.blockStatus.expiresAt,
          violationCount: block.blockReason.violationCount,
          actions: block.actions
        } : null
      }
    });

  } catch (error) {
    console.error('Check block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check block status',
      error: error.message
    });
  }
};

// Helper function to update user stats
const updateUserStats = async (userId) => {
  try {
    const [reportCount, detectionCount, blockCount] = await Promise.all([
      Report.countDocuments({ userId }),
      Detection.countDocuments({ userId }),
      Block.countDocuments({ userId, 'blockStatus.isActive': true })
    ]);

    await User.findByIdAndUpdate(userId, {
      'stats.reportsCount': reportCount,
      'stats.detectionsCount': detectionCount,
      'stats.blockedUsersCount': blockCount
    });
  } catch (error) {
    console.error('Update user stats error:', error);
  }
};

module.exports = {
  syncData,
  logDetection,
  submitReport,
  manageBlock,
  getBlocks,
  checkBlock
};