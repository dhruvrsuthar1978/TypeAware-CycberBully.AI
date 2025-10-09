// services/analyticsService-enhanced.js
const Analytics = require('../models/Analytics');
const Report = require('../models/Report');
const User = require('../models/User');

class AnalyticsService {
  // ================================
  // 🏠 DASHBOARD KPI METRICS
  // ================================
  async getDashboardKPIs() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get total users
      const totalUsers = await User.countDocuments();

      // Get active users (users who have logged in within last 30 days)
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: thirtyDaysAgo }
      });

      // Get total reports
      const totalReports = await Report.countDocuments();

      // Get pending reports
      const pendingReports = await Report.countDocuments({
        status: 'pending'
      });

      // Get resolved reports
      const resolvedReports = await Report.countDocuments({
        status: 'resolved'
      });

      // Get system health metrics
      const systemHealth = await this.getSystemHealth();

      return {
        totalUsers,
        activeUsers,
        totalReports,
        pendingReports,
        resolvedReports,
        systemHealth,
        lastUpdated: now
      };
    } catch (error) {
      console.error('[AnalyticsService] getDashboardKPIs:', error);
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

      if (filters.severity) {
        query.severity = filters.severity;
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.dateRange) {
        query.createdAt = {
          $gte: new Date(filters.dateRange.start),
          $lte: new Date(filters.dateRange.end)
        };
      }

      // Get reports with pagination
      const reports = await Report.find(query)
        .populate('reporterId', 'username email')
        .populate('assignedTo', 'username')
        .sort({ createdAt: -1, severity: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const total = await Report.countDocuments(query);

      // Calculate risk levels
      const reportsWithRisk = reports.map(report => ({
        ...report,
        riskLevel: this.calculateRiskLevel(report)
      }));

      return {
        reports: reportsWithRisk,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] getModerationQueue:', error);
      throw error;
    }
  }

  // ================================
  // 📊 SYSTEM ANALYTICS DATA
  // ================================
  async getSystemAnalyticsData(timeframe = '30d') {
    try {
      const now = new Date();
      const startDate = this.getStartDate(timeframe);

      // Get analytics data for the timeframe
      const analytics = await Analytics.find({
        date: { $gte: startDate, $lte: now }
      }).sort({ date: 1 });

      // Aggregate data by day
      const dailyData = analytics.reduce((acc, item) => {
        const dateKey = item.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            messagesScanned: 0,
            threatsDetected: 0,
            reportsSubmitted: 0,
            usersActive: 0
          };
        }
        acc[dateKey].messagesScanned += item.messagesScanned || 0;
        acc[dateKey].threatsDetected += item.threatsDetected || 0;
        acc[dateKey].reportsSubmitted += item.reportsSubmitted || 0;
        acc[dateKey].usersActive += item.usersActive || 0;
        return acc;
      }, {});

      return {
        timeframe,
        data: Object.values(dailyData),
        summary: {
          totalMessagesScanned: Object.values(dailyData).reduce((sum, day) => sum + day.messagesScanned, 0),
          totalThreatsDetected: Object.values(dailyData).reduce((sum, day) => sum + day.threatsDetected, 0),
          totalReportsSubmitted: Object.values(dailyData).reduce((sum, day) => sum + day.reportsSubmitted, 0),
          averageUsersActive: Math.round(Object.values(dailyData).reduce((sum, day) => sum + day.usersActive, 0) / Object.keys(dailyData).length) || 0
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] getSystemAnalyticsData:', error);
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

      if (status !== 'all') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Get users with pagination
      const users = await User.find(query)
        .select('username email status role createdAt lastLogin stats')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count
      const total = await User.countDocuments(query);

      // Add risk levels and format data
      const usersWithRisk = users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        stats: user.stats,
        riskLevel: this.calculateUserRiskLevel(user)
      }));

      return {
        users: usersWithRisk,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] getUserManagementData:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 HELPER METHODS
  // ================================

  async getSystemHealth() {
    try {
      // Check database connectivity
      const dbStatus = await this.checkDatabaseHealth();

      // Check recent activity
      const recentActivity = await this.getRecentActivity();

      // Calculate uptime (simplified)
      const uptime = process.uptime();

      return {
        database: dbStatus ? 'healthy' : 'unhealthy',
        recentActivity,
        uptime: Math.floor(uptime / 3600), // hours
        status: dbStatus ? 'operational' : 'degraded'
      };
    } catch (error) {
      console.error('[AnalyticsService] getSystemHealth:', error);
      return {
        database: 'unknown',
        recentActivity: 0,
        uptime: 0,
        status: 'error'
      };
    }
  }

  async checkDatabaseHealth() {
    try {
      await User.findOne().limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRecentActivity() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentReports = await Report.countDocuments({
        createdAt: { $gte: oneHourAgo }
      });
      return recentReports;
    } catch (error) {
      return 0;
    }
  }

  getStartDate(timeframe) {
    const now = new Date();
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));

    switch (unit) {
      case 'd':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'w':
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateUserRiskLevel(user) {
    let riskScore = 0;

    // Risk based on reports submitted
    if (user.stats?.reportsSubmitted > 10) riskScore += 2;
    else if (user.stats?.reportsSubmitted > 5) riskScore += 1;

    // Risk based on account age
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    if (daysOld < 7) riskScore += 1;

    // Risk based on status
    if (user.status === 'suspended') riskScore += 3;
    else if (user.status === 'inactive') riskScore += 1;

    if (riskScore >= 3) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  calculateRiskLevel(report) {
    let riskScore = 0;

    // Risk based on severity
    if (report.severity === 'high') riskScore += 3;
    else if (report.severity === 'medium') riskScore += 2;
    else if (report.severity === 'low') riskScore += 1;

    // Risk based on category
    if (report.category === 'harassment' || report.category === 'threat') riskScore += 2;
    else if (report.category === 'spam' || report.category === 'abusive') riskScore += 1;

    // Risk based on content length (longer content might be more detailed/serious)
    if (report.content && report.content.length > 500) riskScore += 1;

    // Risk based on reporter credibility (if available)
    if (report.reporterCredibility === 'high') riskScore += 1;
    else if (report.reporterCredibility === 'low') riskScore -= 1;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  // ================================
  // 📊 EXISTING METHODS (for compatibility)
  // ================================

  async getSystemAnalytics() {
    return await this.getDashboardKPIs();
  }

  async getAbusiveTermsStats(timeframe = '30d') {
    const startDate = this.getStartDate(timeframe);
    const reports = await Report.find({
      createdAt: { $gte: startDate },
      category: 'abusive'
    });

    return {
      total: reports.length,
      timeframe
    };
  }

  async getPlatformStats(timeframe = '30d') {
    const startDate = this.getStartDate(timeframe);
    const analytics = await Analytics.find({
      date: { $gte: startDate }
    });

    return {
      totalMessages: analytics.reduce((sum, a) => sum + (a.messagesScanned || 0), 0),
      totalThreats: analytics.reduce((sum, a) => sum + (a.threatsDetected || 0), 0),
      timeframe
    };
  }

  async getDetectionTrends(timeframe = '30d', groupBy = 'day') {
    const startDate = this.getStartDate(timeframe);
    const analytics = await Analytics.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    return analytics.map(a => ({
      date: a.date,
      detections: a.threatsDetected || 0
    }));
  }

  async getUserEngagementStats(timeframe = '30d') {
    const startDate = this.getStartDate(timeframe);
    const users = await User.countDocuments({
      lastLogin: { $gte: startDate }
    });

    return {
      activeUsers: users,
      timeframe
    };
  }

  async getTopFlaggedUsers(limit = 10, timeframe = '30d') {
    const startDate = this.getStartDate(timeframe);
    const reports = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$reportedUserId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return reports;
  }

  async getRecentlyFlaggedContent(limit = 20, offset = 0) {
    const reports = await Report.find()
      .populate('reporterId', 'username')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return reports;
  }

  async getDashboardSummary() {
    return await this.getDashboardKPIs();
  }

  async exportAnalyticsData(type, timeframe, format) {
    // Simplified export - in real implementation, would generate CSV/JSON
    return `Export data for ${type} in ${timeframe} format: ${format}`;
  }

  async getReportsAnalytics() {
    const total = await Report.countDocuments();
    const pending = await Report.countDocuments({ status: 'pending' });
    const resolved = await Report.countDocuments({ status: 'resolved' });

    return {
      total,
      pending,
      resolved
    };
  }

  async getUsersAnalytics() {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: 'active' });

    return {
      total,
      active
    };
  }
}

module.exports = AnalyticsService;
