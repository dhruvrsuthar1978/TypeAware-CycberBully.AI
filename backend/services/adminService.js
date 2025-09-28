const User = require('../models/User');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

class AdminService {
  // Get dashboard overview with key metrics
  async getDashboardOverview(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // System overview stats
      const [
        totalUsers,
        totalReports,
        pendingReports,
        confirmedReports,
        recentUsers,
        recentReports
      ] = await Promise.all([
        User.countDocuments(),
        Report.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'confirmed' }),
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Report.countDocuments({ createdAt: { $gte: startDate } })
      ]);

      // Category breakdown
      const topCategories = await Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$classification.category',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$classification.confidence' }
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
            count: { $sum: 1 },
            categories: { $addToSet: '$classification.category' }
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
            reports: { $sum: 1 },
            users: { $addToSet: '$userId' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Severity breakdown
      const severityBreakdown = await Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$content.severity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
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
          dailyActivity: dailyActivity.map(day => ({
            ...day,
            uniqueUsers: day.users.filter(u => u !== null).length
          })),
          severityBreakdown
        },
        summary: {
          activeReports: pendingReports,
          reviewedReports: confirmedReports,
          newUsersGrowth: recentUsers,
          activityGrowth: recentReports,
          totalSystemActivity: totalUsers + totalReports
        },
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      };
    } catch (error) {
      throw new Error(`Error getting dashboard overview: ${error.message}`);
    }
  }

  // Get flagged reports with advanced filtering
  async getFlaggedReports(page = 1, limit = 50, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        Report.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username email role')
          .populate('adminReview.reviewedBy', 'username email')
          .lean(),
        Report.countDocuments(filters)
      ]);

      return { reports, total };
    } catch (error) {
      throw new Error(`Error fetching flagged reports: ${error.message}`);
    }
  }

  // Get users with most flags
  async getFlaggedUsers(limit = 20, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const flaggedUsers = await Report.aggregate([
        {
          $match: {
            userId: { $ne: null },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalReports: { $sum: 1 },
            confirmedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            categories: { $addToSet: '$classification.category' },
            platforms: { $addToSet: '$context.platform' },
            lastReport: { $max: '$createdAt' },
            avgSeverity: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$content.severity', 'low'] }, then: 1 },
                    { case: { $eq: ['$content.severity', 'medium'] }, then: 2 },
                    { case: { $eq: ['$content.severity', 'high'] }, then: 3 },
                    { case: { $eq: ['$content.severity', 'critical'] }, then: 4 }
                  ],
                  default: 2
                }
              }
            }
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
            pendingReports: 1,
            categories: 1,
            platforms: 1,
            lastReport: 1,
            avgSeverity: 1,
            riskScore: {
              $multiply: [
                '$avgSeverity',
                { $divide: ['$confirmedReports', { $max: ['$totalReports', 1] }] }
              ]
            },
            'user.username': 1,
            'user.email': 1,
            'user.role': 1,
            'user.isActive': 1,
            'user.createdAt': 1
          }
        }
      ]);

      return {
        users: flaggedUsers,
        total: flaggedUsers.length,
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      };
    } catch (error) {
      throw new Error(`Error fetching flagged users: ${error.message}`);
    }
  }

  // Update user status with audit logging
  async updateUserStatus(userId, isActive, reason = '') {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive,
          ...(isActive ? {} : { deactivatedAt: new Date() })
        },
        { new: true }
      ).select('-password -refreshToken');

      return user;
    } catch (error) {
      throw new Error(`Error updating user status: ${error.message}`);
    }
  }

  // Get comprehensive system analytics
  async getSystemAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Performance metrics
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
            },
            dismissed: {
              $sum: { $cond: [{ $eq: ['$adminReview.decision', 'dismissed'] }, 1, 0] }
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

      // User engagement metrics
      const userEngagement = await User.aggregate([
        { $match: { 'stats.lastActivity': { $gte: startDate } } },
        {
          $group: {
            _id: null,
            activeUsers: { $sum: 1 },
            totalReports: { $sum: '$stats.totalReports' },
            avgReportsPerUser: { $avg: '$stats.totalReports' }
          }
        }
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
        falsePositives: 0,
        dismissed: 0
      };

      const engagement = userEngagement.length > 0 ? userEngagement[0] : {
        activeUsers: 0,
        totalReports: 0,
        avgReportsPerUser: 0
      };

      // Calculate accuracy percentage
      const accuracyRate = accuracy.totalReviewed > 0 
        ? ((accuracy.confirmed / accuracy.totalReviewed) * 100).toFixed(2)
        : 0;

      return {
        data: {
          performance,
          accuracy: {
            ...accuracy,
            accuracyRate: parseFloat(accuracyRate)
          },
          trends: categoryTrends,
          userEngagement: engagement
        },
        summary: {
          totalReports: performance.totalReports,
          accuracyRate: parseFloat(accuracyRate),
          activeUsers: engagement.activeUsers,
          avgProcessingTime: Math.round(performance.avgProcessingTime || 0),
          avgConfidence: Math.round((performance.avgConfidence || 0) * 100)
        },
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      };
    } catch (error) {
      throw new Error(`Error getting system analytics: ${error.message}`);
    }
  }

  // Log admin actions for audit trail
  async logAdminAction(adminId, action, details = {}) {
    try {
      // In a real implementation, this would use an AuditLog model
      // For now, we'll just log to console and return
      console.log(`Admin Action: ${action}`, {
        adminId,
        action,
        details,
        timestamp: new Date().toISOString()
      });

      return {
        adminId,
        action,
        details,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for logging failures
    }
  }

  // Get admin action logs
  async getAdminLogs(options = {}) {
    try {
      const { page = 1, limit = 50, action, adminId, days = 30 } = options;
      
      // Placeholder implementation - in real app would query AuditLog model
      return {
        logs: [],
        total: 0
      };
    } catch (error) {
      throw new Error(`Error fetching admin logs: ${error.message}`);
    }
  }

  // Bulk review reports
  async bulkReviewReports(reportIds, adminId, decision, notes = '') {
    try {
      const results = {
        successful: [],
        failed: []
      };

      for (const reportId of reportIds) {
        try {
          const report = await Report.findById(reportId);
          
          if (!report) {
            results.failed.push({
              reportId,
              error: 'Report not found'
            });
            continue;
          }

          await report.markAsReviewed(adminId, decision, notes);
          
          results.successful.push({
            reportId,
            status: report.status
          });

        } catch (error) {
          results.failed.push({
            reportId,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error performing bulk review: ${error.message}`);
    }
  }

  // Get detailed user information for admin
  async getUserDetailsForAdmin(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpiry')
        .lean();

      if (!user) {
        return null;
      }

      // Get user's report statistics
      const reportStats = await Report.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            confirmedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            categories: { $addToSet: '$classification.category' },
            platforms: { $addToSet: '$context.platform' },
            firstReport: { $min: '$createdAt' },
            lastReport: { $max: '$createdAt' }
          }
        }
      ]);

      const stats = reportStats.length > 0 ? reportStats[0] : {
        totalReports: 0,
        confirmedReports: 0,
        pendingReports: 0,
        categories: [],
        platforms: [],
        firstReport: null,
        lastReport: null
      };

      return {
        ...user,
        reportStatistics: stats,
        riskScore: this.calculateUserRiskScore(stats),
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      throw new Error(`Error getting user details: ${error.message}`);
    }
  }

  // Get platform statistics
  async getPlatformStatistics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const platformStats = await Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$context.platform',
            totalReports: { $sum: 1 },
            categories: { $addToSet: '$classification.category' },
            avgConfidence: { $avg: '$classification.confidence' },
            severityBreakdown: {
              $push: '$content.severity'
            },
            confirmedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            }
          }
        },
        { $sort: { totalReports: -1 } }
      ]);

      // Process severity breakdown for each platform
      const processedStats = platformStats.map(platform => {
        const severityBreakdown = platform.severityBreakdown.reduce((acc, severity) => {
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});

        return {
          ...platform,
          severityBreakdown,
          categoriesCount: platform.categories.length,
          accuracyRate: platform.totalReports > 0 
            ? ((platform.confirmedReports / platform.totalReports) * 100).toFixed(2)
            : 0
        };
      });

      return processedStats;
    } catch (error) {
      throw new Error(`Error getting platform statistics: ${error.message}`);
    }
  }

  // Export reports in various formats
  async exportReports(options = {}) {
    try {
      const { format = 'json', days = 30, status, category } = options;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filter = { createdAt: { $gte: startDate } };
      if (status) filter.status = status;
      if (category) filter['classification.category'] = category;

      const reports = await Report.find(filter)
        .populate('userId', 'username email')
        .populate('adminReview.reviewedBy', 'username')
        .lean()
        .limit(10000); // Limit for performance

      if (format === 'csv') {
        const csvData = this.convertToCSV(reports);
        return {
          data: csvData,
          count: reports.length
        };
      }

      return {
        data: reports,
        count: reports.length
      };
    } catch (error) {
      throw new Error(`Error exporting reports: ${error.message}`);
    }
  }

  // Get moderation queue with priority
  async getModerationQueue(priority = 'high', limit = 25) {
    try {
      const priorityFilters = {
        high: {
          $or: [
            { 'content.severity': 'critical' },
            { 'classification.category': { $in: ['harassment', 'hate_speech', 'threat'] } },
            { 'classification.confidence': { $gte: 0.9 } }
          ]
        },
        medium: {
          'content.severity': { $in: ['medium', 'high'] },
          'classification.confidence': { $gte: 0.7 }
        },
        low: {
          'content.severity': 'low',
          'classification.confidence': { $lt: 0.7 }
        }
      };

      const filter = {
        status: 'pending',
        ...priorityFilters[priority]
      };

      const queue = await Report.find(filter)
        .sort({ 
          createdAt: -1,
          'classification.confidence': -1,
          'content.severity': -1
        })
        .limit(limit)
        .populate('userId', 'username email')
        .lean();

      // Add priority score to each report
      const queueWithScores = queue.map(report => ({
        ...report,
        priorityScore: this.calculatePriorityScore(report)
      }));

      return queueWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
    } catch (error) {
      throw new Error(`Error getting moderation queue: ${error.message}`);
    }
  }

  // Update system settings (placeholder)
  async updateSystemSettings(settings) {
    try {
      // In a real implementation, this would update a SystemSettings model
      console.log('System settings updated:', settings);
      return settings;
    } catch (error) {
      throw new Error(`Error updating system settings: ${error.message}`);
    }
  }

  // Get detection accuracy metrics
  async getDetectionAccuracyMetrics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const accuracyByMethod = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            'adminReview.reviewedBy': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$classification.detectionMethod',
            totalReviewed: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$adminReview.decision', 'confirmed'] }, 1, 0] }
            },
            falsePositives: {
              $sum: { $cond: [{ $eq: ['$adminReview.decision', 'false_positive'] }, 1, 0] }
            },
            avgConfidence: { $avg: '$classification.confidence' }
          }
        },
        {
          $project: {
            _id: 1,
            totalReviewed: 1,
            confirmed: 1,
            falsePositives: 1,
            avgConfidence: 1,
            accuracyRate: {
              $multiply: [
                { $divide: ['$confirmed', '$totalReviewed'] },
                100
              ]
            },
            falsePositiveRate: {
              $multiply: [
                { $divide: ['$falsePositives', '$totalReviewed'] },
                100
              ]
            }
          }
        }
      ]);

      const accuracyByCategory = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            'adminReview.reviewedBy': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$classification.category',
            totalReviewed: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ['$adminReview.decision', 'confirmed'] }, 1, 0] }
            },
            avgConfidence: { $avg: '$classification.confidence' }
          }
        },
        {
          $project: {
            _id: 1,
            totalReviewed: 1,
            confirmed: 1,
            avgConfidence: 1,
            accuracyRate: {
              $multiply: [
                { $divide: ['$confirmed', '$totalReviewed'] },
                100
              ]
            }
          }
        },
        { $sort: { accuracyRate: -1 } }
      ]);

      return {
        byDetectionMethod: accuracyByMethod,
        byCategory: accuracyByCategory,
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      };
    } catch (error) {
      throw new Error(`Error getting detection accuracy metrics: ${error.message}`);
    }
  }

  // Helper methods

  // Calculate user risk score based on report statistics
  calculateUserRiskScore(stats) {
    if (stats.totalReports === 0) return 0;

    const confirmedRate = stats.confirmedReports / stats.totalReports;
    const reportFrequency = stats.totalReports;
    const categoryDiversity = stats.categories.length;

    // Weighted risk calculation
    const riskScore = (
      (confirmedRate * 0.5) +
      (Math.min(reportFrequency / 10, 1) * 0.3) +
      (Math.min(categoryDiversity / 5, 1) * 0.2)
    ) * 100;

    return Math.round(riskScore);
  }

  // Calculate priority score for moderation queue
  calculatePriorityScore(report) {
    let score = 0;

    // Severity weight
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    score += (severityWeights[report.content.severity] || 1) * 25;

    // Confidence weight
    score += report.classification.confidence * 25;

    // Category weight (some categories are more urgent)
    const urgentCategories = ['harassment', 'hate_speech', 'threat', 'violence'];
    if (urgentCategories.includes(report.classification.category)) {
      score += 25;
    }

    // Age weight (older reports get higher priority)
    const ageInHours = (Date.now() - new Date(report.createdAt)) / (1000 * 60 * 60);
    score += Math.min(ageInHours, 24); // Max 24 points for age

    return Math.round(score);
  }

  // Convert reports to CSV format
  convertToCSV(reports) {
    if (reports.length === 0) return '';

    const headers = [
      'ID',
      'Created At',
      'Content',
      'Category',
      'Platform',
      'Severity',
      'Confidence',
      'Status',
      'User',
      'Reviewed By',
      'Decision'
    ];

    const csvRows = [
      headers.join(','),
      ...reports.map(report => [
        report._id,
        report.createdAt,
        `"${report.content.original.replace(/"/g, '""')}"`, // Escape quotes
        report.classification.category,
        report.context.platform,
        report.content.severity,
        report.classification.confidence,
        report.status,
        report.userId?.username || 'Anonymous',
        report.adminReview?.reviewedBy?.username || '',
        report.adminReview?.decision || ''
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

module.exports = new AdminService();