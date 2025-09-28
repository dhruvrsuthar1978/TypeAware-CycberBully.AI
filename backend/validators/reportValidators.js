const Joi = require('joi');

// Common validation patterns for reports
const commonPatterns = {
  browserUUID: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.uuid': 'Browser UUID must be a valid UUID v4',
      'any.required': 'Browser UUID is required'
    }),

  reportId: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      'string.length': 'Invalid report ID format',
      'string.hex': 'Report ID must be hexadecimal',
      'any.required': 'Report ID is required'
    }),

  content: Joi.string()
    .min(1)
    .max(10000)
    .trim()
    .required()
    .messages({
      'string.min': 'Content cannot be empty',
      'string.max': 'Content cannot exceed 10000 characters',
      'any.required': 'Content is required'
    }),

  platform: Joi.string()
    .valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'discord', 'other')
    .required()
    .messages({
      'any.only': 'Platform must be one of the supported platforms',
      'any.required': 'Platform is required'
    }),

  category: Joi.string()
    .valid(
      'harassment',
      'hate_speech', 
      'spam',
      'bullying',
      'threat',
      'sexual_content',
      'violence',
      'discrimination',
      'misinformation',
      'impersonation',
      'copyright',
      'privacy_violation',
      'other'
    )
    .required()
    .messages({
      'any.only': 'Category must be one of the predefined abuse types',
      'any.required': 'Classification category is required'
    }),

  severity: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .default('medium')
    .messages({
      'any.only': 'Severity must be low, medium, high, or critical'
    }),

  confidence: Joi.number()
    .min(0)
    .max(1)
    .default(0.8)
    .messages({
      'number.min': 'Confidence must be between 0 and 1',
      'number.max': 'Confidence must be between 0 and 1'
    }),

  detectionMethod: Joi.string()
    .valid('regex', 'nlp', 'fuzzy_match', 'user_report', 'ml_model', 'manual_review')
    .default('user_report')
    .messages({
      'any.only': 'Detection method must be one of the supported types'
    }),

  url: Joi.string()
    .uri()
    .max(2000)
    .optional()
    .messages({
      'string.uri': 'URL must be a valid URI',
      'string.max': 'URL cannot exceed 2000 characters'
    }),

  elementType: Joi.string()
    .valid('comment', 'post', 'reply', 'message', 'bio', 'username', 'image', 'video', 'livestream', 'story', 'other')
    .default('other')
    .messages({
      'any.only': 'Element type must be one of the supported types'
    })
};

// Flagged term validation schema
const flaggedTermSchema = Joi.object({
  term: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Flagged term cannot be empty',
      'string.max': 'Flagged term cannot exceed 100 characters',
      'any.required': 'Flagged term is required'
    }),
  positions: Joi.array()
    .items(Joi.number().integer().min(0))
    .default([])
    .messages({
      'array.base': 'Positions must be an array of numbers',
      'number.min': 'Position cannot be negative'
    }),
  severity: commonPatterns.severity,
  confidence: commonPatterns.confidence.optional()
});

// Main report submission validation
const submitReport = Joi.object({
  browserUUID: commonPatterns.browserUUID,
  content: Joi.object({
    original: commonPatterns.content,
    flaggedTerms: Joi.array()
      .items(flaggedTermSchema)
      .max(50)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 50 flagged terms'
      }),
    severity: commonPatterns.severity,
    language: Joi.string()
      .length(2)
      .optional()
      .messages({
        'string.length': 'Language code must be 2 characters (ISO 639-1)'
      }),
    cleanedContent: Joi.string()
      .max(10000)
      .optional()
      .messages({
        'string.max': 'Cleaned content cannot exceed 10000 characters'
      })
  }).required(),
  context: Joi.object({
    platform: commonPatterns.platform,
    url: commonPatterns.url,
    pageTitle: Joi.string()
      .max(500)
      .trim()
      .optional()
      .messages({
        'string.max': 'Page title cannot exceed 500 characters'
      }),
    elementType: commonPatterns.elementType,
    parentContent: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Parent content cannot exceed 1000 characters'
      }),
    threadId: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Thread ID cannot exceed 100 characters'
      }),
    timestamp: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Timestamp cannot be in the future'
      })
  }).required(),
  classification: Joi.object({
    category: commonPatterns.category,
    subcategory: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Subcategory cannot exceed 50 characters'
      }),
    confidence: commonPatterns.confidence,
    detectionMethod: commonPatterns.detectionMethod,
    modelVersion: Joi.string()
      .max(20)
      .optional()
      .messages({
        'string.max': 'Model version cannot exceed 20 characters'
      }),
    ruleId: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': 'Rule ID cannot exceed 50 characters'
      }),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 tags',
        'string.max': 'Each tag cannot exceed 30 characters'
      })
  }).required(),
  metadata: Joi.object({
    userAgent: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'User agent string too long'
      }),
    sessionId: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Session ID too long'
      }),
    deviceType: Joi.string()
      .valid('desktop', 'mobile', 'tablet', 'unknown')
      .optional(),
    browserInfo: Joi.object({
      name: Joi.string().max(50).optional(),
      version: Joi.string().max(20).optional()
    }).optional(),
    geolocation: Joi.object({
      country: Joi.string().length(2).optional(),
      region: Joi.string().max(50).optional(),
      city: Joi.string().max(100).optional()
    }).optional(),
    processingTime: Joi.number()
      .integer()
      .min(0)
      .max(60000)
      .optional()
      .messages({
        'number.min': 'Processing time cannot be negative',
        'number.max': 'Processing time cannot exceed 60 seconds'
      })
  }).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Batch report submission validation
