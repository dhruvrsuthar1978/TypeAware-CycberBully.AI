// controllers/analyticsController.js
const analyticsService = require('../services/analyticsService');
const { createResponse } = require('../utils/responseUtils');

class AnalyticsController {
  // Get system-wide analytics overview
  async getSystemAnalytics(req, res) {
    try {
      const analytics = await analyticsService.getSystemAnalytics();
      
      res.json(createResponse(true, 'System analytics retrieved successfully', analytics));
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch system analytics'));
    }
  }

  // Get common abusive terms statistics
  async getAbusiveTermsStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      
      const stats = await analyticsService.getAbusiveTermsStats(timeframe);
      
      res.json(createResponse(true, 'Abusive terms statistics retrieved successfully', stats));
    } catch (error) {
      console.error('Error fetching abusive terms stats:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch abusive terms statistics'));
    }
  }

  // Get detections by platform statistics
  async getPlatformStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      
      const stats = await analyticsService.getPlatformStats(timeframe);
      
      res.json(createResponse(true, 'Platform statistics retrieved successfully', stats));
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch platform statistics'));
    }
  }

  // Get detections over time (trend analysis)
  async getDetectionTrends(req, res) {
    try {
      const { timeframe = '30d', groupBy = 'day' } = req.query;
      
      const trends = await analyticsService.getDetectionTrends(timeframe, groupBy);
      
      res.json(createResponse(true, 'Detection trends retrieved successfully', trends));
    } catch (error) {
      console.error('Error fetching detection trends:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch detection trends'));
    }
  }

  // Get user engagement analytics
  async getUserEngagementStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      
      const stats = await analyticsService.getUserEngagementStats(timeframe);
      
      res.json(createResponse(true, 'User engagement statistics retrieved successfully', stats));
    } catch (error) {
      console.error('Error fetching user engagement stats:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch user engagement statistics'));
    }
  }

  // Get top flagged users (anonymous UUIDs)
  async getTopFlaggedUsers(req, res) {
    try {
      const { limit = 10, timeframe = '30d' } = req.query;
      
      const topUsers = await analyticsService.getTopFlaggedUsers(limit, timeframe);
      
      res.json(createResponse(true, 'Top flagged users retrieved successfully', topUsers));
    } catch (error) {
      console.error('Error fetching top flagged users:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch top flagged users'));
    }
  }

  // Get recently flagged content
  async getRecentlyFlaggedContent(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const flaggedContent = await analyticsService.getRecentlyFlaggedContent(limit, offset);
      
      res.json(createResponse(true, 'Recently flagged content retrieved successfully', flaggedContent));
    } catch (error) {
      console.error('Error fetching recently flagged content:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch recently flagged content'));
    }
  }

  // Get analytics dashboard summary
  async getDashboardSummary(req, res) {
    try {
      const summary = await analyticsService.getDashboardSummary();
      
      res.json(createResponse(true, 'Dashboard summary retrieved successfully', summary));
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json(createResponse(false, 'Failed to fetch dashboard summary'));
    }
  }

  // Export analytics data (CSV format)
  async exportAnalyticsData(req, res) {
    try {
      const { format = 'csv', type, timeframe = '30d' } = req.query;
      
      if (!type) {
        return res.status(400).json(createResponse(false, 'Export type is required'));
      }

      const exportData = await analyticsService.exportAnalyticsData(type, timeframe, format);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="typeaware-analytics-${type}-${Date.now()}.${format}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      res.status(500).json(createResponse(false, 'Failed to export analytics data'));
    }
  }
}

module.exports = new AnalyticsController();