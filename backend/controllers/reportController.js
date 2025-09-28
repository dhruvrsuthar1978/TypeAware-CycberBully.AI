const Report = require('../models/Report');
const User = require('../models/User');
const reportService = require('../services/reportService');
const authService = require('../services/authService');
const { createResponse, createErrorResponse, createPaginatedResponse, createBatchResponse } = require('../utils/responseUtils');
const { hashUtils } = require('../utils/hashUtils');

class ReportController {
  // Submit a new report
  async submitReport(req, res) {
    try {
      const {
        browserUUID,
        content,
        context,
        classification,
        metadata
      } = req.body;

      // Find user by browserUUID if not authenticated
      let userId = req.userId;
      if (!userId) {
        const user = await authService.findUserByBrowserUUID(browserUUID);
        if (user) {
          userId = user._id;
        }
      }

      // Process and validate report data
      const processedReport = await reportService.processReportSubmission({
        browserUUID,
        userId,
        content,
        context,
        classification,
        metadata: {
          ...metadata,
          userAgent: req.get('User-Agent'),
          ipHash: hashUtils.hashIP(req.ip),
          timestamp: new Date()
        }
      });

      // Create report
      const report = await reportService.createReport(processedReport);

      // Update user stats if user is linked
      if (userId) {
        await authService.updateUserStats(userId, {
          totalReports: 1,
          threatsDetected: content.severity === 'critical' ? 1 : 0
        });
      }

      res.status(201).json(createResponse(
        'Report submitted successfully',
        {
          reportId: report._id,
          status: report.status,
          severity: report.content.severity,
          category: report.classification.category
        }
      ));

    } catch (error) {
      console.error('Submit report error:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          messages.join(', ')
        ));
      }

      res.status(500).json(createErrorResponse(
        'Submission Failed',
        'Unable to submit report'
      ));
    }
  }

  // Submit batch reports
  async submitBatchReports(req, res) {
    try {
      const { browserUUID, reports } = req.body;

      // Find user by browserUUID if not authenticated
      let userId = req.userId;
      if (!userId) {
        const user = await authService.findUserByBrowserUUID(browserUUID);
        if (user) {
          userId = user._id;
        }
      }

      const results = await reportService.processBatchReports({
        browserUUID,
        userId,
        reports,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipHash: hashUtils.hashIP(req.ip),
          timestamp: new Date()
        }
      });

      // Update user stats if user is linked
      if (userId && results.successful.length > 0) {
        const threatsDetected = results.successful.filter(
          r => r.severity === 'critical'
        ).length;

        await authService.updateUserStats(userId, {
          totalReports: results.successful.length,
          threatsDetected
        });
      }

      res.status(201).json(createBatchResponse(
        results.successful,
        results.failed,
        `${results.successful.length} reports submitted successfully`
      ));

    } catch (error) {
      console.error('Batch submit error:', error);
      res.status(500).json(createErrorResponse(
        'Batch Submission Failed',
        'Unable to process batch reports'
      ));
    }
  }

  // Get reports by browser UUID
  async getReportsByBrowserUUID(req, res) {
    try {
      const { browserUUID } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);
      const status = req.query.status;
      const category = req.query.category;

      // Validate UUID format
      if (!reportService.validateUUID(browserUUID)) {
        return res.status(400).json(createErrorResponse(
          'Invalid UUID',
          'Browser UUID format is invalid'
        ));
      }

      const result = await reportService.getReportsByBrowserUUID(
        browserUUID,
        { page, limit, status, category }
      );

      res.json(createPaginatedResponse(
        result.reports,
        page,
        limit,
        result.total,
        'Reports retrieved successfully'
      ));

    } catch (error) {
      console.error('Get browser reports error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Failed',
        'Unable to fetch reports'
      ));
    }
  }

  // Get report by ID
  async getReportById(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.userId;

      const report = await reportService.getReportById(reportId, userId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      res.json(createResponse(
        'Report retrieved successfully',
        { report }
      ));

    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json(createErrorResponse(
        'Fetch Failed',
        'Unable to fetch report'
      ));
    }
  }

  // Submit feedback on a report
  async submitFeedback(req, res) {
    try {
      const { reportId } = req.params;
      const { isHelpful, comment, browserUUID } = req.body;

      const report = await reportService.getReportByIdAndBrowserUUID(reportId, browserUUID);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      await reportService.addFeedback(report, {
        isHelpful,
        comment: comment || '',
        submittedAt: new Date()
      });

      res.json(createResponse('Feedback submitted successfully', null));

    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json(createErrorResponse(
        'Feedback Failed',
        'Unable to submit feedback'
      ));
    }
  }

  // Get report statistics for a browser UUID
  async getBrowserUUIDStats(req, res) {
    try {
      const { browserUUID } = req.params;
      const days = parseInt(req.query.days) || 30;

      if (!reportService.validateUUID(browserUUID)) {
        return res.status(400).json(createErrorResponse(
          'Invalid UUID',
          'Browser UUID format is invalid'
        ));
      }

      const stats = await reportService.getBrowserUUIDStatistics(browserUUID, days);

      res.json(createResponse(
        'Statistics retrieved successfully',
        { stats }
      ));

    } catch (error) {
      console.error('Get browser UUID stats error:', error);
      res.status(500).json(createErrorResponse(
        'Stats Failed',
        'Unable to fetch statistics'
      ));
    }
  }

  // Delete report (user can delete their own reports)
  async deleteReport(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.userId;

      const report = await reportService.getReportById(reportId, userId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      // Check if report can be deleted (only pending reports)
      if (report.status !== 'pending') {
        return res.status(400).json(createErrorResponse(
          'Cannot Delete',
          'Only pending reports can be deleted'
        ));
      }

      await reportService.deleteReport(reportId);

      // Update user stats
      if (userId) {
        await authService.updateUserStats(userId, {
          totalReports: -1,
          threatsDetected: report.content.severity === 'critical' ? -1 : 0
        });
      }

      res.json(createResponse('Report deleted successfully', null));

    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json(createErrorResponse(
        'Delete Failed',
        'Unable to delete report'
      ));
    }
  }

  // Get similar reports (for duplicate detection)
  async getSimilarReports(req, res) {
    try {
      const { reportId } = req.params;
      const limit = parseInt(req.query.limit) || 5;

      const report = await reportService.getReportById(reportId, req.userId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      const similarReports = await reportService.findSimilarReports(report, limit);

      res.json(createResponse(
        'Similar reports retrieved successfully',
        { similarReports }
      ));

    } catch (error) {
      console.error('Get similar reports error:', error);
      res.status(500).json(createErrorResponse(
        'Search Failed',
        'Unable to find similar reports'
      ));
    }
  }

  // Update report status (for user corrections)
  async updateReportStatus(req, res) {
    try {
      const { reportId } = req.params;
      const { status, reason } = req.body;
      const userId = req.userId;

      // Users can only mark reports as false_positive
      if (status !== 'false_positive') {
        return res.status(400).json(createErrorResponse(
          'Invalid Status',
          'Users can only mark reports as false positive'
        ));
      }

      const report = await reportService.getReportById(reportId, userId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      if (report.status !== 'pending') {
        return res.status(400).json(createErrorResponse(
          'Cannot Update',
          'Only pending reports can be updated'
        ));
      }

      await reportService.updateReportStatus(reportId, status, reason);

      res.json(createResponse(
        'Report status updated successfully',
        { status, reason }
      ));

    } catch (error) {
      console.error('Update report status error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update report status'
      ));
    }
  }
}

module.exports = new ReportController();