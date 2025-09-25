const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');

const router = express.Router();

// All routes are protected by authenticateToken and requireAdmin middleware
// Applied in server.js: app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Admin only
router.get('/dashboard', async (req, res) => {
  try {
    // Get date range (default last 7 days for dashboard)
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // System overview stats
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const confirmedReports = await Report.countDocuments({ status: 'confirmed' });

    // Recent activity
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: startDate } 
    });
    const recentReports = await Report.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    // Top categories
    const topCategories = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Platform distribution
    const platformDistribution = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$context.platform',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Daily activity trend
    const dailyActivity = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
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
        totalUsers,
        totalReports,
        pendingReports,
        confirmedReports,
        recentUsers,
        recentReports
      },
      analytics: {
        topCategories,
        platformDistribution,
        dailyActivity
      },
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      error: 'Dashboard Error',
      message: 'Unable to fetch dashboard data'
    });
  }
});

// @route   GET /api/admin/reports/pending
// @desc    Get pending reports for review
// @access  Admin only
router.get('/reports/pending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email browserUUIDs');

    const totalPending = await Report.countDocuments({ status: 'pending' });

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPending / limit),
        totalReports: totalPending,
        limit
      }
    });

  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Unable to fetch pending reports'
    });
  }
});

// @route   GET /api/admin/reports/flagged
// @desc    Get recently flagged comments
// @access  Admin only
router.get('/reports/flagged', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const platform = req.query.platform;
    const severity = req.query.severity;

    // Build filter
    let filter = {};
    if (category) filter['classification.category'] = category;
    if (platform) filter['context.platform'] = platform;
    if (severity) filter['content.severity'] = severity;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email')
      .populate('adminReview.reviewedBy', 'username');

    const totalReports = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        limit
      },
      filters: {
        category,
        platform,
        severity
      }
    });

  } catch (error) {
    console.error('Get flagged reports error:', error);
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Unable to fetch flagged reports'
    });
  }
});

// @route   PUT /api/admin/reports/:reportId/review
// @desc    Review a report (approve/reject)
// @access  Admin only
router.put('/reports/:reportId/review', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, notes } = req.body;

    if (!decision || !['confirmed', 'false_positive', 'dismissed'].includes(decision)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Decision must be confirmed, false_positive, or dismissed'
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report Not Found',
        message: 'Report not found'
      });
    }

    // Mark as reviewed
    await report.markAsReviewed(req.userId, decision, notes || '');

    res.json({
      message: 'Report reviewed successfully',
      report: {
        id: report._id,
        status: report.status,
        adminReview: report.adminReview
      }
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      error: 'Review Failed',
      message: 'Unable to review report'
    });
  }
});

// @route   GET /api/admin/users/flagged
// @desc    Get users with most flags
// @access  Admin only
router.get('/users/flagged', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get users with most reports
    const flaggedUsers = await Report.aggregate([
      {
        $match: {
          userId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalReports: { $sum: 1 },
          confirmedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          categories: { $addToSet: '$classification.category' },
          platforms: { $addToSet: '$context.platform' },
          lastReport: { $max: '$createdAt' }
        }
      },
      { $sort: { totalReports: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          totalReports: 1,
          confirmedReports: 1,
          categories: 1,
          platforms: 1,
          lastReport: 1,
          'user.username': 1,
          'user.email': 1,
          'user.role': 1,
          'user.isActive': 1,
          'user.createdAt': 1
        }
      }
    ]);

    res.json({
      users: flaggedUsers,
      total: flaggedUsers.length
    });

  } catch (error) {
    console.error('Get flagged users error:', error);
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Unable to fetch flagged users'
    });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (activate/deactivate)
// @access  Admin only
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Prevent admins from deactivating themselves
    if (userId === req.userId.toString() && !isActive) {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'Unable to update user status'
    });
  }
});

// @route   GET /api/admin/analytics/system
// @desc    Get comprehensive system analytics
// @access  Admin only
router.get('/analytics/system', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // System performance metrics
    const performanceMetrics = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' },
          avgConfidence: { $avg: '$classification.confidence' },
          detectionMethods: {
            $push: '$classification.detectionMethod'
          }
        }
      }
    ]);

    // Detection accuracy (based on admin reviews)
    const accuracyMetrics = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'adminReview.reviewedBy': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalReviewed: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$adminReview.decision', 'confirmed'] }, 1, 0] }
          },
          falsePositives: {
            $sum: { $cond: [{ $eq: ['$adminReview.decision', 'false_positive'] }, 1, 0] }
          }
        }
      }
    ]);

    // Category trends over time
    const categoryTrends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            category: '$classification.category'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const performance = performanceMetrics.length > 0 ? performanceMetrics[0] : {
      totalReports: 0,
      avgProcessingTime: 0,
      avgConfidence: 0,
      detectionMethods: []
    };

    const accuracy = accuracyMetrics.length > 0 ? accuracyMetrics[0] : {
      totalReviewed: 0,
      confirmed: 0,
      falsePositives: 0
    };

    // Calculate accuracy percentage
    const accuracyRate = accuracy.totalReviewed > 0 
      ? ((accuracy.confirmed / accuracy.totalReviewed) * 100).toFixed(2)
      : 0;

    res.json({
      performance,
      accuracy: {
        ...accuracy,
        accuracyRate: parseFloat(accuracyRate)
      },
      trends: categoryTrends,
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });

  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Unable to fetch system analytics'
    });
  }
});

// @route   DELETE /api/admin/reports/:reportId
// @desc    Delete a report (admin only)
// @access  Admin only
router.delete('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report Not Found',
        message: 'Report not found'
      });
    }

    // Log the deletion (you might want to create an audit log)
    console.log(`Report ${reportId} deleted by admin ${req.userId} - Reason: ${reason || 'No reason provided'}`);

    await Report.findByIdAndDelete(reportId);

    res.json({
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Delete Failed',
      message: 'Unable to delete report'
    });
  }
});

module.exports = router;