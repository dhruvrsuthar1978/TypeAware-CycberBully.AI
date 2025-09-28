// models/ExtensionActivity.js
const mongoose = require('mongoose');

const extensionActivitySchema = new mongoose.Schema({
  // Extension identification
  extensionId: {
    type: String,
    required: true,
    index: true
  },

  // User identification
  userUuid: {
    type: String,
    index: true
  },

  // Activity details
  action: {
    type: String,
    required: true,
    enum: [
      'heartbeat',
      'installation_registered',
      'report_submitted',
      'batch_reports_submitted',
      'settings_updated',
      'data_sync',
      'error_reported',
      'feedback_submitted',
      'analytics_submitted',
      'feature_used',
      'session_started',
      'session_ended',
      'detection_triggered',
      'warning_shown',
      'warning_dismissed',
      'pattern_updated',
      'cache_cleared',
      'debug_enabled',
      'export_data',
      'import_settings',
      'uninstall_initiated'
    ],
    index: true
  },

  // Activity data
  data: {
    type: mongoose.Schema.Types.Mixed
  },

  // Context information
  context: {
    version: { type: String },
    platform: { type: String },
    url: { type: String },
    userAgent: { type: String },
    browserInfo: {
      name: { type: String },
      version: { type: String },
      os: { type: String }
    }
  },

  // Network information
  ip: {
    type: String,
    index: true
  },

  // Geographic information (if available)
  location: {
    country: { type: String },
    region: { type: String },
    city: { type: String },
    timezone: { type: String }
  },

  // Timing information
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  duration: {
    type: Number // Duration in milliseconds (for activities that have duration)
  },

  // Session information
  sessionId: {
    type: String,
    index: true
  },

  // Performance metrics
  performance: {
    memoryUsage: { type: Number },
    cpuUsage: { type: Number },
    networkLatency: { type: Number },
    renderTime: { type: Number }
  },

  // Success/failure status
  status: {
    type: String,
    enum: ['success', 'failure', 'partial', 'pending'],
    default: 'success'
  },

  // Error information (if status is failure)
  error: {
    message: { type: String },
    code: { type: String },
    stack: { type: String }
  },

  // Related entities
  relatedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },

  relatedErrorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExtensionError'
  },

  // Flags for special activities
  isSystemGenerated: { type: Boolean, default: false },
  isCritical: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },

  // Metadata
  tags: [{ type: String }],
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'extension_activities'
});

// Indexes for performance
extensionActivitySchema.index({ extensionId: 1, timestamp: -1 });
extensionActivitySchema.index({ userUuid: 1, timestamp: -1 });
extensionActivitySchema.index({ action: 1, timestamp: -1 });
extensionActivitySchema.index({ sessionId: 1, timestamp: 1 });
extensionActivitySchema.index({ timestamp: -1 });
extensionActivitySchema.index({ status: 1, timestamp: -1 });

// TTL index to auto-delete old activities (90 days)
extensionActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for activity age
extensionActivitySchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Virtual for human-readable action
extensionActivitySchema.virtual('actionLabel').get(function() {
  const labels = {
    'heartbeat': 'Heartbeat',
    'installation_registered': 'Installation Registered',
    'report_submitted': 'Report Submitted',
    'batch_reports_submitted': 'Batch Reports Submitted',
    'settings_updated': 'Settings Updated',
    'data_sync': 'Data Synchronized',
    'error_reported': 'Error Reported',
    'feedback_submitted': 'Feedback Submitted',
    'analytics_submitted': 'Analytics Submitted',
    'feature_used': 'Feature Used',
    'session_started': 'Session Started',
    'session_ended': 'Session Ended',
    'detection_triggered': 'Detection Triggered',
    'warning_shown': 'Warning Shown',
    'warning_dismissed': 'Warning Dismissed'
  };
  
  return labels[this.action] || this.action;
});

// Instance methods
extensionActivitySchema.methods = {
  // Check if activity is recent
  isRecent(hours = 24) {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.timestamp > hoursAgo;
  },

  // Get activity summary
  getSummary() {
    return {
      id: this._id,
      action: this.actionLabel,
      userUuid: this.userUuid,
      timestamp: this.timestamp,
      status: this.status,
      data: this.data ? Object.keys(this.data).length : 0
    };
  },

  // Add performance metrics
  addPerformanceMetrics(metrics) {
    this.performance = { ...this.performance, ...metrics };
    return this.save();
  },

  // Mark as failed
  markAsFailed(errorMessage, errorCode) {
    this.status = 'failure';
    this.error = {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date()
    };
    return this.save();
  }
};

