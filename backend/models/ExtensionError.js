// models/ExtensionError.js
const mongoose = require('mongoose');

const extensionErrorSchema = new mongoose.Schema({
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

  // Version information
  version: {
    type: String,
    required: true,
    index: true
  },

  // Error details
  errorType: {
    type: String,
    required: true,
    enum: [
      'javascript_error',
      'network_error',
      'permission_error',
      'storage_error',
      'detection_error',
      'sync_error',
      'ui_error',
      'performance_error',
      'security_error',
      'api_error',
      'crash',
      'memory_error',
      'timeout_error',
      'validation_error',
      'unknown_error'
    ],
    index: true
  },

  errorMessage: {
    type: String,
    required: true
  },

  stackTrace: {
    type: String
  },

  errorCode: {
    type: String
  },

  // Context when error occurred
  context: {
    url: { type: String },
    platform: { type: String },
    feature: { type: String },
    userAction: { type: String },
    timestamp: { type: Date, default: Date.now }
  },

  // User actions leading to error
  userActions: [{
    action: { type: String },
    timestamp: { type: Date },
    element: { type: String },
    data: { type: mongoose.Schema.Types.Mixed }
  }],

  // Browser and system information
  browserInfo: {
    name: { type: String },
    version: { type: String },
    userAgent: { type: String },
    os: { type: String },
    arch: { type: String },
    language: { type: String },
    timezone: { type: String }
  },

  // Extension state when error occurred
  extensionState: {
    settings: { type: mongoose.Schema.Types.Mixed },
    permissions: [{ type: String }],
    storage: { type: mongoose.Schema.Types.Mixed },
    activeFeatures: [{ type: String }],
    memoryUsage: { type: Number },
    uptime: { type: Number }
  },

  // Network information
  ip: {
    type: String,
    index: true
  },

  // Error classification
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },

  category: {
    type: String,
    enum: [
      'functional',
      'performance',
      'security',
      'compatibility',
      'usability',
      'data',
      'network',
      'system'
    ],
    default: 'functional'
  },

  // Error frequency and patterns
  frequency: {
    type: String,
    enum: ['once', 'occasional', 'frequent', 'constant'],
    default: 'once'
  },

  reproducible: {
    type: Boolean,
    default: false
  },

  reproductionSteps: [{ type: String }],

  // Status and resolution
  status: {
    type: String,
    enum: ['reported', 'investigating', 'in_progress', 'resolved', 'closed', 'wont_fix'],
    default: 'reported',
    index: true
  },

  resolved: {
    type: Boolean,
    default: false,
    index: true
  },

  resolvedAt: { type: Date },
  resolvedBy: { type: String },
  resolution: { type: String },

  // Fix information
  fixVersion: { type: String },
  fixDescription: { type: String },
  workaround: { type: String },

  // Reporting information
  reportedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  reportedBy: { type: String }, // System, user, or automatic detection

  // Related information
  relatedErrors: [{
    errorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtensionError' },
    relationship: { type: String, enum: ['duplicate', 'similar', 'caused_by', 'causes'] }
  }],

  affectedUsers: { type: Number, default: 1 },
  totalOccurrences: { type: Number, default: 1 },

  // Analytics and debugging
  debugInfo: {
    consoleOutput: { type: String },
    networkLogs: [{ type: mongoose.Schema.Types.Mixed }],
    performanceMetrics: { type: mongoose.Schema.Types.Mixed },
    memorySnapshot: { type: mongoose.Schema.Types.Mixed }
  },

  // Tags and metadata
  tags: [{ type: String }],
  notes: { type: String },
  
  // Internal tracking
  ticketId: { type: String }, // External ticket system ID
  priority: {
    type: String,
    enum: ['p0', 'p1', 'p2', 'p3', 'p4'],
    default: 'p3'
  },

  assignedTo: { type: String },
  estimatedEffort: { type: Number }, // Hours to fix

  // Automated analysis
  autoAnalysis: {
    isKnownIssue: { type: Boolean, default: false },
    similarErrors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExtensionError' }],
    suggestedFix: { type: String },
    confidence: { type: Number, min: 0, max: 1 }
  }
}, {
  timestamps: true,
  collection: 'extension_errors'
});

// Indexes for performance and querying
extensionErrorSchema.index({ extensionId: 1, reportedAt: -1 });
extensionErrorSchema.index({ userUuid: 1, reportedAt: -1 });
extensionErrorSchema.index({ errorType: 1, severity: 1 });
extensionErrorSchema.index({ status: 1, reportedAt: -1 });
extensionErrorSchema.index({ resolved: 1, reportedAt: -1 });
extensionErrorSchema.index({ version: 1, errorType: 1 });
extensionErrorSchema.index({ reportedAt: -1 });

// TTL index to auto-delete resolved old errors (1 year)
extensionErrorSchema.index({ resolvedAt: 1 }, { 
  expireAfterSeconds: 365 * 24 * 60 * 60,
  partialFilterExpression: { resolved: true }
});

