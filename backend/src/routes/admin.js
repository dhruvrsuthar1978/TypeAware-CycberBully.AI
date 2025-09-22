// ==========================================
// 📁 src/routes/admin.js
// These are the API endpoints for admin dashboard
// ==========================================

const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getDashboardOverview,
  getFlaggedContent,
  reviewReport,
  getUserViolations,
  manageUser,
  getAnalytics
} = require('../controllers/adminController');

// Admin authentication middleware - all routes require admin access
router.use(auth, adminAuth);

// @route   GET /api/admin/dashboard/overview
// @desc    Get main admin dashboard overview stats
// @access  Admin only
router.get('/dashboard/overview', async (req, res) => {
  await getDashboardOverview(req, res);
});

// @route   GET /api/admin/reports
// @desc    Get flagged content for review
// @access  Admin only
router.get('/reports', async (req, res) => {
  // Validate query parameters
  const { page, limit, status, severity, platform } = req.query;
  
  // Validate page and limit
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  // Validate status
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  // Validate severity
  const validSeverities = ['low', 'medium', 'high'];
  if (severity && !validSeverities.includes(severity)) {
    return res.status(400).json({
      success: false,
      message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
    });
  }
  
  await getFlaggedContent(req, res);
});

// @route   PUT /api/admin/reports/review/:reportId
// @desc    Review a specific report (approve/dismiss/resolve)
// @access  Admin only
router.put('/reports/review/:reportId', async (req, res) => {
  // Validate reportId
  const { reportId } = req.params;
  const mongoose = require('mongoose');
  
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }
  
  // Validate action
  const { action, notes } = req.body;
  const validActions = ['approve', 'dismiss', 'resolve'];
  
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Action is required'
    });
  }
  
  if (!validActions.includes(action)) {
    return res.status(400).json({
      success: false,
      message: `Invalid action. Must be one of: ${validActions.join(', ')}`
    });
  }
  
  // Validate notes length
  if (notes && typeof notes !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Notes must be a string'
    });
  }
  
  if (notes && notes.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Notes must be less than 1000 characters'
    });
  }
  
  await reviewReport(req, res);
});

// @route   GET /api/admin/users/violations
// @desc    Get users with violations for management
// @access  Admin only
router.get('/users/violations', async (req, res) => {
  // Validate query parameters
  const { page, limit, sortBy } = req.query;
  
  // Validate page and limit
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  // Validate sortBy
  const validSortBy = ['reportCount', 'lastViolation', 'riskScore'];
  if (sortBy && !validSortBy.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sortBy. Must be one of: ${validSortBy.join(', ')}`
    });
  }
  
  await getUserViolations(req, res);
});

// @route   PUT /api/admin/users/manage/:userId
// @desc    Manage user account (activate/deactivate/delete)
// @access  Admin only
router.put('/users/manage/:userId', async (req, res) => {
  // Validate userId
  const { userId } = req.params;
  const mongoose = require('mongoose');
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }
  
  // Validate action
  const { action, reason } = req.body;
  const validActions = ['activate', 'deactivate', 'delete'];
  
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Action is required'
    });
  }
  
  if (!validActions.includes(action)) {
    return res.status(400).json({
      success: false,
      message: `Invalid action. Must be one of: ${validActions.join(', ')}`
    });
  }
  
  // Require reason for deactivate/delete actions
  if ((action === 'deactivate' || action === 'delete') && !reason) {
    return res.status(400).json({
      success: false,
      message: `Reason is required for ${action} action`
    });
  }
  
  // Validate reason length
  if (reason && typeof reason !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Reason must be a string'
    });
  }
  
  if (reason && reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Reason must be less than 500 characters'
    });
  }
  
  await manageUser(req, res);
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data for charts and insights
// @access  Admin only
router.get('/analytics', async (req, res) => {
  // Validate query parameters
  const { period, days } = req.query;
  
  // Validate period
  const validPeriods = ['daily', 'weekly', 'monthly'];
  if (period && !validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
    });
  }
  
  // Validate days
  if (days && (isNaN(days) || parseInt(days) < 1 || parseInt(days) > 365)) {
    return res.status(400).json({
      success: false,
      message: 'Days must be between 1 and 365'
    });
  }
  
  await getAnalytics(req, res);
});

// @route   GET /api/admin/stats/summary
// @desc    Get quick summary stats for admin widgets
// @access  Admin only
router.get('/stats/summary', async (req, res) => {
  try {
    const User = require('../models/User');
    const Report = require('../models/Report');
    const Detection = require('../models/Detection');
    const Block = require('../models/Block');
    
    // Get quick stats in parallel
    const [
      totalUsers,
      activeUsers,
      totalReports,
      pendingReports,
      totalDetections,
      totalBlocks,
      activeBlocks
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Detection.countDocuments(),
      Block.countDocuments(),
      Block.countDocuments({ 'blockStatus.isActive': true })
    ]);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          reviewed: totalReports - pendingReports
        },
        detections: {
          total: totalDetections
        },
        blocks: {
          total: totalBlocks,
          active: activeBlocks,
          expired: totalBlocks - activeBlocks
        },
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin summary stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary stats',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports/stats
// @desc    Get detailed report statistics
// @access  Admin only
router.get('/reports/stats', async (req, res) => {
  try {
    const Report = require('../models/Report');
    
    // Get report statistics
    const [reasonStats, platformStats, severityStats, statusStats] = await Promise.all([
      // By reason
      Report.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By platform
      Report.aggregate([
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By severity
      Report.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By status
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        byReason: reasonStats.map(r => ({ reason: r._id, count: r.count })),
        byPlatform: platformStats.map(p => ({ platform: p._id, count: p.count })),
        bySeverity: severityStats.map(s => ({ severity: s._id, count: s.count })),
        byStatus: statusStats.map(s => ({ status: s._id, count: s.count })),
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report statistics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/system/health
// @desc    Get system health and performance metrics
// @access  Admin only
router.get('/system/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Database health
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
    const dbStats = await mongoose.connection.db.stats();
    
    // Memory usage
    const memUsage = process.memoryUsage();
    
    // Uptime
    const uptime = process.uptime();
    
    // Collection counts (for monitoring)
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
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: formatUptime(uptime)
        },
        database: {
          status: dbStatus,
          collections: dbStats.collections,
          dataSize: Math.round(dbStats.dataSize / 1024 / 1024) + ' MB',
          storageSize: Math.round(dbStats.storageSize / 1024 / 1024) + ' MB'
        },
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        collections: {
          users: userCount,
          reports: reportCount,
          detections: detectionCount,
          blocks: blockCount
        },
        version: {
          node: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }
    });
    
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health',
      error: error.message,
      status: 'unhealthy'
    });
  }
});

// Helper function to format uptime
const formatUptime = (uptimeSeconds) => {
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

module.exports = router;