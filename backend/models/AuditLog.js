const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin ID is required'],
    index: true
  },
  
  // What action was performed
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: [
        'review_report',
        'bulk_review_reports',
        'delete_report',
        'update_user_status',
        'update_system_settings',
        'export_reports',
        'create_admin',
        'delete_user',
        'ban_user',
        'unban_user',
        'reset_user_password',
        'view_user_details',
        'modify_report',
        'system_backup',
        'system_restore',
        'update_moderation_rules',
        'other'
      ],
      message: 'Action must be one of the predefined values'
    },
    index: true
  },

  // What resource was affected (optional)
  resourceType: {
    type: String,
    enum: ['user', 'report', 'system', 'admin', 'setting'],
    index: true
  },

  resourceId: {
    type: String, // Can be ObjectId or other identifier
    index: true
  },

  // Detailed information about the action
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for action details
    default: {}
  },

  // Action result/outcome
  result: {
    success: {
      type: Boolean,
      default: true
    },
    message: String,
    errorCode: String,
    affectedCount: {
      type: Number,
      default: 0
    }
  },

  // Request context
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    requestId: String, // For tracing requests across services
    endpoint: String, // API endpoint that triggered the action
    method: String, // HTTP method
    duration: Number, // Time taken to perform action (ms)
    beforeState: mongoose.Schema.Types.Mixed, // State before action
    afterState: mongoose.Schema.Types.Mixed // State after action
  },

  // Severity/importance of the action
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },

  // Tags for categorization and searching
  tags: [{
    type: String,
    trim: true
  }],

  // Related audit logs (for tracking sequences of actions)
  relatedLogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditLog'
  }],

  // Whether this action requires attention
  flagged: {
    type: Boolean,
    default: false,
    index: true
  },

  // Retention settings
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ flagged: 1, createdAt: -1 });
auditLogSchema.index({ tags: 1, createdAt: -1 });

// Text index for searching
auditLogSchema.index({
  action: 'text',
  'details.description': 'text',
  'result.message': 'text'
});

// Static methods for querying
auditLogSchema.statics.findByAdmin = function(adminId, limit = 50) {
  return this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'username email');
};

auditLogSchema.statics.findByAction = function(action, days = 30, limit = 100) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    action,
    createdAt: { $gte: startDate }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'username email');
};

auditLogSchema.statics.findByResource = function(resourceType, resourceId, limit = 20) {
  return this.find({ resourceType, resourceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'username email');
};

auditLogSchema.statics.getRecentActivity = function(hours = 24, limit = 100) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return this.find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'username email');
};

auditLogSchema.statics.getFlaggedActions = function(limit = 50) {
  return this.find({ flagged: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'username email');
};

auditLogSchema.statics.getAdminActivity = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$adminId',
        actionCount: { $sum: 1 },
        actions: { $addToSet: '$action' },
        lastAction: { $max: '$createdAt' },
        successRate: {
          $avg: { $cond: ['$result.success', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'admin'
      }
    },
    { $unwind: '$admin' },
    { $sort: { actionCount: -1 } }
  ]);
};

// Instance methods
auditLogSchema.methods.addRelatedLog = function(logId) {
  if (!this.relatedLogs.includes(logId)) {
    this.relatedLogs.push(logId);
  }
  return this.save();
};

auditLogSchema.methods.flag = function(reason = '') {
  this.flagged = true;
  if (reason) {
    this.details.flagReason = reason;
  }
  return this.save();
};

auditLogSchema.methods.unflag = function() {
  this.flagged = false;
  if (this.details.flagReason) {
    delete this.details.flagReason;
  }
  return this.save();
};

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Set expiration date if not set (default 1 year retention)
  if (!this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    this.expiresAt = expiryDate;
  }

  // Add default tags based on action
  if (this.action && this.tags.length === 0) {
    this.tags = [this.action.split('_')[0]]; // e.g., 'review' from 'review_report'
  }

  // Set severity based on action type
  if (this.action && !this.isModified('severity')) {
    const criticalActions = ['delete_user', 'ban_user', 'system_restore'];
    const highActions = ['delete_report', 'update_system_settings', 'reset_user_password'];
    
    if (criticalActions.includes(this.action)) {
      this.severity = 'critical';
    } else if (highActions.includes(this.action)) {
      this.severity = 'high';
    }
  }

  next();
});

// Virtual for action description
auditLogSchema.virtual('actionDescription').get(function() {
  const descriptions = {
    review_report: 'Reviewed a report',
    bulk_review_reports: 'Performed bulk report review',
    delete_report: 'Deleted a report',
    update_user_status: 'Updated user status',
    update_system_settings: 'Updated system settings',
    export_reports: 'Exported reports',
    create_admin: 'Created admin user',
    delete_user: 'Deleted user account',
    ban_user: 'Banned user',
    unban_user: 'Unbanned user',
    reset_user_password: 'Reset user password',
    view_user_details: 'Viewed user details',
    modify_report: 'Modified report',
    system_backup: 'Created system backup',
    system_restore: 'Restored system from backup',
    update_moderation_rules: 'Updated moderation rules'
  };

  return descriptions[this.action] || 'Performed action';
});

// Virtual for duration in human readable format
auditLogSchema.virtual('durationFormatted').get(function() {
  if (!this.metadata?.duration) return 'Unknown';
  
  const ms = this.metadata.duration;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
});

// Ensure virtuals are included in JSON
auditLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);