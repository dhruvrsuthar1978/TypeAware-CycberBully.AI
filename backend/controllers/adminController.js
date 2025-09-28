const adminService = require('../services/adminService');
const reportService = require('../services/reportService');
const authService = require('../services/authService');
const { createResponse, createErrorResponse, createPaginatedResponse, createAnalyticsResponse } = require('../utils/responseUtils');

class AdminController {
  // Get admin dashboard overview
  async getDashboard(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      
      const dashboard = await adminService.getDashboardOverview(days);

      res.json(createAnalyticsResponse(
        dashboard,
        dashboard.summary,
        dashboard.dateRange,
        'Dashboard data retrieved successfully'
      ));

    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(500).json(createErrorResponse(
        'Dashboard Error',
        'Unable to fetch dashboard data'
      ));
    }
  }

  // Get pending reports for review
  async getPendingReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const category = req.query.category;
      const platform = req.query.platform;
      const severity = req.query.severity;

      const filters = {};
      if (category) filters['classification.category'] = category;
      if (platform) filters['context.platform'] = platform;
      if (severity) filters['content.severity'] = severity;

      const result = await reportService.getPendingReports(page, limit, filters);

      res.json(createPaginatedResponse(
        result.reports,
        page,
        limit,
        result.total,
        'Pending reports retrieved successfully'
      ));

    } catch (error) {
      console.error('Get pending reports error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Error',
        'Unable to fetch pending reports'
      ));
    }
  }

  // Get flagged reports with filters
  async getFlaggedReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const category = req.query.category;
      const platform = req.query.platform;
      const severity = req.query.severity;
      const status = req.query.status;

      const filters = {};
      if (category) filters['classification.category'] = category;
      if (platform) filters['context.platform'] = platform;
      if (severity) filters['content.severity'] = severity;
      if (status) filters.status = status;

      const result = await adminService.getFlaggedReports(page, limit, filters);

      res.json(createPaginatedResponse(
        result.reports,
        page,
        limit,
        result.total,
        'Flagged reports retrieved successfully'
      ));

    } catch (error) {
      console.error('Get flagged reports error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Error',
        'Unable to fetch flagged reports'
      ));
    }
  }

  // Review a report
  async reviewReport(req, res) {
    try {
      const { reportId } = req.params;
      const { decision, notes, actionTaken } = req.body;

      if (!['confirmed', 'false_positive', 'dismissed'].includes(decision)) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Decision must be confirmed, false_positive, or dismissed'
        ));
      }

      const report = await reportService.markAsReviewed(
        reportId,
        req.userId,
        decision,
        notes || '',
        actionTaken || 'none'
      );

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found'
        ));
      }

      // Log admin action
      await adminService.logAdminAction(req.userId, 'review_report', {
        reportId,
        decision,
        actionTaken
      });

      res.json(createResponse(
        'Report reviewed successfully',
        {
          reportId: report._id,
          status: report.status,
          adminReview: report.adminReview
        }
      ));

    } catch (error) {
      console.error('Review report error:', error);
      res.status(500).json(createErrorResponse(
        'Review Failed',
        'Unable to review report'
      ));
    }
  }

  // Get users with most flags
  async getFlaggedUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const days = parseInt(req.query.days) || 30;

      const result = await adminService.getFlaggedUsers(limit, days);

      res.json(createResponse(
        'Flagged users retrieved successfully',
        {
          users: result.users,
          total: result.total,
          dateRange: result.dateRange
        }
      ));

    } catch (error) {
      console.error('Get flagged users error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Error',
        'Unable to fetch flagged users'
      ));
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'isActive must be a boolean value'
        ));
      }

      // Prevent admins from deactivating themselves
      if (userId === req.userId.toString() && !isActive) {
        return res.status(400).json(createErrorResponse(
          'Invalid Operation',
          'You cannot deactivate your own account'
        ));
      }

      const user = await adminService.updateUserStatus(userId, isActive, reason);

      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User not found'
        ));
      }

      // Log admin action
      await adminService.logAdminAction(req.userId, 'update_user_status', {
        targetUserId: userId,
        isActive,
        reason
      });

      res.json(createResponse(
        `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        {
          userId: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive
        }
      ));

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update user status'
      ));
    }
  }

  // Get comprehensive system analytics
  async getSystemAnalytics(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;

      const analytics = await adminService.getSystemAnalytics(days);

      res.json(createAnalyticsResponse(
        analytics.data,
        analytics.summary,
        analytics.dateRange,
        'System analytics retrieved successfully'
      ));

    } catch (error) {
      console.error('Get system analytics error:', error);
      res.status(500).json(createErrorResponse(
        'Analytics Error',
        'Unable to fetch system analytics'
      ));
    }
  }

  // Delete a report (admin only)
  async deleteReport(req, res) {
    try {
      const { reportId } = req.params;
      const { reason } = req.body;

      const report = await reportService.getReportById(reportId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found'
        ));
      }

      await reportService.deleteReport(reportId);

      // Log admin action
      await adminService.logAdminAction(req.userId, 'delete_report', {
        reportId,
        reason: reason || 'No reason provided',
        originalContent: report.content.original.substring(0, 100) // First 100 chars for audit
      });

      res.json(createResponse('Report deleted successfully', null));

    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json(createErrorResponse(
        'Delete Failed',
        'Unable to delete report'
      ));
    }
  }

  // Get admin activity logs
  async getAdminLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const action = req.query.action;
      const adminId = req.query.adminId;
      const days = parseInt(req.query.days) || 30;

      const result = await adminService.getAdminLogs({
        page,
        limit,
        action,
        adminId,
        days
      });

      res.json(createPaginatedResponse(
        result.logs,
        page,
        limit,
        result.total,
        'Admin logs retrieved successfully'
      ));

    } catch (error) {
      console.error('Get admin logs error:', error);
      res.status(500).json(createErrorResponse(
        'Logs Error',
        'Unable to fetch admin logs'
      ));
    }
  }

  // Bulk review reports
  async bulkReviewReports(req, res) {
    try {
      const { reportIds, decision, notes } = req.body;

      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'reportIds must be a non-empty array'
        ));
      }

      if (!['confirmed', 'false_positive', 'dismissed'].includes(decision)) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Decision must be confirmed, false_positive, or dismissed'
        ));
      }

      const result = await adminService.bulkReviewReports(
        reportIds,
        req.userId,
        decision,
        notes || ''
      );

      // Log admin action
      await adminService.logAdminAction(req.userId, 'bulk_review_reports', {
        reportCount: reportIds.length,
        decision,
        successful: result.successful.length,
        failed: result.failed.length
      });

      res.json(createResponse(
        `Bulk review completed: ${result.successful.length} successful, ${result.failed.length} failed`,
        {
          successful: result.successful,
          failed: result.failed,
          total: reportIds.length
        }
      ));

    } catch (error) {
      console.error('Bulk review reports error:', error);
      res.status(500).json(createErrorResponse(
        'Bulk Review Failed',
        'Unable to perform bulk review'
      ));
    }
  }

  // Get user details for admin
  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      const userDetails = await adminService.getUserDetailsForAdmin(userId);

      if (!userDetails) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User not found'
        ));
      }

      res.json(createResponse(
        'User details retrieved successfully',
        { user: userDetails }
      ));

    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Error',
        'Unable to fetch user details'
      ));
    }
  }

  // Get platform statistics
  async getPlatformStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;

      const stats = await adminService.getPlatformStatistics(days);

      res.json(createResponse(
        'Platform statistics retrieved successfully',
        { stats }
      ));

    } catch (error) {
      console.error('Get platform stats error:', error);
      res.status(500).json(createErrorResponse(
        'Stats Error',
        'Unable to fetch platform statistics'
      ));
    }
  }

  // Export reports for analysis
  async exportReports(req, res) {
    try {
      const { format = 'json', days = 30, status, category } = req.query;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json(createErrorResponse(
          'Invalid Format',
          'Format must be json or csv'
        ));
      }

      const exportData = await adminService.exportReports({
        format,
        days: parseInt(days),
        status,
        category
      });

      // Log admin action
      await adminService.logAdminAction(req.userId, 'export_reports', {
        format,
        days,
        recordCount: exportData.count
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');
        res.send(exportData.data);
      } else {
        res.json(createResponse(
          'Reports exported successfully',
          {
            reports: exportData.data,
            count: exportData.count,
            exportedAt: new Date().toISOString()
          }
        ));
      }

    } catch (error) {
      console.error('Export reports error:', error);
      res.status(500).json(createErrorResponse(
        'Export Failed',
        'Unable to export reports'
      ));
    }
  }

  // Get content moderation queue
  async getModerationQueue(req, res) {
    try {
      const priority = req.query.priority || 'high';
      const limit = parseInt(req.query.limit) || 25;

      const queue = await adminService.getModerationQueue(priority, limit);

      res.json(createResponse(
        'Moderation queue retrieved successfully',
        { queue }
      ));

    } catch (error) {
      console.error('Get moderation queue error:', error);
      res.status(500).json(createErrorResponse(
        'Queue Error',
        'Unable to fetch moderation queue'
      ));
    }
  }

  // Update system settings
  async updateSystemSettings(req, res) {
    try {
      const settings = req.body;

      const updatedSettings = await adminService.updateSystemSettings(settings);

      // Log admin action
      await adminService.logAdminAction(req.userId, 'update_system_settings', {
        settings: Object.keys(settings)
      });

      res.json(createResponse(
        'System settings updated successfully',
        { settings: updatedSettings }
      ));

    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update system settings'
      ));
    }
  }

  // Get detection accuracy metrics
  async getDetectionAccuracy(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;

      const accuracy = await adminService.getDetectionAccuracyMetrics(days);

      res.json(createResponse(
        'Detection accuracy metrics retrieved successfully',
        { accuracy }
      ));

    } catch (error) {
      console.error('Get detection accuracy error:', error);
      res.status(500).json(createErrorResponse(
        'Accuracy Error',
        'Unable to fetch detection accuracy metrics'
      ));
    }
  }
}

module.exports = new AdminController();