// controllers/extensionController.js
const extensionService = require('../services/extensionService');
const reportService = require('../services/reportService');
const { createResponse } = require('../utils/responseUtils');
const { EXTENSION_CONFIG } = require('../config/constants');

class ExtensionController {
  // Extension heartbeat/ping endpoint
  async ping(req, res) {
    try {
      const { extensionId, version, userUuid } = req.headers;
      
      const heartbeat = await extensionService.recordHeartbeat({
        extensionId: extensionId || 'unknown',
        version: version || 'unknown',
        userUuid: userUuid || null,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(createResponse(true, 'Heartbeat recorded', heartbeat));
    } catch (error) {
      console.error('Error in extension ping:', error);
      res.status(500).json(createResponse(false, 'Heartbeat failed'));
    }
  }

  // Submit report from extension
  async submitReport(req, res) {
    try {
      const {
        content,
        flagReason,
        platform,
        context,
        flaggedUserUuid,
        url,
        timestamp,
        detectionConfidence
      } = req.body;

      const extensionId = req.headers['x-extension-id'];
      const reporterUuid = req.headers['x-user-uuid'];
      const extensionVersion = req.headers['x-extension-version'];

      if (!reporterUuid) {
        return res.status(400).json(createResponse(false, 'User UUID is required'));
      }

      // Create report data
      const reportData = {
        content,
        flagReason,
        platform,
        context: {
          ...context,
          url,
          extensionId,
          extensionVersion,
          detectionConfidence,
          submittedVia: 'extension'
        },
        flaggedUserUuid,
        reporterUuid,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };

      // Submit report through service
      const report = await reportService.createReport(reportData);

      // Log extension activity
      await extensionService.logActivity({
        extensionId,
        userUuid: reporterUuid,
        action: 'report_submitted',
        data: {
          reportId: report._id,
          platform,
          flagReason
        },
        ip: req.ip
      });

      res.status(201).json(createResponse(true, 'Report submitted successfully', {
        reportId: report._id,
        submittedAt: report.createdAt,
        status: report.status
      }));
    } catch (error) {
      console.error('Error submitting extension report:', error);
      res.status(500).json(createResponse(false, 'Failed to submit report'));
    }
  }

  // Batch submit multiple reports
  async submitReportsBatch(req, res) {
    try {
      const { reports } = req.body;
      const extensionId = req.headers['x-extension-id'];
      const reporterUuid = req.headers['x-user-uuid'];

      if (!Array.isArray(reports) || reports.length === 0) {
        return res.status(400).json(createResponse(false, 'Reports array is required'));
      }

      if (reports.length > 50) {
        return res.status(400).json(createResponse(false, 'Maximum 50 reports allowed per batch'));
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const reportData of reports) {
        try {
          const report = await reportService.createReport({
            ...reportData,
            reporterUuid,
            context: {
              ...reportData.context,
              extensionId,
              submittedVia: 'extension_batch'
            }
          });

          results.push({
            success: true,
            reportId: report._id,
            originalIndex: results.length
          });
          successCount++;
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            originalIndex: results.length
          });
          errorCount++;
        }
      }

      // Log batch activity
      await extensionService.logActivity({
        extensionId,
        userUuid: reporterUuid,
        action: 'batch_reports_submitted',
        data: {
          totalReports: reports.length,
          successCount,
          errorCount
        },
        ip: req.ip
      });

      res.json(createResponse(true, 'Batch reports processed', {
        totalSubmitted: reports.length,
        successCount,
        errorCount,
        results
      }));
    } catch (error) {
      console.error('Error in batch report submission:', error);
      res.status(500).json(createResponse(false, 'Failed to process batch reports'));
    }
  }

  // Get extension configuration
  async getConfig(req, res) {
    try {
      const extensionVersion = req.headers['x-extension-version'];
      const config = await extensionService.getExtensionConfig(extensionVersion);

      res.json(createResponse(true, 'Configuration retrieved', config));
    } catch (error) {
      console.error('Error getting extension config:', error);
      res.status(500).json(createResponse(false, 'Failed to get configuration'));
    }
  }

