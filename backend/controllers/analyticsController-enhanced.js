// controllers/analyticsController-enhanced.js
const AnalyticsService = require('../services/analyticsService-enhanced');
const analyticsService = new AnalyticsService();
const { createResponse, createErrorResponse } = require('../utils/responseUtils');
const User = require('../models/User');
const Report = require('../models/Report');

class AnalyticsController {
  // ================================
  // 📊 System-wide Overview
  // ================================
  async getSystemAnalytics(req, res) {
    try {
      const analytics = await analyticsService.getSystemAnalytics();
      return res.json(createResponse('System analytics retrieved successfully', analytics));
    } catch (error) {
      console.error('[AnalyticsController] getSystemAnalytics:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch system analytics', { error: error.message }));
    }
  }

  // ================================
  // 🗣️ Abusive Terms Statistics
  // ================================
  async getAbusiveTermsStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const stats = await analyticsService.getAbusiveTermsStats(timeframe);
      return res.json(createResponse('Abusive terms statistics retrieved successfully', stats));
    } catch (error) {
      console.error('[AnalyticsController] getAbusiveTermsStats:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch abusive terms statistics', { error: error.message }));
    }
  }

  // ================================
  // 💻 Platform Statistics
  // ================================
  async getPlatformStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const stats = await analyticsService.getPlatformStats(timeframe);
      return res.json(createResponse('Platform statistics retrieved successfully', stats));
    } catch (error) {
      console.error('[AnalyticsController] getPlatformStats:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch platform statistics', { error: error.message }));
    }
  }

  // ================================
  // 📈 Detection Trends
  // ================================
  async getDetectionTrends(req, res) {
    try {
      const { timeframe = '30d', groupBy = 'day' } = req.query;
      const trends = await analyticsService.getDetectionTrends(timeframe, groupBy);
      return res.json(createResponse('Detection trends retrieved successfully', trends));
    } catch (error) {
      console.error('[AnalyticsController] getDetectionTrends:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch detection trends', { error: error.message }));
    }
  }

  // ================================
  // 👥 User Engagement
  // ================================
  async getUserEngagementStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const stats = await analyticsService.getUserEngagementStats(timeframe);
      return res.json(createResponse('User engagement statistics retrieved successfully', stats));
    } catch (error) {
      console.error('[AnalyticsController] getUserEngagementStats:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch user engagement statistics', { error: error.message }));
    }
  }

  // ================================
  // 🚨 Top Flagged Users
  // ================================
  async getTopFlaggedUsers(req, res) {
    try {
      const { limit = 10, timeframe = '30d' } = req.query;
      const topUsers = await analyticsService.getTopFlaggedUsers(limit, timeframe);
      return res.json(createResponse('Top flagged users retrieved successfully', topUsers));
    } catch (error) {
      console.error('[AnalyticsController] getTopFlaggedUsers:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch top flagged users', { error: error.message }));
    }
  }

  // ================================
  // ⚠️ Recently Flagged Content
  // ================================
  async getRecentlyFlaggedContent(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const flaggedContent = await analyticsService.getRecentlyFlaggedContent(limit, offset);
      return res.json(createResponse('Recently flagged content retrieved successfully', flaggedContent));
    } catch (error) {
      console.error('[AnalyticsController] getRecentlyFlaggedContent:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch recently flagged content', { error: error.message }));
    }
  }

  // ================================
  // 🧮 Dashboard Summary
  // ================================
  async getDashboardSummary(req, res) {
    try {
      const summary = await analyticsService.getDashboardSummary();
      return res.json(createResponse('Dashboard summary retrieved successfully', summary));
    } catch (error) {
      console.error('[AnalyticsController] getDashboardSummary:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch dashboard summary', { error: error.message }));
    }
  }

  // ================================
  // 📂 Export Data
  // ================================
  async exportAnalyticsData(req, res) {
    try {
      const { format = 'csv', type, timeframe = '30d' } = req.query;
      if (!type) return res.status(400).json(createErrorResponse('Validation Error', 'Export type is required'));

      const exportData = await analyticsService.exportAnalyticsData(type, timeframe, format);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="typeaware-analytics-${type}-${Date.now()}.${format}"`
      );

      return res.send(exportData);
    } catch (error) {
      console.error('[AnalyticsController] exportAnalyticsData:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to export analytics data', { error: error.message }));
    }
  }

  // ================================
  // ✅ FIXED: Reports Analytics
  // ================================
  async getReportsAnalytics(req, res) {
    try {
      const data = await analyticsService.getReportsAnalytics?.();
      return res.json(createResponse('Reports analytics retrieved successfully', data || []));
    } catch (error) {
      console.error('[AnalyticsController] getReportsAnalytics:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch reports analytics', { error: error.message }));
    }
  }

  // ================================
  // ✅ FIXED: Users Analytics
  // ================================
  async getUsersAnalytics(req, res) {
    try {
      const data = await analyticsService.getUsersAnalytics?.();
      return res.json(createResponse('Users analytics retrieved successfully', data || []));
    } catch (error) {
      console.error('[AnalyticsController] getUsersAnalytics:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch users analytics', { error: error.message }));
    }
  }

  // ================================
  // 👤 User-specific Analytics
  // ================================
  async getUserAnalytics(req, res) {
    try {
      const userId = req.userId;

      // Get user with stats
      const user = await User.findById(userId).select('stats createdAt');

      if (!user) {
        return res.status(404).json(createErrorResponse('User Not Found', 'User not found'));
      }

      // Get user's reports count
      const userReportsCount = await Report.countDocuments({ reporterId: userId });

      // Update reportsSubmitted in user stats if different
      if (user.stats.reportsSubmitted !== userReportsCount) {
        user.stats.reportsSubmitted = userReportsCount;
        await user.save();
      }

      // Return user analytics data
      const analyticsData = {
        messagesScanned: user.stats.messagesScanned || 0,
        threatsDetected: user.stats.threatsDetected || 0,
        reportsSubmitted: user.stats.reportsSubmitted || 0,
        positivityScore: user.stats.positivityScore || 98,
        accountCreated: user.createdAt
      };

      return res.json(createResponse('User analytics retrieved successfully', analyticsData));
    } catch (error) {
      console.error('[AnalyticsController] getUserAnalytics:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to retrieve user analytics', { error: error.message }));
    }
  }

  // ================================
  // 🏠 DASHBOARD KPI METRICS
  // ================================
  async getDashboardKPIs(req, res) {
    try {
      const kpis = await analyticsService.getDashboardKPIs();
      return res.json(createResponse('Dashboard KPIs retrieved successfully', kpis));
    } catch (error) {
      console.error('[AnalyticsController] getDashboardKPIs:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch dashboard KPIs', { error: error.message }));
    }
  }

  // ================================
  // 📋 MODERATION QUEUE
  // ================================
  async getModerationQueue(req, res) {
    try {
      const { filters = {}, page = 1, limit = 20 } = req.query;
      const queue = await analyticsService.getModerationQueue(filters, page, limit);
      return res.json(createResponse('Moderation queue retrieved successfully', queue));
    } catch (error) {
      console.error('[AnalyticsController] getModerationQueue:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch moderation queue', { error: error.message }));
    }
  }

  // ================================
  // 📊 SYSTEM ANALYTICS DATA
  // ================================
  async getSystemAnalyticsData(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const data = await analyticsService.getSystemAnalyticsData(timeframe);
      return res.json(createResponse('System analytics data retrieved successfully', data));
    } catch (error) {
      console.error('[AnalyticsController] getSystemAnalyticsData:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch system analytics data', { error: error.message }));
    }
  }

  // ================================
  // 👥 USER MANAGEMENT DATA
  // ================================
  async getUserManagementData(req, res) {
    try {
      const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
      const data = await analyticsService.getUserManagementData(search, status, page, limit);
      return res.json(createResponse('User management data retrieved successfully', data));
    } catch (error) {
      console.error('[AnalyticsController] getUserManagementData:', error);
      return res.status(500).json(createErrorResponse('Analytics Error', 'Failed to fetch user management data', { error: error.message }));
    }
  }
}

module.exports = AnalyticsController;
