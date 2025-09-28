// models/ExtensionInstallation.js
const mongoose = require('mongoose');

const extensionInstallationSchema = new mongoose.Schema({
  // Extension identification
  extensionId: {
    type: String,
    required: true,
    index: true
  },

  // User identification (anonymous UUID from extension)
  userUuid: {
    type: String,
    required: true,
    index: true
  },

  // Version information
  version: {
    type: String,
    required: true
  },

  // Installation details
  installedAt: {
    type: Date,
    required: true,
    default: Date.now
  },

  lastActiveAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // Browser and system information
  browserInfo: {
    name: { type: String },
    version: { type: String },
    os: { type: String },
    arch: { type: String }
  },

  // Network information
  ip: {
    type: String,
    required: true
  },

  userAgent: {
    type: String
  },

  // Installation source tracking
  installationSource: {
    type: String,
    enum: ['chrome_store', 'firefox_addon', 'edge_store', 'manual', 'developer', 'unknown'],
    default: 'unknown'
  },

  // Status tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'uninstalled', 'suspended'],
    default: 'active',
    index: true
  },

  // Usage statistics
  heartbeatCount: {
    type: Number,
    default: 0
  },

  lastHeartbeat: {
    type: Date,
    default: Date.now
  },

  // Feature usage tracking
  features: {
    reportsSubmitted: { type: Number, default: 0 },
    detectionsTriggered: { type: Number, default: 0 },
    settingsChanged: { type: Number, default: 0 },
    errorsReported: { type: Number, default: 0 }
  },

  // Performance metrics
  performance: {
    avgResponseTime: { type: Number },
    errorRate: { type: Number, default: 0 },
    crashCount: { type: Number, default: 0 },
    lastCrash: { type: Date }
  },

  // Compliance and security
  permissions: [{
    name: { type: String },
    granted: { type: Boolean },
    grantedAt: { type: Date }
  }],

  // Uninstallation tracking
  uninstalledAt: { type: Date },
  uninstallReason: { type: String },
  uninstallFeedback: { type: String },

  // Metadata
  notes: { type: String },
  tags: [{ type: String }]
}, {
  timestamps: true,
  collection: 'extension_installations'
});

// Indexes for performance
extensionInstallationSchema.index({ extensionId: 1, userUuid: 1 }, { unique: true });
extensionInstallationSchema.index({ status: 1, lastActiveAt: -1 });
extensionInstallationSchema.index({ installedAt: -1 });
extensionInstallationSchema.index({ version: 1, status: 1 });

// Virtual for installation age
extensionInstallationSchema.virtual('installationAge').get(function() {
  return Date.now() - this.installedAt.getTime();
});

// Virtual for activity status
extensionInstallationSchema.virtual('isRecentlyActive').get(function() {
  const hoursSinceLastActive = (Date.now() - this.lastActiveAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastActive < 24; // Active within last 24 hours
});

// Instance methods
extensionInstallationSchema.methods = {
  // Update last activity
  updateActivity() {
    this.lastActiveAt = new Date();
    this.heartbeatCount += 1;
    this.lastHeartbeat = new Date();
    return this.save();
  },

  // Mark as uninstalled
  markUninstalled(reason, feedback) {
    this.status = 'uninstalled';
    this.uninstalledAt = new Date();
    this.uninstallReason = reason;
    this.uninstallFeedback = feedback;
    return this.save();
  },

  // Update performance metrics
  updatePerformance(metrics) {
    this.performance = {
      ...this.performance,
      ...metrics,
      lastUpdated: new Date()
    };
    return this.save();
  },

  // Increment feature usage
  incrementFeatureUsage(feature) {
    if (this.features[feature] !== undefined) {
      this.features[feature] += 1;
      return this.save();
    }
    return Promise.resolve(this);
  }
};

// Static methods
extensionInstallationSchema.statics = {
  // Find active installations
  async findActive() {
    return await this.find({ 
      status: 'active',
      lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
  },

  // Get installation statistics
  async getInstallationStats() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalInstallations: { $sum: 1 },
          activeInstallations: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $gte: ['$lastActiveAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgHeartbeatCount: { $avg: '$heartbeatCount' },
          totalReports: { $sum: '$features.reportsSubmitted' }
        }
      }
    ]);

    return stats[0] || {
      totalInstallations: 0,
      activeInstallations: 0,
      avgHeartbeatCount: 0,
      totalReports: 0
    };
  },

  // Get version distribution
  async getVersionDistribution() {
    return await this.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$version',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  },

  // Get platform distribution
  async getPlatformDistribution() {
    return await this.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$installationSource',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  },

  // Find installations needing attention
  async findProblematic() {
    return await this.find({
      $or: [
        { 'performance.errorRate': { $gte: 0.1 } }, // High error rate
        { 'performance.crashCount': { $gte: 3 } }, // Multiple crashes
        { 
          lastActiveAt: { 
            $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          },
          status: 'active'
        } // Inactive for 30 days but still marked active
      ]
    });
  }
};

// Pre-save middleware
extensionInstallationSchema.pre('save', function(next) {
  // Auto-update status based on activity
  const daysSinceLastActive = (Date.now() - this.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastActive > 30 && this.status === 'active') {
    this.status = 'inactive';
  }

  next();
});

// Post-save middleware for logging
extensionInstallationSchema.post('save', function(doc) {
  // Log significant changes
  if (doc.isNew) {
    console.log(`📱 New extension installation: ${doc.extensionId} for user ${doc.userUuid}`);
  }
});

const ExtensionInstallation = mongoose.model('ExtensionInstallation', extensionInstallationSchema);

module.exports = ExtensionInstallation;