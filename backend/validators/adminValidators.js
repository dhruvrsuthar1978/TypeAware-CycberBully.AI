const Joi = require('joi');

// Common patterns for admin operations
const commonPatterns = {
  objectId: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      'string.length': 'Invalid ID format',
      'string.hex': 'ID must be hexadecimal',
      'any.required': 'ID is required'
    }),

  adminAction: Joi.string()
    .valid(
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
      'update_moderation_rules'
    )
    .required()
    .messages({
      'any.only': 'Invalid admin action',
      'any.required': 'Admin action is required'
    }),

  moderationDecision: Joi.string()
    .valid('confirmed', 'false_positive', 'dismissed', 'needs_escalation')
    .required()
    .messages({
      'any.only': 'Decision must be confirmed, false_positive, dismissed, or needs_escalation',
      'any.required': 'Moderation decision is required'
    }),

  userStatus: Joi.boolean()
    .required()
    .messages({
      'any.required': 'User status (active/inactive) is required'
    }),

  adminNotes: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),

  priorityLevel: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .default('medium')
    .messages({
      'any.only': 'Priority must be low, medium, high, or critical'
    })
};

// Review single report validation
const reviewReport = Joi.object({
  decision: commonPatterns.moderationDecision,
  notes: commonPatterns.adminNotes,
  actionTaken: Joi.string()
    .valid('none', 'warning_sent', 'content_removed', 'user_suspended', 'user_banned', 'escalated')
    .default('none')
    .messages({
      'any.only': 'Action taken must be one of the predefined values'
    }),
  severity: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional()
    .messages({
      'any.only': 'Severity must be low, medium, high, or critical'
    }),
  tags: Joi.array()
    .items(Joi.string().max(30).trim())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Each tag cannot exceed 30 characters'
    }),
  followUpRequired: Joi.boolean()
    .default(false)
    .optional(),
  escalateToSenior: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Bulk review reports validation
const bulkReviewReports = Joi.object({
  reportIds: Joi.array()
    .items(commonPatterns.objectId.required())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one report ID is required',
      'array.max': 'Cannot review more than 100 reports at once',
      'any.required': 'Report IDs are required'
    }),
  decision: commonPatterns.moderationDecision,
  notes: commonPatterns.adminNotes,
  actionTaken: Joi.string()
    .valid('none', 'warning_sent', 'content_removed', 'users_suspended', 'users_banned')
    .default('none')
    .optional(),
  applyToSimilar: Joi.boolean()
    .default(false)
    .optional()
    .messages({
      'boolean.base': 'Apply to similar must be a boolean'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Update user status validation
const updateUserStatus = Joi.object({
  isActive: commonPatterns.userStatus,
  reason: Joi.string()
    .max(500)
    .trim()
    .required()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Reason for status change is required'
    }),
  duration: Joi.object({
    value: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .optional()
      .messages({
        'number.min': 'Duration must be at least 1 day',
        'number.max': 'Duration cannot exceed 365 days'
      }),
    unit: Joi.string()
      .valid('days', 'weeks', 'months')
      .optional()
  }).optional(),
  notifyUser: Joi.boolean()
    .default(true)
    .optional(),
  restrictAccess: Joi.object({
    reports: Joi.boolean().default(false).optional(),
    profile: Joi.boolean().default(false).optional(),
    messaging: Joi.boolean().default(false).optional()
  }).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Delete report validation
const deleteReport = Joi.object({
  reason: Joi.string()
    .max(500)
    .trim()
    .required()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Reason for deletion is required'
    }),
  category: Joi.string()
    .valid('spam', 'duplicate', 'invalid', 'test_data', 'gdpr_request', 'other')
    .required()
    .messages({
      'any.only': 'Deletion category is required',
      'any.required': 'Deletion category is required'
    }),
  backupData: Joi.boolean()
    .default(true)
    .optional(),
  permanentDelete: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// System settings update validation
const updateSystemSettings = Joi.object({
  moderationRules: Joi.object({
    autoModerationEnabled: Joi.boolean().optional(),
    confidenceThreshold: Joi.number().min(0).max(1).optional(),
    escalationThreshold: Joi.number().min(0).max(1).optional(),
    autoActionEnabled: Joi.boolean().optional()
  }).optional(),
  rateLimit: Joi.object({
    reportsPerMinute: Joi.number().integer().min(1).max(100).optional(),
    requestsPerHour: Joi.number().integer().min(100).max(10000).optional(),
    burstLimit: Joi.number().integer().min(10).max(1000).optional()
  }).optional(),
  notifications: Joi.object({
    emailEnabled: Joi.boolean().optional(),
    slackEnabled: Joi.boolean().optional(),
    webhookUrl: Joi.string().uri().optional()
  }).optional(),
  security: Joi.object({
    requireTwoFactor: Joi.boolean().optional(),
    passwordMinLength: Joi.number().integer().min(6).max(32).optional(),
    sessionTimeout: Joi.number().integer().min(5).max(1440).optional()
  }).optional(),
  maintenance: Joi.object({
    enabled: Joi.boolean().optional(),
    message: Joi.string().max(200).optional(),
    allowAdminAccess: Joi.boolean().optional()
  }).optional()
}).min(1).options({
  stripUnknown: true,
  abortEarly: false
}).messages({
  'object.min': 'At least one setting must be provided'
});

// Export reports validation
const exportReports = Joi.object({
  format: Joi.string()
    .valid('json', 'csv', 'xlsx', 'pdf')
    .default('json')
    .optional(),
  filters: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'false_positive', 'dismissed').optional(),
    category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').optional(),
    platform: Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other').optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional(),
    reviewedBy: commonPatterns.objectId.optional(),
    confidence: Joi.object({
      min: Joi.number().min(0).max(1).optional(),
      max: Joi.number().min(0).max(1).optional()
    }).optional()
  }).optional(),
  fields: Joi.array()
    .items(Joi.string().valid(
      'id', 'content', 'category', 'platform', 'severity', 'confidence', 
      'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'browserUUID',
      'userId', 'decision', 'notes', 'actionTaken'
    ))
    .optional(),
  maxRecords: Joi.number()
    .integer()
    .min(1)
    .max(50000)
    .default(10000)
    .messages({
      'number.max': 'Cannot export more than 50000 records at once'
    }),
  includePersonalData: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Query parameter validations
const getDashboardQuery = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(7)
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Cannot query more than 365 days'
    }),
  includeDetails: Joi.boolean()
    .default(true)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const getPendingReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').optional(),
  platform: Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other').optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assignedTo: commonPatterns.objectId.optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'severity', 'confidence', 'platform', 'category', 'priority')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const getFlaggedUsersQuery = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.max': 'Cannot fetch more than 100 users at once'
    }),
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30),
  minReports: Joi.number()
    .integer()
    .min(1)
    .default(5)
    .optional(),
  sortBy: Joi.string()
    .valid('totalReports', 'confirmedReports', 'riskScore', 'lastReport')
    .default('totalReports')
    .optional(),
  includeInactive: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const getSystemAnalyticsQuery = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30),
  granularity: Joi.string()
    .valid('hour', 'day', 'week', 'month')
    .default('day')
    .optional(),
  metrics: Joi.array()
    .items(Joi.string().valid('reports', 'users', 'accuracy', 'response_time', 'platform_distribution'))
    .optional(),
  compareWithPrevious: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const getAdminLogsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  action: commonPatterns.adminAction.optional(),
  adminId: commonPatterns.objectId.optional(),
  days: Joi.number().integer().min(1).max(90).default(30),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  resourceType: Joi.string().valid('user', 'report', 'system', 'admin', 'setting').optional(),
  success: Joi.boolean().optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Moderation queue validation
