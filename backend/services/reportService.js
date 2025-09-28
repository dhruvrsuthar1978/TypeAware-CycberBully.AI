const Report = require('../models/Report');
const User = require('../models/User');
const crypto = require('crypto');

class ReportService {
  // Validate UUID format
  validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Process report submission data
  async processReportSubmission(reportData) {
    try {
      const {
        browserUUID,
        userId,
        content,
        context,
        classification,
        metadata
      } = reportData;

      // Generate content hash for duplicate detection
      const contentHash = this.generateContentHash(content.original, browserUUID);

      // Clean and process flagged terms
      const processedFlaggedTerms = this.processFlaggedTerms(content.flaggedTerms || []);

      // Determine overall severity
      const overallSeverity = this.calculateOverallSeverity(content.severity, processedFlaggedTerms);

      return {
        browserUUID,
        userId,
        content: {
          original: content.original,
          cleaned: this.cleanContent(content.original, processedFlaggedTerms),
          flaggedTerms: processedFlaggedTerms,
          wordCount: content.original.split(/\s+/).length,
          severity: overallSeverity
        },
        context: {
          platform: context.platform,
          url: context.url,
          pageTitle: context.pageTitle,
          elementType: context.elementType || 'other'
        },
        classification: {
          category: classification.category,
          confidence: Math.min(Math.max(classification.confidence || 0.8, 0), 1),
          detectionMethod: classification.detectionMethod || 'user_report'
        },
        status: 'pending',
        metadata,
        contentHash
      };
    } catch (error) {
      throw new Error(`Error processing report submission: ${error.message}`);
    }
  }

  // Create new report
  async createReport(reportData) {
    try {
      // Check for duplicate content
      const existingReport = await this.findDuplicateReport(
        reportData.contentHash,
        reportData.browserUUID
      );

      if (existingReport) {
        // Update existing report timestamp instead of creating duplicate
        existingReport.updatedAt = new Date();
        await existingReport.save();
        return existingReport;
      }

      const report = new Report(reportData);
      await report.save();
      return report;
    } catch (error) {
      throw new Error(`Error creating report: ${error.message}`);
    }
  }

  // Process batch reports
  async processBatchReports(batchData) {
    const { browserUUID, userId, reports, metadata } = batchData;
    const results = {
      successful: [],
      failed: []
    };

    for (let i = 0; i < reports.length; i++) {
      try {
        const reportData = reports[i];
        
        const processedReport = await this.processReportSubmission({
          browserUUID,
          userId,
          content: reportData.content,
          context: reportData.context,
          classification: reportData.classification,
          metadata
        });

        const report = await this.createReport(processedReport);
        
        results.successful.push({
          index: i,
          reportId: report._id,
          status: report.status,
          severity: report.content.severity
        });

      } catch (error) {
        results.failed.push({
          index: i,
          error: error.message,
          data: reports[i]
        });
      }
    }

    return results;
  }

  // Get reports by browser UUID with filtering
  async getReportsByBrowserUUID(browserUUID, options = {}) {
    try {
      const { page = 1, limit = 10, status, category, severity } = options;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { browserUUID };
      if (status) filter.status = status;
      if (category) filter['classification.category'] = category;
      if (severity) filter['content.severity'] = severity;

      const [reports, total] = await Promise.all([
        Report.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('content.severity classification.category status createdAt context.platform'),
        Report.countDocuments(filter)
      ]);

      return { reports, total };
    } catch (error) {
      throw new Error(`Error fetching reports by browser UUID: ${error.message}`);
    }
  }

  // Get report by ID with user access check
  async getReportById(reportId, userId = null) {
    try {
      let query = Report.findById(reportId);
      
      // If userId provided, ensure user has access
      if (userId) {
        query = query.where({
          $or: [
            { userId: userId },
            { browserUUID: { $in: await this.getUserBrowserUUIDs(userId) } }
          ]
        });
      }

      return await query
        .populate('userId', 'username email')
        .populate('adminReview.reviewedBy', 'username');
    } catch (error) {
      throw new Error(`Error fetching report by ID: ${error.message}`);
    }
  }

  // Get report by ID and browser UUID
  async getReportByIdAndBrowserUUID(reportId, browserUUID) {
    try {
      return await Report.findOne({
        _id: reportId,
        browserUUID: browserUUID
      });
    } catch (error) {
      throw new Error(`Error fetching report by ID and browser UUID: ${error.message}`);
    }
  }

  // Add feedback to report
  async addFeedback(report, feedbackData) {
    try {
      report.userFeedback = feedbackData;
      await report.save();
      return report;
    } catch (error) {
      throw new Error(`Error adding feedback: ${error.message}`);
    }
  }

