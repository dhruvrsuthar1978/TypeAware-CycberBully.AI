// services/analyticsService-enhanced.js

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

  // ================================
  // 🏠 DASHBOARD KPI METRICS
  // ================================
  async getDashboardKPIs() {
    try {
      // Get pending reports count
      const pendingReports = await Report.countDocuments({ status: 'pending' });

      // Get moderation actions in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentReports = await Report.find({
        createdAt: { $gte: yesterday },
        status: { $in: ['confirmed', 'dismissed'] }
      });

      const moderationActions = {
        total: recentReports.length,
        warnings: recentReports.filter(r => r.adminReview?.decision === 'confirmed' && r.content.severity === 'medium').length,
        bans: recentReports.filter(r => r.adminReview?.decision === 'confirmed' && r.content.severity === 'critical').length
      };

      // Get active users in last 24 hours
      const activeUsers = await User.countDocuments({
        'stats.lastActivity': { $gte: yesterday }
      });

      // System status (simplified - could be enhanced with health checks)
      const systemStatus = 'healthy'; // Could check database connectivity, etc.

      return {
        pendingReports,
        moderationActions,
        activeUsers,
        systemStatus,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      throw error;
    }
  }

  // ================================
  // 📋 MODERATION QUEUE
  // ================================
  async getModerationQueue(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Build query based on filters
      const query = { status: 'pending' };

      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }
      if (filters.severity && filters.severity !== 'all') {
        query['content.severity'] = filters.severity;
      }
      if (filters.platform && filters.platform !== 'all') {
        query['context.platform'] = filters.platform;
      }

      const reports = await Report.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Report.countDocuments(query);

      return {
        reports: reports.map(report => ({
          id: report._id,
          userId: report.userId?.username || 'Anonymous',
          content: report.content.original,
          reason: report.classification.category,
          severity: report.content.severity,
          platform: report.context.platform,
          status: report.status,
          createdAt: report.createdAt
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  }

  // ================================
  // 📊 SYSTEM ANALYTICS DATA
  // ================================
  async getSystemAnalyticsData(timeframe = '30d') {
    try {
      const startDate = new Date(Date.now() - this.parseTimeframe(timeframe));

      // Get abuse types data
      const abuseTypesPipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$classification.category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      const abuseTypesData = await Report.aggregate(abuseTypesPipeline);
      const abuseTypes = {};
      abuseTypesData.forEach(item => {
        abuseTypes[item._id || 'unknown'] = item.count;
      });

      // Get monthly growth data (last 6 months)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i, 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const reportsCount = await Report.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd }
        });

        const usersCount = await User.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd }
        });

        monthlyGrowth.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          reports: reportsCount,
          users: usersCount
        });
      }

      return {
        abuseTypes,
        monthlyGrowth,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching system analytics data:', error);
      throw error;
    }
  }

  // ================================
  // 👥 USER MANAGEMENT DATA
  // ================================
  async getUserManagementData(search = '', status = 'all', page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (status && status !== 'all') {
        query.status = status;
      }

      const users = await User.find(query)
        .select('username email stats status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments(query);

      return {
        users: users.map(user => ({
          userId: user._id,
          username: user.username,
          email: user.email,
          totalReports: user.stats?.reportsSubmitted || 0,
          riskLevel: this.calculateRiskLevel(user.stats),
          status: user.status || 'active',
          lastActive: user.stats?.lastActivity || user.createdAt
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching user management data:', error);
      throw error;
    }
  }

  // Helper method to calculate risk level based on user stats
  calculateRiskLevel(stats) {
    if (!stats) return 'Low';

    const reports = stats.reportsSubmitted || 0;
    const threats = stats.threatsDetected || 0;

    if (reports >= 10 || threats >= 5) return 'High';
    if (reports >= 5 || threats >= 2) return 'Medium';
    return 'Low';
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