// Virtual for error age
extensionErrorSchema.virtual('age').get(function() {
  return Date.now() - this.reportedAt.getTime();
});

// Virtual for human-readable error type
extensionErrorSchema.virtual('errorTypeLabel').get(function() {
  const labels = {
    'javascript_error': 'JavaScript Error',
    'network_error': 'Network Error',
    'permission_error': 'Permission Error',
    'storage_error': 'Storage Error',
    'detection_error': 'Detection Error',
    'sync_error': 'Sync Error',
    'ui_error': 'UI Error',
    'performance_error': 'Performance Error',
    'security_error': 'Security Error',
    'api_error': 'API Error',
    'crash': 'Crash',
    'memory_error': 'Memory Error',
    'timeout_error': 'Timeout Error',
    'validation_error': 'Validation Error',
    'unknown_error': 'Unknown Error'
  };
  
  return labels[this.errorType] || this.errorType;
});

// Virtual for resolution time
extensionErrorSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  return this.resolvedAt.getTime() - this.reportedAt.getTime();
});

// Instance methods
extensionErrorSchema.methods = {
  // Mark error as resolved
  markResolved(resolvedBy, resolution, fixVersion) {
    this.resolved = true;
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
    this.resolution = resolution;
    this.fixVersion = fixVersion;
    return this.save();
  },

  // Update severity based on impact
  updateSeverity() {
    let severity = 'low';
    
    if (this.errorType === 'crash' || this.errorType === 'security_error') {
      severity = 'critical';
    } else if (this.affectedUsers > 100 || this.totalOccurrences > 1000) {
      severity = 'high';
    } else if (this.affectedUsers > 10 || this.totalOccurrences > 100) {
      severity = 'medium';
    }
    
    this.severity = severity;
    return this.save();
  },

  // Add related error
  addRelatedError(errorId, relationship) {
    this.relatedErrors.push({
      errorId,
      relationship,
      addedAt: new Date()
    });
    return this.save();
  },

  // Get error summary for reporting
  getSummary() {
    return {
      id: this._id,
      type: this.errorTypeLabel,
      message: this.errorMessage.substring(0, 100),
      severity: this.severity,
      status: this.status,
      version: this.version,
      reportedAt: this.reportedAt,
      affectedUsers: this.affectedUsers,
      totalOccurrences: this.totalOccurrences,
      resolved: this.resolved
    };
  },

  // Check if error is critical
  isCritical() {
    const criticalTypes = ['crash', 'security_error', 'memory_error'];
    return criticalTypes.includes(this.errorType) || this.severity === 'critical';
  },

  // Generate error fingerprint for deduplication
  generateFingerprint() {
    const crypto = require('crypto');
    const fingerprint = `${this.errorType}_${this.errorMessage}_${this.version}`;
    return crypto.createHash('md5').update(fingerprint).digest('hex');
  }
};

