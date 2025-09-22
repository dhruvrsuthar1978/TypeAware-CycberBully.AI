// ==========================================
// 📁 src/controllers/adminController.js
// This handles all admin operations and dashboard data
// ==========================================

const User = require('../models/User');
const Report = require('../models/Report');
const Detection = require('../models/Detection');
const Block = require('../models/Block');
const Analytics = require('../models/Analytics');
const mongoose = require('mongoose');

// Get admin dashboard overview
const getDashboardOverview = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get last 7 days for trends
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      todayReports,
      pendingReports,
      todayDetections,
      activeBlocks,
      totalUsers,
      todayUsers,
      weeklyAnalytics
    ] = await Promise.all([
      Report.countDocuments({ 
        createdAt: { $gte: startOfDay, $lt: endOfDay } 
      }),
      Report.countDocuments({ status: 'pending' }),
      Detection.countDocuments({ 
        createdAt: { $gte: startOfDay, $lt: endOfDay } 
      }),
      Block.countDocuments({ 'blockStatus.isActive': true }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        createdAt: { $gte: startOfDay, $lt: endOfDay } 
      }),
      Analytics.getAnalyticsRange(weekAgo, today, 'daily')
    ]);

    // Calculate trends from weekly analytics
    const trends = calculateTrends(weeklyAnalytics);

    // Get top statistics
    const topStats = await getTopStatistics();

    res.json({
      success: true,
      data: {
        overview: {
          todayReports,
          pendingReports,
          todayDetections,
          activeBlocks,
          totalUsers,
          todayUsers
        },
        trends,
        topStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview',
      error: error.message
    });
  }
};

// Get flagged content for review
const getFlaggedContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || 'pending';
    const severity = req.query.severity;
    const platform = req.query.platform;

    // Build query
    let query = { status };
    if (severity) query.severity = severity;
    if (platform) query.platform = platform;

    const skip = (page - 1) * limit;

    // Get reports with user info
    const reports = await Report.find(query)
      .populate('userId', 'username email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);

    // Format response
    const flaggedContent = reports.map(report => ({
      id: report._id,
      content: report.content.substring(0, 200) + (report.content.length > 200 ? '...' : ''),
      fullContent: report.content,
      reason: report.reason,
      severity: report.severity,
      platform: report.platform,
      url: report.url,
      reporter: {
        username: report.userId?.username || 'Unknown',
        email: report.userId?.email || 'Unknown'
      },
      targetUser: report.targetUser,
      createdAt: report.createdAt,
      status: report.status,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt
    }));

    res.json({
      success: true,
      data: {
        reports: flaggedContent,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          severity,
          platform
        }
      }
    });

  } catch (error) {
    console.error('Get flagged content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get flagged content',
      error: error.message
    });
  }
};

// Review a report (approve/dismiss)
const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user.userId;

    if (!['approve', 'dismiss', 'resolve'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use approve, dismiss, or resolve'
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report status
    let newStatus = 'reviewed';
    if (action === 'resolve') newStatus = 'resolved';
    if (action === 'dismiss') newStatus = 'dismissed';

    await report.markAsReviewed(adminId, notes);
    report.status = newStatus;
    await report.save();

    // If approved, consider blocking the reported user
    if (action === 'approve' && report.targetUser && report.targetUser.username) {
      await handleApprovedReport(report);
    }

    res.json({
      success: true,
      message: `Report ${action}ed successfully`,
      data: {
        reportId: report._id,
        status: report.status,
        action: action
      }
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review report',
      error: error.message
    });
  }
};

// Get user violations and management
const getUserViolations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'reportCount'; // reportCount, lastViolation, riskScore

    const skip = (page - 1) * limit;

    // Aggregate user violation data
    const pipeline = [
      {
        $lookup: {
          from: 'reports',
          localField: '_id',
          foreignField: 'userId',
          as: 'userReports'
        }
      },
      {
        $lookup: {
          from: 'reports',
          let: { username: '$username' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$targetUser.username', '$$username']
                }
              }
            }
          ],
          as: 'reportsAgainst'
        }
      },
      {
        $lookup: {
          from: 'blocks',
          let: { username: '$username' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$blockedUser.username', '$$username']
                },
                'blockStatus.isActive': true
              }
            }
          ],
          as: 'activeBlocks'
        }
      },
      {
        $addFields: {
          reportCount: { $size: '$userReports' },
          reportsAgainstCount: { $size: '$reportsAgainst' },
          activeBlockCount: { $size: '$activeBlocks' },
          riskScore: {
            $add: [
              { $multiply: [{ $size: '$reportsAgainst' }, 10] },
              { $multiply: [{ $size: '$activeBlocks' }, 20] },
              { $ifNull: ['$stats.violationCount', 0] }
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { reportCount: { $gt: 0 } },
            { reportsAgainstCount: { $gt: 0 } },
            { activeBlockCount: { $gt: 0 } }
          ]
        }
      },
      {
        $sort: getSortQuery(sortBy)
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const users = await User.aggregate(pipeline);

    // Get total count
    const totalPipeline = [...pipeline.slice(0, -2)];
    totalPipeline.push({ $count: 'total' });
    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          reportCount: user.reportCount,
          reportsAgainstCount: user.reportsAgainstCount,
          activeBlockCount: user.activeBlockCount,
          riskScore: user.riskScore,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user violations',
      error: error.message
    });
  }
};