  // Update extension settings for user
  async updateSettings(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { settings } = req.body;

      if (!userUuid) {
        return res.status(400).json(createResponse(false, 'User UUID is required'));
      }

      const updatedSettings = await extensionService.updateUserSettings(userUuid, settings);

      res.json(createResponse(true, 'Settings updated successfully', updatedSettings));
    } catch (error) {
      console.error('Error updating extension settings:', error);
      res.status(500).json(createResponse(false, 'Failed to update settings'));
    }
  }

  // Get extension settings for user
  async getSettings(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];

      if (!userUuid) {
        return res.status(400).json(createResponse(false, 'User UUID is required'));
      }

      const settings = await extensionService.getUserSettings(userUuid);

      res.json(createResponse(true, 'Settings retrieved', settings));
    } catch (error) {
      console.error('Error getting extension settings:', error);
      res.status(500).json(createResponse(false, 'Failed to get settings'));
    }
  }

  // Sync extension data
  async syncData(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { lastSyncTimestamp, localData } = req.body;

      if (!userUuid) {
        return res.status(400).json(createResponse(false, 'User UUID is required'));
      }

      const syncResult = await extensionService.syncUserData(
        userUuid, 
        lastSyncTimestamp ? new Date(lastSyncTimestamp) : null,
        localData
      );

      res.json(createResponse(true, 'Data synchronized', syncResult));
    } catch (error) {
      console.error('Error syncing extension data:', error);
      res.status(500).json(createResponse(false, 'Failed to sync data'));
    }
  }

  // Get user statistics for extension dashboard
  async getUserStats(req, res) {
    try {
      const userUuid = req.headers['x-user-uuid'];
      const { timeframe = '30d' } = req.query;

      if (!userUuid) {
        return res.status(400).json(createResponse(false, 'User UUID is required'));
      }

      const stats = await extensionService.getUserStatistics(userUuid, timeframe);

      res.json(createResponse(true, 'Statistics retrieved', stats));
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json(createResponse(false, 'Failed to get statistics'));
    }
  }

  // Check for extension updates
  async checkUpdates(req, res) {
    try {
      const currentVersion = req.headers['x-extension-version'] || '1.0.0';
      const updateInfo = await extensionService.checkForUpdates(currentVersion);

      res.json(createResponse(true, 'Update check completed', updateInfo));
    } catch (error) {
      console.error('Error checking for updates:', error);
      res.status(500).json(createResponse(false, 'Failed to check updates'));
    }
  }

  // Register new extension installation
  async registerInstallation(req, res) {
    try {
      const {
        extensionId,
        version,
        userUuid,
        browserInfo,
        installationSource
      } = req.body;

      const installation = await extensionService.registerInstallation({
        extensionId,
        version,
        userUuid,
        browserInfo,
        installationSource,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        installedAt: new Date()
      });

      res.status(201).json(createResponse(true, 'Installation registered', installation));
    } catch (error) {
      console.error('Error registering installation:', error);
      res.status(500).json(createResponse(false, 'Failed to register installation'));
    }
  }

  // Report extension error/crash
  async reportError(req, res) {
    try {
      const {
        errorType,
        errorMessage,
        stackTrace,
        userActions,
        browserInfo,
        extensionState
      } = req.body;

      const extensionId = req.headers['x-extension-id'];
      const userUuid = req.headers['x-user-uuid'];
      const version = req.headers['x-extension-version'];

      const errorReport = await extensionService.logError({
        extensionId,
        userUuid,
        version,
        errorType,
        errorMessage,
        stackTrace,
        userActions,
        browserInfo,
        extensionState,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      res.json(createResponse(true, 'Error reported successfully', {
        errorId: errorReport._id
      }));
    } catch (error) {
      console.error('Error reporting extension error:', error);
      res.status(500).json(createResponse(false, 'Failed to report error'));
    }
  }

  // Get detection patterns for extension
  async getDetectionPatterns(req, res) {
    try {
      const version = req.headers['x-extension-version'];
      const patterns = await extensionService.getDetectionPatterns(version);

      res.json(createResponse(true, 'Detection patterns retrieved', patterns));
    } catch (error) {
      console.error('Error getting detection patterns:', error);
      res.status(500).json(createResponse(false, 'Failed to get detection patterns'));
    }
  }

  // Submit usage analytics
  async submitAnalytics(req, res) {
    try {
      const {
        sessionsData,
        detectionStats,
        performanceMetrics,
        userInteractions
      } = req.body;

      const extensionId = req.headers['x-extension-id'];
      const userUuid = req.headers['x-user-uuid'];

      await extensionService.submitAnalytics({
        extensionId,
        userUuid,
        sessionsData,
        detectionStats,
        performanceMetrics,
        userInteractions,
        submittedAt: new Date(),
        ip: req.ip
      });

      res.json(createResponse(true, 'Analytics submitted successfully'));
    } catch (error) {
      console.error('Error submitting analytics:', error);
      res.status(500).json(createResponse(false, 'Failed to submit analytics'));
    }
  }

  // Validate extension API key
  async validateApiKey(req, res) {
    try {
      const apiKey = req.headers['x-api-key'];
      const extensionId = req.headers['x-extension-id'];

      if (!apiKey) {
        return res.status(401).json(createResponse(false, 'API key required'));
      }

      const validation = await extensionService.validateApiKey(apiKey, extensionId);

      if (validation.valid) {
        res.json(createResponse(true, 'API key valid', {
          permissions: validation.permissions,
          rateLimit: validation.rateLimit
        }));
      } else {
        res.status(401).json(createResponse(false, 'Invalid API key'));
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      res.status(500).json(createResponse(false, 'API key validation failed'));
    }
  }

  // Get extension health status
  async getHealth(req, res) {
    try {
      const health = await extensionService.getServiceHealth();
      
      res.json(createResponse(true, 'Extension service health', health));
    } catch (error) {
      console.error('Error getting extension health:', error);
      res.status(500).json(createResponse(false, 'Failed to get health status'));
    }
  }

  // Get supported platforms list
  async getSupportedPlatforms(req, res) {
    try {
      const platforms = await extensionService.getSupportedPlatforms();
      
      res.json(createResponse(true, 'Supported platforms retrieved', platforms));
    } catch (error) {
      console.error('Error getting supported platforms:', error);
      res.status(500).json(createResponse(false, 'Failed to get supported platforms'));
    }
  }

  // Extension feedback submission
  async submitFeedback(req, res) {
    try {
      const {
        feedbackType,
        message,
        rating,
        category,
        additionalData
      } = req.body;

      const extensionId = req.headers['x-extension-id'];
      const userUuid = req.headers['x-user-uuid'];
      const version = req.headers['x-extension-version'];

      const feedback = await extensionService.submitFeedback({
        extensionId,
        userUuid,
        version,
        feedbackType,
        message,
        rating,
        category,
        additionalData,
        submittedAt: new Date(),
        ip: req.ip
      });

      res.status(201).json(createResponse(true, 'Feedback submitted successfully', {
        feedbackId: feedback._id
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json(createResponse(false, 'Failed to submit feedback'));
    }
  }
}

module.exports = new ExtensionController();