const getModerationQueueQuery = Joi.object({
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'critical', 'all')
    .default('high')
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(25)
    .messages({
      'number.max': 'Cannot fetch more than 100 items at once'
    }),
  category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').optional(),
  platform: Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other').optional(),
  assignedTo: commonPatterns.objectId.optional(),
  unassignedOnly: Joi.boolean().default(false).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// User management validation
const createAdminUser = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(254)
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.max': 'Email address cannot exceed 254 characters',
      'any.required': 'Email is required'
    }),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('admin', 'moderator', 'senior_admin')
    .default('admin')
    .optional(),
  permissions: Joi.array()
    .items(Joi.string().valid(
      'review_reports', 'delete_reports', 'manage_users', 'system_settings',
      'export_data', 'view_analytics', 'moderate_content', 'ban_users'
    ))
    .optional(),
  profile: Joi.object({
    firstName: Joi.string().trim().max(50).optional(),
    lastName: Joi.string().trim().max(50).optional()
  }).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const assignReports = Joi.object({
  reportIds: Joi.array()
    .items(commonPatterns.objectId.required())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one report ID is required',
      'array.max': 'Cannot assign more than 50 reports at once'
    }),
  assignTo: commonPatterns.objectId.required(),
  priority: commonPatterns.priorityLevel,
  dueDate: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Due date cannot be in the past'
    }),
  notes: commonPatterns.adminNotes
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Content moderation rules validation
const updateModerationRules = Joi.object({
  rules: Joi.array()
    .items(Joi.object({
      id: Joi.string().max(50).optional(),
      name: Joi.string().max(100).required(),
      description: Joi.string().max(500).optional(),
      category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').required(),
      conditions: Joi.object({
        keywords: Joi.array().items(Joi.string().max(50)).optional(),
        patterns: Joi.array().items(Joi.string().max(200)).optional(),
        platforms: Joi.array().items(Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other')).optional(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
      }).required(),
      actions: Joi.object({
        autoFlag: Joi.boolean().default(true),
        autoEscalate: Joi.boolean().default(false),
        requireReview: Joi.boolean().default(true),
        notifyModerators: Joi.boolean().default(false)
      }).required(),
      isActive: Joi.boolean().default(true),
      priority: commonPatterns.priorityLevel
    }))
    .min(1)
    .required(),
  applyImmediately: Joi.boolean().default(false).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// System backup and restore validation
const createSystemBackup = Joi.object({
  includeReports: Joi.boolean().default(true).optional(),
  includeUsers: Joi.boolean().default(true).optional(),
  includeSettings: Joi.boolean().default(true).optional(),
  includeLogs: Joi.boolean().default(false).optional(),
  compressionLevel: Joi.number().integer().min(1).max(9).default(6).optional(),
  encryptBackup: Joi.boolean().default(true).optional(),
  retentionDays: Joi.number().integer().min(1).max(365).default(90).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

const restoreSystemBackup = Joi.object({
  backupId: Joi.string().required(),
  restoreOptions: Joi.object({
    reports: Joi.boolean().default(false).optional(),
    users: Joi.boolean().default(false).optional(),
    settings: Joi.boolean().default(false).optional(),
    logs: Joi.boolean().default(false).optional()
  }).required(),
  confirmationCode: Joi.string().length(6).required().messages({
    'string.length': 'Confirmation code must be exactly 6 characters'
  }),
  createBackupBeforeRestore: Joi.boolean().default(true).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Performance monitoring validation
const getPerformanceMetrics = Joi.object({
  timeframe: Joi.string()
    .valid('1h', '6h', '24h', '7d', '30d')
    .default('24h')
    .optional(),
  metrics: Joi.array()
    .items(Joi.string().valid(
      'response_time', 'throughput', 'error_rate', 'cpu_usage', 
      'memory_usage', 'database_connections', 'queue_length'
    ))
    .default(['response_time', 'throughput', 'error_rate'])
    .optional(),
  granularity: Joi.string()
    .valid('1m', '5m', '15m', '1h', '6h', '1d')
    .default('5m')
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Notification and alert validation
const createAlert = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  conditions: Joi.object({
    metric: Joi.string().valid('error_rate', 'response_time', 'queue_length', 'pending_reports').required(),
    threshold: Joi.number().required(),
    operator: Joi.string().valid('gt', 'lt', 'eq', 'gte', 'lte').required(),
    duration: Joi.number().integer().min(1).max(3600).required() // seconds
  }).required(),
  actions: Joi.object({
    email: Joi.boolean().default(false).optional(),
    slack: Joi.boolean().default(false).optional(),
    webhook: Joi.boolean().default(false).optional(),
    autoEscalate: Joi.boolean().default(false).optional()
  }).required(),
  recipients: Joi.array()
    .items(Joi.string().email())
    .when('actions.email', { is: true, then: Joi.required() })
    .optional(),
  isActive: Joi.boolean().default(true).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Advanced search and filtering
const advancedSearch = Joi.object({
  query: Joi.string().max(200).optional(),
  filters: Joi.object({
    dateRange: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().min(Joi.ref('start')).required()
    }).optional(),
    userIds: Joi.array().items(commonPatterns.objectId.required()).max(100).optional(),
    reportIds: Joi.array().items(commonPatterns.objectId.required()).max(100).optional(),
    contentSimilarity: Joi.object({
      threshold: Joi.number().min(0).max(1).default(0.8),
      algorithm: Joi.string().valid('cosine', 'jaccard', 'levenshtein').default('cosine')
    }).optional(),
    riskScore: Joi.object({
      min: Joi.number().min(0).max(100).optional(),
      max: Joi.number().min(0).max(100).optional()
    }).optional(),
    geolocation: Joi.object({
      country: Joi.string().length(2).optional(),
      region: Joi.string().max(50).optional(),
      city: Joi.string().max(100).optional()
    }).optional()
  }).optional(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }).optional(),
  sorting: Joi.object({
    field: Joi.string().valid('createdAt', 'severity', 'confidence', 'riskScore').default('createdAt'),
    direction: Joi.string().valid('asc', 'desc').default('desc')
  }).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

module.exports = {
  schemas: {
    reviewReport,
    bulkReviewReports,
    updateUserStatus,
    deleteReport,
    updateSystemSettings,
    exportReports,
    createAdminUser,
    assignReports,
    updateModerationRules,
    createSystemBackup,
    restoreSystemBackup,
    createAlert,
    advancedSearch,
    // Query validations
    getDashboardQuery,
    getPendingReportsQuery,
    getFlaggedUsersQuery,
    getSystemAnalyticsQuery,
    getAdminLogsQuery,
    getModerationQueueQuery,
    getPerformanceMetrics
  },
  patterns: commonPatterns
};