// Static methods
extensionActivitySchema.statics = {
  // Log new activity
  async logActivity(activityData) {
    try {
      const activity = new this({
        ...activityData,
        timestamp: new Date()
      });
      
      await activity.save();
      return activity;
    } catch (error) {
      console.error('Error logging extension activity:', error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  },

  // Get activity statistics for date range
  async getActivityStats(startDate, endDate, filters = {}) {
    const matchStage = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    // Apply filters
    if (filters.extensionId) matchStage.extensionId = filters.extensionId;
    if (filters.userUuid) matchStage.userUuid = filters.userUuid;
    if (filters.action) matchStage.action = filters.action;
    if (filters.status) matchStage.status = filters.status;

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userUuid' },
          uniqueExtensions: { $addToSet: '$extensionId' },
          actionCounts: {
            $push: '$action'
          },
          statusCounts: {
            $push: '$status'
          },
          avgDuration: { $avg: '$duration' },
          totalErrors: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalActivities: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueExtensions: { $size: '$uniqueExtensions' },
          actionCounts: 1,
          statusCounts: 1,
          avgDuration: 1,
          totalErrors: 1,
          errorRate: {
            $cond: [
              { $eq: ['$totalActivities', 0] },
              0,
              { $divide: ['$totalErrors', '$totalActivities'] }
            ]
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalActivities: 0,
        uniqueUsers: 0,
        uniqueExtensions: 0,
        actionDistribution: {},
        statusDistribution: {},
        avgDuration: 0,
        errorRate: 0
      };
    }

    const result = stats[0];
    result.actionDistribution = this.createDistribution(result.actionCounts);
    result.statusDistribution = this.createDistribution(result.statusCounts);
    delete result.actionCounts;
    delete result.statusCounts;

    return result;
  },

  // Get user activity timeline
  async getUserActivityTimeline(userUuid, limit = 100, startDate = null) {
    const query = { userUuid };
    if (startDate) {
      query.timestamp = { $gte: startDate };
    }

    return await this.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('action timestamp data status context.version context.platform')
      .lean();
  },

  // Get most active users
  async getMostActiveUsers(startDate, endDate, limit = 10) {
    return await this.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          userUuid: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$userUuid',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          actions: { $addToSet: '$action' },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          userUuid: '$_id',
          activityCount: 1,
          lastActivity: 1,
          uniqueActions: { $size: '$actions' },
          errorCount: 1,
          errorRate: {
            $cond: [
              { $eq: ['$activityCount', 0] },
              0,
              { $divide: ['$errorCount', '$activityCount'] }
            ]
          }
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: limit }
    ]);
  },

  // Get activity trends over time
  async getActivityTrends(startDate, endDate, groupBy = 'day') {
    const groupFormat = this.getDateGroupFormat(groupBy);
    
    return await this.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userUuid' },
          errors: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          errors: 1,
          errorRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $divide: ['$errors', '$count'] }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);
  },

  // Get date group format for aggregation
  getDateGroupFormat(groupBy) {
    const formats = {
      'hour': '%Y-%m-%d-%H',
      'day': '%Y-%m-%d',
      'week': '%Y-%U',
      'month': '%Y-%m'
    };
    return formats[groupBy] || formats.day;
  },

  // Create distribution object from array
  createDistribution(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  },

  // Clean up old activities beyond retention period
  async cleanupOldActivities(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.deleteMany({
      timestamp: { $lt: cutoffDate },
      isCritical: { $ne: true } // Keep critical activities longer
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old extension activities`);
    return result.deletedCount;
  },

  // Get session activities
  async getSessionActivities(sessionId) {
    return await this.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();
  },

  // Calculate session duration
  async getSessionDuration(sessionId) {
    const activities = await this.find({ sessionId })
      .sort({ timestamp: 1 })
      .select('timestamp action')
      .lean();

    if (activities.length < 2) return 0;

    const start = activities[0].timestamp;
    const end = activities[activities.length - 1].timestamp;
    
    return end.getTime() - start.getTime();
  }
};

// Pre-save middleware
extensionActivitySchema.pre('save', function(next) {
  // Auto-set critical flag for important actions
  const criticalActions = [
    'error_reported',
    'uninstall_initiated',
    'security_violation'
  ];
  
  if (criticalActions.includes(this.action)) {
    this.isCritical = true;
  }
  
  next();
});

const ExtensionActivity = mongoose.model('ExtensionActivity', extensionActivitySchema);

module.exports = ExtensionActivity;