const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');

const router = express.Router();

// All routes are protected by authenticateToken middleware
// Applied in server.js: app.use('/api/analytics', authenticateToken, analyticsRoutes);

// @route   GET /api/analytics/overview
// @desc    Get system overview analytics
// @access  Private (User/Admin)
router.get('/overview', async (req, res) => {
  try {
    // Get date range from query params (default to last 30 days)
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Basic system stats
    const totalReports = await Report.countDocuments({
      createdAt: { $gte: startDate }
    });

    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    const activeUsers = await User.countDocuments({
      'stats.lastActivity': { $gte: startDate }
    });

    // Status breakdown
    const statusBreakdown = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Severity breakdown
    const severityBreakdown = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$content.severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily activity (last 7 days)
    const dailyActivity = await Report.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          reports: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalReports,
        totalUsers,
        activeUsers,
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      },
      breakdowns: {
        status: statusBreakdown,
        severity: severityBreakdown
      },
      trends: {
        daily: dailyActivity
      }
    });

  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch overview analytics'
    });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get abuse categories analytics
// @access  Private (User/Admin)
router.get('/categories', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Category breakdown
    const categoryBreakdown = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top flagged terms
    const topFlaggedTerms = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$content.flaggedTerms' },
      {
        $group: {
          _id: '$content.flaggedTerms.term',
          count: { $sum: 1 },
          avgSeverity: { $avg: { 
            $switch: {
              branches: [
                { case: { $eq: ['$content.flaggedTerms.severity', 'low'] }, then: 1 },
                { case: { $eq: ['$content.flaggedTerms.severity', 'medium'] }, then: 2 },
                { case: { $eq: ['$content.flaggedTerms.severity', 'high'] }, then: 3 },
                { case: { $eq: ['$content.flaggedTerms.severity', 'critical'] }, then: 4 }
              ],
              default: 2
            }
          }}
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      categories: categoryBreakdown,
      flaggedTerms: topFlaggedTerms,
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get categories analytics error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch categories analytics'
    });
  }
});

// @route   GET /api/analytics/platforms
// @desc    Get platform-wise analytics
// @access  Private (User/Admin)
router.get('/platforms', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Platform breakdown
    const platformBreakdown = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$context.platform',
          count: { $sum: 1 },
          categories: { $addToSet: '$classification.category' },
          avgConfidence: { $avg: '$classification.confidence' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Platform vs Category matrix
    const platformCategoryMatrix = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            platform: '$context.platform',
            category: '$classification.category'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.platform',
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          totalReports: { $sum: '$count' }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    res.json({
      platforms: platformBreakdown,
      platformCategoryMatrix,
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get platforms analytics error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch platforms analytics'
    });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get trend analytics
// @access  Private (User/Admin)
router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily trends
    const dailyTrends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            category: '$classification.category'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Hourly distribution
    const hourlyDistribution = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Detection method trends
    const detectionMethodTrends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            method: '$classification.detectionMethod'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          methods: {
            $push: {
              method: '$_id.method',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      dailyTrends,
      hourlyDistribution,
      detectionMethodTrends,
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get trends analytics error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch trends analytics'
    });
  }
});

// @route   GET /api/analytics/user-stats
// @desc    Get current user's personal analytics
// @access  Private (User/Admin)
router.get('/user-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User's report stats
    const userReports = await Report.aggregate([
      { 
        $match: { 
          userId: req.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          categories: { $addToSet: '$classification.category' },
          platforms: { $addToSet: '$context.platform' },
          avgConfidence: { $avg: '$classification.confidence' }
        }
      }
    ]);

    // Daily activity for user
    const dailyActivity = await Report.aggregate([
      { 
        $match: { 
          userId: req.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          reports: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User's category breakdown
    const categoryBreakdown = await Report.aggregate([
      { 
        $match: { 
          userId: req.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const stats = userReports.length > 0 ? userReports[0] : {
      totalReports: 0,
      categories: [],
      platforms: [],
      avgConfidence: 0
    };

    res.json({
      userStats: {
        ...stats,
        categoriesCount: stats.categories.length,
        platformsCount: stats.platforms.length
      },
      dailyActivity,
      categoryBreakdown,
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch user statistics'
    });
  }
});

module.exports = router;