const batchReports = Joi.object({
  browserUUID: commonPatterns.browserUUID,
  reports: Joi.array()
    .items(Joi.object({
      content: Joi.object({
        original: commonPatterns.content,
        flaggedTerms: Joi.array().items(flaggedTermSchema).max(20).default([]),
        severity: commonPatterns.severity
      }).required(),
      context: Joi.object({
        platform: commonPatterns.platform,
        url: commonPatterns.url,
        pageTitle: Joi.string().max(500).optional(),
        elementType: commonPatterns.elementType
      }).required(),
      classification: Joi.object({
        category: commonPatterns.category,
        confidence: commonPatterns.confidence,
        detectionMethod: commonPatterns.detectionMethod
      }).required()
    }))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one report is required',
      'array.max': 'Maximum 20 reports allowed per batch'
    }),
  metadata: Joi.object({
    batchId: Joi.string().max(100).optional(),
    processingMode: Joi.string().valid('fast', 'thorough').default('fast').optional()
  }).optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Report feedback validation
const submitFeedback = Joi.object({
  isHelpful: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Feedback rating is required'
    }),
  comment: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Feedback comment cannot exceed 500 characters'
    }),
  browserUUID: commonPatterns.browserUUID,
  categories: Joi.array()
    .items(Joi.string().valid('accuracy', 'relevance', 'timeliness', 'completeness', 'other'))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Cannot select more than 5 feedback categories'
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Update report status validation (for users)
const updateReportStatus = Joi.object({
  status: Joi.string()
    .valid('false_positive', 'withdrawn')
    .required()
    .messages({
      'any.only': 'Users can only mark reports as false positive or withdraw them',
      'any.required': 'Status is required'
    }),
  reason: Joi.string()
    .max(500)
    .trim()
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    }),
  additionalInfo: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .messages({
      'string.max': 'Additional information cannot exceed 1000 characters'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Query parameter validations
const getReportsQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  status: Joi.string()
    .valid('pending', 'under_review', 'confirmed', 'false_positive', 'dismissed', 'escalated')
    .optional(),
  category: commonPatterns.category.optional(),
  platform: commonPatterns.platform.optional(),
  severity: commonPatterns.severity.optional(),
  dateFrom: Joi.date()
    .optional(),
  dateTo: Joi.date()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'severity', 'confidence', 'platform', 'category')
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

const getBrowserReportsQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.max': 'Limit cannot exceed 50 for browser requests'
    }),
  status: Joi.string()
    .valid('pending', 'confirmed', 'false_positive', 'dismissed')
    .optional(),
  category: commonPatterns.category.optional(),
  days: Joi.number()
    .integer()
    .min(1)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Cannot query more than 90 days of data'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

const getStatsQuery = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Cannot query more than 365 days of data'
    }),
  groupBy: Joi.string()
    .valid('day', 'week', 'month')
    .default('day')
    .optional(),
  includeDetails: Joi.boolean()
    .default(false)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Report search validation
const searchReports = Joi.object({
  query: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 200 characters',
      'any.required': 'Search query is required'
    }),
  filters: Joi.object({
    category: commonPatterns.category.optional(),
    platform: commonPatterns.platform.optional(),
    severity: commonPatterns.severity.optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional()
  }).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Report export validation
const exportReports = Joi.object({
  format: Joi.string()
    .valid('json', 'csv', 'xlsx')
    .default('json')
    .optional(),
  filters: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'false_positive', 'dismissed').optional(),
    category: commonPatterns.category.optional(),
    platform: commonPatterns.platform.optional(),
    severity: commonPatterns.severity.optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().min(Joi.ref('dateFrom')).optional()
  }).optional(),
  fields: Joi.array()
    .items(Joi.string().valid(
      'id', 'content', 'category', 'platform', 'severity', 'confidence', 
      'status', 'createdAt', 'reviewedAt', 'browserUUID'
    ))
    .optional(),
  maxRecords: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(1000)
    .messages({
      'number.max': 'Cannot export more than 10000 records at once'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Bulk operations validation
const bulkUpdateReports = Joi.object({
  reportIds: Joi.array()
    .items(commonPatterns.reportId.required())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one report ID is required',
      'array.max': 'Cannot update more than 100 reports at once'
    }),
  updates: Joi.object({
    status: Joi.string()
      .valid('false_positive', 'withdrawn')
      .optional(),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .max(10)
      .optional()
  }).min(1).required().messages({
    'object.min': 'At least one update field is required'
  }),
  reason: Joi.string()
    .max(500)
    .optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

module.exports = {
  schemas: {
    submitReport,
    batchReports,
    submitFeedback,
    updateReportStatus,
    searchReports,
    exportReports,
    bulkUpdateReports,
    // Query validations
    getReportsQuery,
    getBrowserReportsQuery,
    getStatsQuery
  },
  patterns: commonPatterns,
  flaggedTermSchema
};