// Static methods
extensionErrorSchema.statics = {
  // Find or create error (for deduplication)
  async findOrCreateError(errorData) {
    const tempError = new this(errorData);
    const fingerprint = tempError.generateFingerprint();
    
    // Look for existing error with same fingerprint
    let existingError = await this.findOne({
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      version: errorData.version,
      resolved: false
    });

    if (existingError) {
      // Update existing error
      existingError.totalOccurrences += 1;
      existingError.affectedUsers = await this.countAffectedUsers(
        existingError.errorType,
        existingError.errorMessage,
        existingError.version
      );
      
      // Update frequency based on occurrences
      if (existingError.totalOccurrences > 100) {
        existingError.frequency = 'constant';
      } else if (existingError.totalOccurrences > 10) {
        existingError.frequency = 'frequent';
      } else if (existingError.totalOccurrences > 2) {
        existingError.frequency = 'occasional';
      }

      await existingError.updateSeverity();
      await existingError.save();
      return existingError;
    } else {
      // Create new error
      const newError = new this(errorData);
      await newError.save();
      return newError;
    }
  },

  // Count affected users for an error
  async countAffectedUsers(errorType, errorMessage, version) {
    const users = await this.distinct('userUuid', {
      errorType,
      errorMessage,
      version,
      userUuid: { $exists: true, $ne: null }
    });
    return users.length;
  },

  // Get error statistics
  async getErrorStats(startDate, endDate, filters = {}) {
    const matchStage = {
      reportedAt: { $gte: startDate, $lte: endDate }
    };

    // Apply filters
    if (filters.extensionId) matchStage.extensionId = filters.extensionId;
    if (filters.version) matchStage.version = filters.version;
    if (filters.errorType) matchStage.errorType = filters.errorType;
    if (filters.severity) matchStage.severity = filters.severity;

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalErrors: { $sum: 1 },
          totalOccurrences: { $sum: '$totalOccurrences' },
          uniqueUsers: { $addToSet: '$userUuid' },
          resolvedErrors: {
            $sum: { $cond: ['$resolved', 1, 0] }
          },
          criticalErrors: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          errorTypes: { $push: '$errorType' },
          severityDistribution: { $push: '$severity' },
          avgResolutionTime: {
            $avg: {
              $cond: [
                '$resolved',
                { $subtract: ['$resolvedAt', '$reportedAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          totalErrors: 1,
          totalOccurrences: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          resolvedErrors: 1,
          criticalErrors: 1,
          resolutionRate: {
            $cond: [
              { $eq: ['$totalErrors', 0] },
              0,
              { $divide: ['$resolvedErrors', '$totalErrors'] }
            ]
          },
          errorTypes: 1,
          severityDistribution: 1,
          avgResolutionTime: { $divide: ['$avgResolutionTime', 86400000] } // Convert to days
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalErrors: 0,
        totalOccurrences: 0,
        uniqueUsers: 0,
        resolvedErrors: 0,
        criticalErrors: 0,
        resolutionRate: 0,
        errorTypeDistribution: {},
        severityDistribution: {},
        avgResolutionTime: 0
      };
    }

    const result = stats[0];
    result.errorTypeDistribution = this.createDistribution(result.errorTypes);
    result.severityDistribution = this.createDistribution(result.severityDistribution);
    delete result.errorTypes;

    return result;
  },

  // Get top errors by occurrence
  async getTopErrors(limit = 10, filters = {}) {
    const matchStage = {};
    
    if (filters.startDate && filters.endDate) {
      matchStage.reportedAt = { $gte: filters.startDate, $lte: filters.endDate };
    }
    if (filters.resolved !== undefined) {
      matchStage.resolved = filters.resolved;
    }

    return await this.find(matchStage)
      .sort({ totalOccurrences: -1, affectedUsers: -1 })
      .limit(limit)
      .select('errorType errorMessage version totalOccurrences affectedUsers severity status reportedAt')
      .lean();
  },

  // Get error trends over time
  async getErrorTrends(startDate, endDate, groupBy = 'day') {
    const groupFormat = this.getDateGroupFormat(groupBy);
    
    return await this.aggregate([
      {
        $match: {
          reportedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$reportedAt'
            }
          },
          totalErrors: { $sum: 1 },
          totalOccurrences: { $sum: '$totalOccurrences' },
          criticalErrors: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          resolvedErrors: {
            $sum: { $cond: ['$resolved', 1, 0] }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          totalErrors: 1,
          totalOccurrences: 1,
          criticalErrors: 1,
          resolvedErrors: 1,
          resolutionRate: {
            $cond: [
              { $eq: ['$totalErrors', 0] },
              0,
              { $divide: ['$resolvedErrors', '$totalErrors'] }
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

  // Create distribution object
  createDistribution(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  },

  // Auto-triage new errors
  async autoTriage(error) {
    // Set priority based on severity and impact
    if (error.severity === 'critical' || error.affectedUsers > 1000) {
      error.priority = 'p0';
    } else if (error.severity === 'high' || error.affectedUsers > 100) {
      error.priority = 'p1';
    } else if (error.severity === 'medium' || error.affectedUsers > 10) {
      error.priority = 'p2';
    } else {
      error.priority = 'p3';
    }

    // Check for known issues
    const similarErrors = await this.find({
      errorType: error.errorType,
      resolved: true,
      resolution: { $exists: true }
    }).limit(5);

    if (similarErrors.length > 0) {
      error.autoAnalysis.isKnownIssue = true;
      error.autoAnalysis.similarErrors = similarErrors.map(e => e._id);
      error.autoAnalysis.suggestedFix = similarErrors[0].resolution;
      error.autoAnalysis.confidence = 0.8;
    }

    return error;
  },

  // Clean up old resolved errors
  async cleanupOldErrors(retentionDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.deleteMany({
      resolved: true,
      resolvedAt: { $lt: cutoffDate },
      severity: { $nin: ['critical'] } // Keep critical errors longer
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old extension errors`);
    return result.deletedCount;
  }
};

// Pre-save middleware
extensionErrorSchema.pre('save', function(next) {
  // Auto-triage new errors
  if (this.isNew) {
    this.constructor.autoTriage(this);
  }
  
  // Update severity if needed
  if (this.isModified('affectedUsers') || this.isModified('totalOccurrences')) {
    this.updateSeverity();
  }
  
  next();
});

// Post-save middleware
extensionErrorSchema.post('save', function(doc) {
  if (doc.isNew && doc.isCritical()) {
    console.log(`🚨 Critical extension error reported: ${doc.errorType} - ${doc.errorMessage}`);
    // In production, this could trigger alerts/notifications
  }
});

const ExtensionError = mongoose.model('ExtensionError', extensionErrorSchema);

module.exports = ExtensionError;