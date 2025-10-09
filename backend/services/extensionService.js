// services/extensionService.js
const ExtensionInstallation = require('../models/ExtensionInstallation');
const ExtensionSettings = require('../models/ExtensionSettings');
const ExtensionActivity = require('../models/ExtensionActivity');
const ExtensionError = require('../models/ExtensionError');
const ExtensionFeedback = require('../models/ExtensionFeedback');
const Report = require('../models/Report');
const { EXTENSION_CONFIG, SUPPORTED_PLATFORMS, DETECTION_PATTERNS } = require('../config/constants');
const DateUtils = require('../utils/dateUtils');

class ExtensionService {
  
  // Record extension heartbeat
  async recordHeartbeat(heartbeatData) {
    try {
      const {
        extensionId,
        version,
        userUuid,
        ip,
        userAgent
      } = heartbeatData;

      // Find or create installation record
      let installation = await ExtensionInstallation.findOne({
        extensionId,
        userUuid
      });

      if (installation) {
        // Update existing installation
        installation.lastActiveAt = new Date();
        installation.version = version;
        installation.ip = ip;
        installation.userAgent = userAgent;
        installation.heartbeatCount = (installation.heartbeatCount || 0) + 1;
        await installation.save();
      } else {
        // Create new installation record
        installation = new ExtensionInstallation({
          extensionId,
          version,
          userUuid,
          ip,
          userAgent,
          installedAt: new Date(),
          lastActiveAt: new Date(),
          heartbeatCount: 1
        });
        await installation.save();
      }

      // Log activity
      await this.logActivity({
        extensionId,
        userUuid,
        action: 'heartbeat',
        data: { version, ip },
        ip
      });

      return {
        status: 'recorded',
        installationId: installation._id,
        lastActive: installation.lastActiveAt,
        config: await this.getExtensionConfig(version)
      };
    } catch (error) {
      console.error('Error recording heartbeat:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  // Get extension configuration
  async getExtensionConfig(version) {
    try {
      // Check if version is supported
      const isVersionSupported = EXTENSION_CONFIG.SUPPORTED_VERSIONS.includes(version);
      const needsUpdate = this.compareVersions(version, EXTENSION_CONFIG.MIN_VERSION) < 0;

      return {
        supportedPlatforms: Object.values(SUPPORTED_PLATFORMS),
        detectionEnabled: true,
        reportingEnabled: true,
        syncInterval: EXTENSION_CONFIG.SYNC_INTERVAL || 300000, // 5 minutes
        maxOfflineReports: EXTENSION_CONFIG.MAX_OFFLINE_REPORTS || 100,
        batchSize: EXTENSION_CONFIG.SYNC_BATCH_SIZE || 50,
        version: {
          current: version,
          supported: isVersionSupported,
          needsUpdate,
          latestVersion: EXTENSION_CONFIG.SUPPORTED_VERSIONS[EXTENSION_CONFIG.SUPPORTED_VERSIONS.length - 1]
        },
        features: {
          realTimeDetection: true,
          contextualWarnings: true,
          reportSubmission: true,
          userStatistics: true,
          darkMode: true
        },
        limits: {
          reportsPerMinute: 10,
          reportsPerHour: 100,
          reportsPerDay: 500
        }
      };
    } catch (error) {
      console.error('Error getting extension config:', error);
      throw error;
    }
  }

  // Update user settings for extension
  async updateUserSettings(userUuid, settings) {
    try {
      let userSettings = await ExtensionSettings.findOne({ userUuid });

      if (userSettings) {
        // Update existing settings
        userSettings.settings = { ...userSettings.settings, ...settings };
        userSettings.updatedAt = new Date();
        await userSettings.save();
      } else {
        // Create new settings
        userSettings = new ExtensionSettings({
          userUuid,
          settings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await userSettings.save();
      }

      return userSettings.settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Get user settings
  async getUserSettings(userUuid) {
    try {
      const userSettings = await ExtensionSettings.findOne({ userUuid });

      if (userSettings) {
        return userSettings.settings;
      }

      // Return default settings if none exist
      return {
        detectionEnabled: true,
        autoReport: false,
        showWarnings: true,
        platforms: Object.values(SUPPORTED_PLATFORMS),
        sensitivityLevel: 'medium',
        notifications: {
          enabled: true,
          sound: false,
          desktop: true
        },
        privacy: {
          anonymousReporting: true,
          shareStatistics: true
        },
        appearance: {
          theme: 'system',
          position: 'bottom-right'
        }
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // Sync user data between extension and server
  async syncUserData(userUuid, lastSyncTimestamp, localData) {
    try {
      const syncTimestamp = new Date();
      const response = {
        syncTimestamp,
        serverData: {},
        conflicts: [],
        actions: []
      };

      // Get server data newer than last sync
      if (lastSyncTimestamp) {
        const serverReports = await Report.find({
          reporterUuid: userUuid,
          createdAt: { $gte: lastSyncTimestamp }
        }).sort({ createdAt: -1 }).limit(100);

        response.serverData.reports = serverReports;
      }

      // Process local data if provided
      if (localData && localData.pendingReports) {
        const syncedReports = [];
        
        for (const localReport of localData.pendingReports) {
          try {
            // Check for duplicates
            const existingReport = await Report.findOne({
              reporterUuid: userUuid,
              content: localReport.content,
              createdAt: {
                $gte: new Date(Date.now() - 60000), // Within last minute
                $lte: new Date()
              }
            });

            if (!existingReport) {
              const report = new Report({
                ...localReport,
                reporterUuid: userUuid,
                syncedAt: syncTimestamp
              });
              await report.save();
              syncedReports.push(report._id);
            }
          } catch (error) {
            console.error('Error syncing local report:', error);
          }
        }

        response.actions.push({
          type: 'reports_synced',
          count: syncedReports.length,
          reportIds: syncedReports
        });
      }

      // Log sync activity
      await this.logActivity({
        userUuid,
        action: 'data_sync',
        data: {
          lastSyncTimestamp,
          syncedReportsCount: response.actions.length > 0 ? response.actions[0].count : 0
        }
      });

      return response;
    } catch (error) {
      console.error('Error syncing user data:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStatistics(userUuid, timeframe = '30d') {
    try {
      const { start, end } = DateUtils.getTimeframeRange(timeframe);

      const [
        totalReports,
        periodReports,
        platformStats,
        flagReasonStats,
        recentActivity
      ] = await Promise.all([
        Report.countDocuments({ reporterUuid: userUuid }),
        Report.countDocuments({
          reporterUuid: userUuid,
          createdAt: { $gte: start, $lte: end }
        }),
        this.getUserPlatformStats(userUuid, start, end),
        this.getUserFlagReasonStats(userUuid, start, end),
        this.getUserRecentActivity(userUuid, 10)
      ]);

      return {
        timeframe,
        period: {
          start,
          end
        },
        totals: {
          allTimeReports: totalReports,
          periodReports
        },
        breakdown: {
          platforms: platformStats,
          flagReasons: flagReasonStats
        },
        recentActivity,
        trends: await this.getUserTrends(userUuid, timeframe)
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Get platform statistics for user
  async getUserPlatformStats(userUuid, startDate, endDate) {
    return await Report.aggregate([
      {
        $match: {
          reporterUuid: userUuid,
          createdAt: { $gte: startDate, $lte: endDate }
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
    ]);
  }

  // Get flag reason statistics for user
  async getUserFlagReasonStats(userUuid, startDate, endDate) {
    return await Report.aggregate([
      {
        $match: {
          reporterUuid: userUuid,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$flagReason',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }

  // Get user recent activity
  async getUserRecentActivity(userUuid, limit = 10) {
    return await Report.find({ reporterUuid: userUuid })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('platform flagReason createdAt status');
  }

  // Get user trends
  async getUserTrends(userUuid, timeframe) {
    const { start, end } = DateUtils.getTimeframeRange(timeframe);
    
    const trends = await Report.aggregate([
      {
        $match: {
          reporterUuid: userUuid,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return trends.map(trend => ({
      date: trend._id,
      reports: trend.count
    }));
  }

  // Check for extension updates
  async checkForUpdates(currentVersion) {
    try {
      const latestVersion = EXTENSION_CONFIG.SUPPORTED_VERSIONS[EXTENSION_CONFIG.SUPPORTED_VERSIONS.length - 1];
      const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0;
      const isSupported = EXTENSION_CONFIG.SUPPORTED_VERSIONS.includes(currentVersion);

      return {
        currentVersion,
        latestVersion,
        hasUpdate,
        isSupported,
        updateRequired: this.compareVersions(currentVersion, EXTENSION_CONFIG.MIN_VERSION) < 0,
        releaseNotes: hasUpdate ? await this.getReleaseNotes(latestVersion) : null,
        downloadUrl: hasUpdate ? `${process.env.CDN_URL}/extension/typeaware-${latestVersion}.zip` : null
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  }

  // Compare version strings
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  // Get release notes for version
  async getReleaseNotes(version) {
    // In production, this would fetch from a database or file
    const releaseNotes = {
      '1.2.0': [
        'Improved detection accuracy',
        'Added support for new platforms',
        'Enhanced user interface',
        'Bug fixes and performance improvements'
      ],
      '1.1.0': [
        'Real-time sync functionality',
        'Dark mode support',
        'Better error handling',
        'Security improvements'
      ]
    };

    return releaseNotes[version] || [];
  }

  // Register new installation
  async registerInstallation(installationData) {
    try {
      // Check if installation already exists
      let installation = await ExtensionInstallation.findOne({
        extensionId: installationData.extensionId,
        userUuid: installationData.userUuid
      });

      if (installation) {
        // Update existing installation
        installation.version = installationData.version;
        installation.browserInfo = installationData.browserInfo;
        installation.installationSource = installationData.installationSource;
        installation.ip = installationData.ip || '127.0.0.1';
        installation.userAgent = installationData.userAgent;
        installation.lastActiveAt = new Date();
        installation.status = 'active';
        await installation.save();
      } else {
        // Create new installation
        installation = new ExtensionInstallation({
          ...installationData,
          ip: installationData.ip || '127.0.0.1', // Default IP if not provided
          status: 'active',
          heartbeatCount: 0
        });
        await installation.save();
      }

      // Log installation activity
      await this.logActivity({
        extensionId: installationData.extensionId,
        userUuid: installationData.userUuid,
        action: installation.isNew ? 'installation_registered' : 'installation_updated',
        data: {
          version: installationData.version,
          source: installationData.installationSource
        },
        ip: installationData.ip || '127.0.0.1'
      });

      return {
        installationId: installation._id,
        status: installation.isNew ? 'registered' : 'updated',
        config: await this.getExtensionConfig(installationData.version)
      };
    } catch (error) {
      console.error('Error registering installation:', error);
      throw error;
    }
  }

  // Log extension error
  async logError(errorData) {
    try {
      const error = new ExtensionError({
        ...errorData,
        resolved: false,
        reportedAt: new Date()
      });

      await error.save();

      // Also log as activity
      await this.logActivity({
        extensionId: errorData.extensionId,
        userUuid: errorData.userUuid,
        action: 'error_reported',
        data: {
          errorType: errorData.errorType,
          errorMessage: errorData.errorMessage
        },
        ip: errorData.ip
      });

      return error;
    } catch (error) {
      console.error('Error logging extension error:', error);
      throw error;
    }
  }

  // Get detection patterns for extension
  async getDetectionPatterns(version) {
    try {
      // Return patterns based on version compatibility
      const patterns = {
        version,
        lastUpdated: new Date().toISOString(),
        patterns: {
          harassment: DETECTION_PATTERNS.HARASSMENT_INDICATORS || [],
          spam: DETECTION_PATTERNS.SPAM_INDICATORS || [],
          profanity: {
            high: DETECTION_PATTERNS.PROFANITY?.HIGH_SEVERITY || [],
            medium: DETECTION_PATTERNS.PROFANITY?.MEDIUM_SEVERITY || [],
            low: DETECTION_PATTERNS.PROFANITY?.LOW_SEVERITY || []
          }
        },
        config: {
          fuzzyMatchThreshold: 0.8,
          confidenceThreshold: 0.7,
          enableContextAnalysis: true
        }
      };

      return patterns;
    } catch (error) {
      console.error('Error getting detection patterns:', error);
      throw error;
    }
  }

  // Submit analytics from extension
  async submitAnalytics(analyticsData) {
    try {
      // Store analytics data
      // In production, this might go to a separate analytics database
      
      await this.logActivity({
        extensionId: analyticsData.extensionId,
        userUuid: analyticsData.userUuid,
        action: 'analytics_submitted',
        data: {
          sessionsCount: analyticsData.sessionsData?.length || 0,
          detectionCount: analyticsData.detectionStats?.totalDetections || 0,
          performanceMetrics: analyticsData.performanceMetrics
        },
        ip: analyticsData.ip
      });

      return { status: 'received', processedAt: new Date() };
    } catch (error) {
      console.error('Error submitting analytics:', error);
      throw error;
    }
  }

  // Validate API key for extension
  async validateApiKey(apiKey, extensionId) {
    try {
      // In production, API keys would be stored in database
      const validApiKeys = new Map([
        ['ext_dev_key_123', { 
          permissions: ['read', 'write'], 
          rateLimit: { requests: 1000, window: 3600 }
        }],
        ['ext_prod_key_456', { 
          permissions: ['read', 'write', 'admin'], 
          rateLimit: { requests: 5000, window: 3600 }
        }]
      ]);

      const keyData = validApiKeys.get(apiKey);
      
      return {
        valid: !!keyData,
        permissions: keyData?.permissions || [],
        rateLimit: keyData?.rateLimit || null
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false, permissions: [], rateLimit: null };
    }
  }

  // Get service health
  async getServiceHealth() {
    try {
      const [
        activeInstallations,
        recentErrors,
        avgResponseTime
      ] = await Promise.all([
        ExtensionInstallation.countDocuments({
          lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        ExtensionError.countDocuments({
          reportedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          resolved: false
        }),
        this.getAverageResponseTime()
      ]);

      const health = {
        status: recentErrors > 10 ? 'degraded' : 'healthy',
        activeInstallations,
        recentErrors,
        avgResponseTime,
        uptime: process.uptime(),
        version: EXTENSION_CONFIG.SUPPORTED_VERSIONS[EXTENSION_CONFIG.SUPPORTED_VERSIONS.length - 1],
        lastUpdated: new Date().toISOString()
      };

      return health;
    } catch (error) {
      console.error('Error getting service health:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get average response time (placeholder - would need proper monitoring)
  async getAverageResponseTime() {
    // This would typically come from monitoring system
    return Math.random() * 100 + 50; // Mock: 50-150ms
  }

  // Get supported platforms
  async getSupportedPlatforms() {
    return {
      platforms: Object.entries(SUPPORTED_PLATFORMS).map(([key, value]) => ({
        id: value,
        name: key.charAt(0) + key.slice(1).toLowerCase(),
        enabled: true,
        features: {
          realTimeDetection: true,
          contextExtraction: true,
          userIdentification: true
        }
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  // Submit feedback
  async submitFeedback(feedbackData) {
    try {
      const feedback = new ExtensionFeedback({
        ...feedbackData,
        status: 'pending',
        submittedAt: new Date()
      });

      await feedback.save();

      // Log feedback activity
      await this.logActivity({
        extensionId: feedbackData.extensionId,
        userUuid: feedbackData.userUuid,
        action: 'feedback_submitted',
        data: {
          feedbackType: feedbackData.feedbackType,
          rating: feedbackData.rating,
          category: feedbackData.category
        },
        ip: feedbackData.ip
      });

      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Log activity
  async logActivity(activityData) {
    try {
      const activity = new ExtensionActivity({
        ...activityData,
        timestamp: new Date()
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for logging failures
    }
  }

  // Get extension statistics (for admin dashboard)
  async getExtensionStatistics(timeframe = '30d') {
    try {
      const { start, end } = DateUtils.getTimeframeRange(timeframe);

      const [
        totalInstallations,
        activeInstallations,
        newInstallations,
        totalErrors,
        totalReports,
        platformUsage
      ] = await Promise.all([
        ExtensionInstallation.countDocuments(),
        ExtensionInstallation.countDocuments({
          lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        ExtensionInstallation.countDocuments({
          installedAt: { $gte: start, $lte: end }
        }),
        ExtensionError.countDocuments({
          reportedAt: { $gte: start, $lte: end }
        }),
        Report.countDocuments({
          'context.submittedVia': { $in: ['extension', 'extension_batch'] },
          createdAt: { $gte: start, $lte: end }
        }),
        this.getExtensionPlatformUsage(start, end)
      ]);

      return {
        timeframe,
        installations: {
          total: totalInstallations,
          active: activeInstallations,
          newInstallations,
          retentionRate: totalInstallations > 0 ? (activeInstallations / totalInstallations * 100).toFixed(1) : 0
        },
        usage: {
          totalReports,
          totalErrors,
          platformUsage
        },
        health: await this.getServiceHealth()
      };
    } catch (error) {
      console.error('Error getting extension statistics:', error);
      throw error;
    }
  }

  // Get platform usage statistics
  async getExtensionPlatformUsage(startDate, endDate) {
    return await Report.aggregate([
      {
        $match: {
          'context.submittedVia': { $in: ['extension', 'extension_batch'] },
          createdAt: { $gte: startDate, $lte: endDate }
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
    ]);
  }
}

module.exports = new ExtensionService();