// Manage user (activate/deactivate/delete)
const manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.userId;

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use activate, deactivate, or delete'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from managing other admins
    if (user.role === 'admin' && req.user.role === 'admin' && userId !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot manage other admin accounts'
      });
    }

    let result;

    switch (action) {
      case 'activate':
        user.isActive = true;
        await user.save();
        result = 'User activated successfully';
        break;

      case 'deactivate':
        user.isActive = false;
        await user.save();
        result = 'User deactivated successfully';
        break;

      case 'delete':
        // Soft delete - just deactivate and mark
        user.isActive = false;
        user.deletedAt = new Date();
        user.deletedBy = adminId;
        user.deleteReason = reason;
        await user.save();
        result = 'User deleted successfully';
        break;
    }

    // Log admin action
    console.log(`Admin ${adminId} performed ${action} on user ${userId}. Reason: ${reason || 'None'}`);

    res.json({
      success: true,
      message: result,
      data: {
        userId: user._id,
        action: action,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Manage user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage user',
      error: error.message
    });
  }
};

// Get analytics data for charts
const getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || 'daily'; // daily, weekly, monthly
    const days = parseInt(req.query.days) || 30;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get analytics data
    const analytics = await Analytics.getAnalyticsRange(startDate, endDate, period);

    // If no pre-calculated analytics, generate basic stats
    let chartData;
    if (analytics.length === 0) {
      chartData = await generateBasicAnalytics(startDate, endDate, period);
    } else {
      chartData = formatAnalyticsForCharts(analytics);
    }

    res.json({
      success: true,
      data: {
        period,
        days,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        charts: chartData
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

// Helper functions
const calculateTrends = (weeklyData) => {
  if (weeklyData.length < 2) return {};

  const latest = weeklyData[weeklyData.length - 1];
  const previous = weeklyData[weeklyData.length - 2];

  return {
    reports: calculatePercentageChange(
      latest?.reports?.total || 0,
      previous?.reports?.total || 0
    ),
    detections: calculatePercentageChange(
      latest?.detections?.total || 0,
      previous?.detections?.total || 0
    ),
    blocks: calculatePercentageChange(
      latest?.blocks?.total || 0,
      previous?.blocks?.total || 0
    ),
    users: calculatePercentageChange(
      latest?.users?.active || 0,
      previous?.users?.active || 0
    )
  };
};

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getTopStatistics = async () => {
  // Get most reported platforms
  const topPlatforms = await Report.aggregate([
    { $group: { _id: '$platform', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Get most common violation types
  const topViolations = await Report.aggregate([
    { $group: { _id: '$reason', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    topPlatforms: topPlatforms.map(p => ({ platform: p._id, count: p.count })),
    topViolations: topViolations.map(v => ({ reason: v._id, count: v.count }))
  };
};

const getSortQuery = (sortBy) => {
  switch (sortBy) {
    case 'lastViolation':
      return { 'stats.lastViolation': -1 };
    case 'riskScore':
      return { riskScore: -1 };
    default:
      return { reportCount: -1 };
  }
};

const handleApprovedReport = async (report) => {
  // Check if user should be blocked based on approved reports
  const approvedReports = await Report.countDocuments({
    'targetUser.username': report.targetUser.username,
    'targetUser.platform': report.targetUser.platform,
    status: 'approved'
  });

  // Auto-block after 3 approved reports
  if (approvedReports >= 3) {
    const existingBlock = await Block.findOne({
      'blockedUser.username': report.targetUser.username,
      'blockedUser.platform': report.targetUser.platform,
      'blockStatus.isActive': true
    });

    if (!existingBlock) {
      const newBlock = new Block({
        userId: report.userId,
        blockedUser: {
          username: report.targetUser.username,
          platform: report.targetUser.platform,
          profileUrl: report.targetUser.profileUrl
        },
        blockReason: {
          reason: 'multiple-violations',
          violationCount: approvedReports,
          violationTypes: [report.reason],
          triggerContent: report.content.substring(0, 500)
        },
        blockStatus: {
          blockType: 'temporary',
          duration: 60 // 1 hour
        },
        metadata: {
          autoBlocked: true,
          adminTriggered: true
        }
      });

      await newBlock.save();
    }
  }
};

const generateBasicAnalytics = async (startDate, endDate, period) => {
  // Generate basic analytics if pre-calculated ones don't exist
  const reports = await Report.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const detections = await Detection.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    reports: reports.map(r => ({ date: r._id, value: r.count })),
    detections: detections.map(d => ({ date: d._id, value: d.count }))
  };
};

const formatAnalyticsForCharts = (analytics) => {
  return {
    reports: analytics.map(a => ({
      date: a.period.date.toISOString().split('T')[0],
      value: a.reports.total
    })),
    detections: analytics.map(a => ({
      date: a.period.date.toISOString().split('T')[0],
      value: a.detections.total
    })),
    blocks: analytics.map(a => ({
      date: a.period.date.toISOString().split('T')[0],
      value: a.blocks.total
    }))
  };
};

module.exports = {
  getDashboardOverview,
  getFlaggedContent,
  reviewReport,
  getUserViolations,
  manageUser,
  getAnalytics
};