// services/analyticsService.js

const Analytics = require('../models/Analytics');
const Report = require('../models/Report');
const User = require('../models/User');

class AnalyticsService {
  // Get system-wide analytics overview
  async getSystemAnalytics() {
    try {
      // Get basic counts from database
      const totalUsers = await User.countDocuments();
      const totalReports = await Report.countDocuments();
      const pendingReports = await Report.countDocuments({ status: 'pending' });
      const resolvedReports = await Report.countDocuments({ status: 'resolved' });

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = await User.countDocuments({ 'stats.lastActivity': { $gte: yesterday } });
      const recentReports = await Report.countDocuments({ createdAt: { $gte: yesterday } });

      return {
        totalUsers,
        activeUsers,
        totalReports,
        pendingReports,
        resolvedReports,
        recentReports,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      // Return basic fallback data
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        recentReports: 0,
        lastUpdated: new Date()
      };
    }
  }

  // Get common abusive terms statistics
  async getAbusiveTermsStats(timeframe = '30d') {
    try {
      // This would require more complex aggregation on report content
      // For now, return placeholder data
      return {
        timeframe,
        topTerms: [
          { term: 'example', count: 10, percentage: 25.0 },
          { term: 'test', count: 8, percentage: 20.0 }
        ],
        totalDetections: 40,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching abusive terms stats:', error);
      throw error;
    }
  }

  // Get detections by platform statistics
  async getPlatformStats(timeframe = '30d') {
    try {
      // Aggregate reports by platform
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - this.parseTimeframe(timeframe))
            }
          }
        },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      const platformStats = await Report.aggregate(pipeline);

      const total = platformStats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        timeframe,
        platforms: platformStats.map(stat => ({
          platform: stat._id || 'unknown',
          count: stat.count,
          percentage: total > 0 ? (stat.count / total * 100).toFixed(1) : 0
        })),
        totalDetections: total,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  // Get detections over time (trend analysis)
  async getDetectionTrends(timeframe = '30d', groupBy = 'day') {
    try {
      const groupFormat = groupBy === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - this.parseTimeframe(timeframe))
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ];

      const trends = await Report.aggregate(pipeline);

      return {
        timeframe,
        groupBy,
        trends: trends.map(trend => ({
          date: trend._id,
          count: trend.count
        })),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching detection trends:', error);
      throw error;
    }
  }

  // Get user engagement analytics
  async getUserEngagementStats(timeframe = '30d') {
    try {
      const startDate = new Date(Date.now() - this.parseTimeframe(timeframe));

      // Get user activity stats
      const activeUsers = await User.countDocuments({
        'stats.lastActivity': { $gte: startDate }
      });

      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
      });

      const totalUsers = await User.countDocuments();

      return {
        timeframe,
        activeUsers,
        newUsers,
        totalUsers,
        engagementRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching user engagement stats:', error);
      throw error;
    }
  }

  // Get top flagged users (anonymous UUIDs)
  async getTopFlaggedUsers(limit = 10, timeframe = '30d') {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - this.parseTimeframe(timeframe))
            }
          }
        },
        {
          $group: {
            _id: '$browserUUID',
            count: { $sum: 1 },
            lastActivity: { $max: '$createdAt' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ];

      const topUsers = await Report.aggregate(pipeline);

      return {
        timeframe,
        limit,
        topUsers: topUsers.map(user => ({
          browserUUID: user._id || 'anonymous',
          reportCount: user.count,
          lastActivity: user.lastActivity
        })),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching top flagged users:', error);
      throw error;
    }
  }

  // Get recently flagged content
  async getRecentlyFlaggedContent(limit = 20, offset = 0) {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .select('content platform severity createdAt browserUUID')
        .lean();

      return {
        limit,
        offset,
        content: reports.map(report => ({
          id: report._id,
          content: report.content,
          platform: report.platform,
          severity: report.severity,
          flaggedAt: report.createdAt,
          browserUUID: report.browserUUID
        })),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching recently flagged content:', error);
      throw error;
    }
  }

  // Get analytics dashboard summary
  async getDashboardSummary() {
    try {
      const systemAnalytics = await this.getSystemAnalytics();

      return {
        summary: {
          totalUsers: systemAnalytics.totalUsers,
          activeUsers: systemAnalytics.activeUsers,
          totalReports: systemAnalytics.totalReports,
          pendingReports: systemAnalytics.pendingReports,
          resolvedReports: systemAnalytics.resolvedReports
        },
        recentActivity: {
          reportsLast24h: systemAnalytics.recentReports,
          usersLast24h: systemAnalytics.activeUsers
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  // Export analytics data (CSV format)
  async exportAnalyticsData(type, timeframe = '30d', format = 'csv') {
    try {
      // This would implement CSV export functionality
      // For now, return placeholder
      const data = `Type: ${type}\nTimeframe: ${timeframe}\nFormat: ${format}\nExported at: ${new Date().toISOString()}\n\nNo data available for export.`;
      return data;
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Helper method to parse timeframe strings
  parseTimeframe(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));

    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000; // default 30 days
    }
  }
}

module.exports = new AnalyticsService();