  // Get browser UUID statistics
  async getBrowserUUIDStatistics(browserUUID, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Report.aggregate([
        {
          $match: {
            browserUUID: browserUUID,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            categories: { $addToSet: '$classification.category' },
            platforms: { $addToSet: '$context.platform' },
            severities: {
              $push: '$content.severity'
            },
            avgConfidence: { $avg: '$classification.confidence' },
            statusBreakdown: {
              $push: '$status'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalReports: 0,
          categories: [],
          platforms: [],
          severityBreakdown: {},
          statusBreakdown: {},
          avgConfidence: 0
        };
      }

      const stat = stats[0];
      
      // Process severity breakdown
      const severityBreakdown = stat.severities.reduce((acc, severity) => {
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});

      // Process status breakdown
      const statusBreakdown = stat.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalReports: stat.totalReports,
        categories: stat.categories,
        platforms: stat.platforms,
        severityBreakdown,
        statusBreakdown,
        avgConfidence: Math.round(stat.avgConfidence * 100) / 100
      };

    } catch (error) {
      throw new Error(`Error getting browser UUID statistics: ${error.message}`);
    }
  }

  // Delete report
  async deleteReport(reportId) {
    try {
      const result = await Report.findByIdAndDelete(reportId);
      return result;
    } catch (error) {
      throw new Error(`Error deleting report: ${error.message}`);
    }
  }

  // Find similar reports based on content similarity
  async findSimilarReports(report, limit = 5) {
    try {
      // Simple similarity based on category and platform
      const similarReports = await Report.find({
        _id: { $ne: report._id },
        'classification.category': report.classification.category,
        'context.platform': report.context.platform,
        status: { $ne: 'dismissed' }
      })
      .sort({ 'classification.confidence': -1, createdAt: -1 })
      .limit(limit)
      .select('content.original classification.category context.platform createdAt status');

      return similarReports;
    } catch (error) {
      throw new Error(`Error finding similar reports: ${error.message}`);
    }
  }

  // Update report status
  async updateReportStatus(reportId, status, reason = '') {
    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        { 
          status,
          userFeedback: {
            comment: reason,
            submittedAt: new Date()
          }
        },
        { new: true }
      );

      return report;
    } catch (error) {
      throw new Error(`Error updating report status: ${error.message}`);
    }
  }

  // Get recent reports for admin review
  async getRecentReports(limit = 50, filters = {}) {
    try {
      const query = Report.find(filters)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'username email role')
        .populate('adminReview.reviewedBy', 'username email');

      return await query;
    } catch (error) {
      throw new Error(`Error fetching recent reports: ${error.message}`);
    }
  }

  // Get pending reports for moderation
  async getPendingReports(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = { status: 'pending', ...filters };

      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username email browserUUIDs'),
        Report.countDocuments(query)
      ]);

      return { reports, total };
    } catch (error) {
      throw new Error(`Error fetching pending reports: ${error.message}`);
    }
  }

  // Mark report as reviewed by admin
  async markAsReviewed(reportId, adminId, decision, notes = '', actionTaken = 'none') {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      await report.markAsReviewed(adminId, decision, notes, actionTaken);
      return report;
    } catch (error) {
      throw new Error(`Error marking report as reviewed: ${error.message}`);
    }
  }

  // Get reports by user ID
  async getReportsByUserId(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        Report.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('adminReview.reviewedBy', 'username'),
        Report.countDocuments({ userId })
      ]);

      return { reports, total };
    } catch (error) {
      throw new Error(`Error fetching reports by user ID: ${error.message}`);
    }
  }

  // Helper methods

  // Generate content hash for duplicate detection
  generateContentHash(content, browserUUID) {
    return crypto
      .createHash('md5')
      .update(content + browserUUID)
      .digest('hex');
  }

  // Process flagged terms
  processFlaggedTerms(flaggedTerms) {
    return flaggedTerms.map(term => ({
      term: term.term || '',
      positions: Array.isArray(term.positions) ? term.positions : [],
      severity: ['low', 'medium', 'high', 'critical'].includes(term.severity) 
        ? term.severity 
        : 'medium'
    }));
  }

  // Calculate overall severity based on content and flagged terms
  calculateOverallSeverity(contentSeverity, flaggedTerms) {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    
    let maxSeverity = severityLevels[contentSeverity] || 2;
    
    flaggedTerms.forEach(term => {
      const termSeverity = severityLevels[term.severity] || 2;
      if (termSeverity > maxSeverity) {
        maxSeverity = termSeverity;
      }
    });

    const severityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return severityMap[maxSeverity];
  }

  // Clean content by masking flagged terms
  cleanContent(content, flaggedTerms) {
    let cleaned = content;
    
    flaggedTerms.forEach(term => {
      if (term.term) {
        const regex = new RegExp(term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(regex, '*'.repeat(term.term.length));
      }
    });

    return cleaned;
  }

  // Find duplicate report by content hash
  async findDuplicateReport(contentHash, browserUUID, timeWindow = 24) {
    try {
      const timeThreshold = new Date(Date.now() - (timeWindow * 60 * 60 * 1000));
      
      return await Report.findOne({
        contentHash,
        browserUUID,
        createdAt: { $gte: timeThreshold }
      });
    } catch (error) {
      return null;
    }
  }

  // Get user's browser UUIDs
  async getUserBrowserUUIDs(userId) {
    try {
      const user = await User.findById(userId).select('browserUUIDs');
      return user ? user.browserUUIDs.map(b => b.uuid) : [];
    } catch (error) {
      return [];
    }
  }

  // Get report analytics for admin dashboard
  async getReportAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            categories: {
              $push: {
                category: '$classification.category',
                severity: '$content.severity'
              }
            },
            platforms: {
              $push: '$context.platform'
            },
            statusBreakdown: {
              $push: '$status'
            },
            avgConfidence: { $avg: '$classification.confidence' }
          }
        }
      ]);

      if (analytics.length === 0) {
        return {
          totalReports: 0,
          categoryBreakdown: {},
          platformBreakdown: {},
          statusBreakdown: {},
          avgConfidence: 0
        };
      }

      const data = analytics[0];

      // Process category breakdown
      const categoryBreakdown = data.categories.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      // Process platform breakdown
      const platformBreakdown = data.platforms.reduce((acc, platform) => {
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {});

      // Process status breakdown
      const statusBreakdown = data.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalReports: data.totalReports,
        categoryBreakdown,
        platformBreakdown,
        statusBreakdown,
        avgConfidence: Math.round(data.avgConfidence * 100) / 100
      };

    } catch (error) {
      throw new Error(`Error getting report analytics: ${error.message}`);
    }
  }
}

module.exports = new ReportService();