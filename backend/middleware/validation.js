const Joi = require('joi');   

// Common validation schemas
const schemas = {
  // User registration validation
  registerUser: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      })
  }),

  // User login validation
  loginUser: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Report submission validation
  submitReport: Joi.object({
    browserUUID: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Browser UUID must be a valid UUID',
        'any.required': 'Browser UUID is required'
      }),
    content: Joi.object({
      original: Joi.string()
        .min(1)
        .max(10000)
        .required()
        .messages({
          'string.min': 'Content cannot be empty',
          'string.max': 'Content cannot exceed 10000 characters',
          'any.required': 'Original content is required'
        }),
      flaggedTerms: Joi.array().items(
        Joi.object({
          term: Joi.string().required(),
          positions: Joi.array().items(Joi.number().integer().min(0)),
          severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
        })
      ).default([]),
      severity: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .default('medium')
    }).required(),
    context: Joi.object({
      platform: Joi.string()
        .valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other')
        .required()
        .messages({
          'any.only': 'Platform must be one of: twitter, youtube, reddit, facebook, instagram, tiktok, linkedin, other',
          'any.required': 'Platform is required'
        }),
      url: Joi.string().uri().optional(),
      pageTitle: Joi.string().max(500).optional(),
      elementType: Joi.string()
        .valid('comment', 'post', 'reply', 'message', 'bio', 'other')
        .default('other')
    }).required(),
    classification: Joi.object({
      category: Joi.string()
        .valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other')
        .required()
        .messages({
          'any.only': 'Category must be one of the predefined abuse types',
          'any.required': 'Classification category is required'
        }),
      confidence: Joi.number()
        .min(0)
        .max(1)
        .default(0.8),
      detectionMethod: Joi.string()
        .valid('regex', 'nlp', 'fuzzy_match', 'user_report', 'ml_model')
        .default('user_report')
    }).required(),
    metadata: Joi.object({
      userAgent: Joi.string().optional(),
      sessionId: Joi.string().optional()
    }).optional()
  }),

  // Batch reports validation
  batchReports: Joi.object({
    browserUUID: Joi.string()
      .uuid()
      .required(),
    reports: Joi.array()
      .items(Joi.object({
        content: Joi.object({
          original: Joi.string().min(1).max(10000).required(),
          flaggedTerms: Joi.array().items(
            Joi.object({
              term: Joi.string().required(),
              positions: Joi.array().items(Joi.number().integer().min(0)),
              severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
            })
          ).default([]),
          severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
        }).required(),
        context: Joi.object({
          platform: Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other').required(),
          url: Joi.string().uri().optional(),
          pageTitle: Joi.string().max(500).optional(),
          elementType: Joi.string().valid('comment', 'post', 'reply', 'message', 'bio', 'other').default('other')
        }).required(),
        classification: Joi.object({
          category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').required(),
          confidence: Joi.number().min(0).max(1).default(0.8),
          detectionMethod: Joi.string().valid('regex', 'nlp', 'fuzzy_match', 'user_report', 'ml_model').default('user_report')
        }).required()
      }))
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least one report is required',
        'array.max': 'Maximum 10 reports allowed per batch'
      })
  }),

  // User preferences validation
  updatePreferences: Joi.object({
    darkMode: Joi.boolean().optional(),
    notifications: Joi.boolean().optional(),
    emailUpdates: Joi.boolean().optional(),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh').optional()
  }),

  // User profile validation
  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    preferences: Joi.object({
      darkMode: Joi.boolean().optional(),
      notifications: Joi.boolean().optional(),
      emailUpdates: Joi.boolean().optional(),
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh').optional()
    }).optional()
  }),

  // Change password validation
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'any.required': 'New password is required'
      })
  }),

  // Admin review validation
  reviewReport: Joi.object({
    decision: Joi.string()
      .valid('confirmed', 'false_positive', 'dismissed')
      .required()
      .messages({
        'any.only': 'Decision must be confirmed, false_positive, or dismissed',
        'any.required': 'Decision is required'
      }),
    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes cannot exceed 1000 characters'
      })
  }),

  // User status update validation
  updateUserStatus: Joi.object({
    isActive: Joi.boolean()
      .required()
      .messages({
        'any.required': 'isActive status is required'
      })
  }),

  // Feedback validation
  submitFeedback: Joi.object({
    isHelpful: Joi.boolean()
      .required()
      .messages({
        'any.required': 'isHelpful is required'
      }),
    comment: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Comment cannot exceed 500 characters'
      }),
    browserUUID: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Browser UUID must be a valid UUID',
        'any.required': 'Browser UUID is required'
      })
  }),

  // Link browser validation
  linkBrowser: Joi.object({
    browserUUID: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Browser UUID must be a valid UUID',
        'any.required': 'Browser UUID is required'
      }),
    userAgent: Joi.string().optional()
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        error: 'Internal Error',
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Get all errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types when possible
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Query parameter validation
const validateQuery = (querySchema) => {
  return (req, res, next) => {
    const { error, value } = querySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        error: 'Query Validation Error',
        message: 'Invalid query parameters',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

// Common query schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  dateRange: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30)
  }),

  reportFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().valid('harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other').optional(),
    platform: Joi.string().valid('twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other').optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    status: Joi.string().valid('pending', 'under_review', 'confirmed', 'false_positive', 'dismissed').optional()
  })
};

module.exports = {
  validate,
  validateQuery,
  schemas,
  querySchemas
};