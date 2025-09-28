const Joi = require('joi');

// Common validation patterns
const commonPatterns = {
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(254)
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.max': 'Email address cannot exceed 254 characters',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required'
    }),

  strongPassword: Joi.string()
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

  browserUUID: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.uuid': 'Browser UUID must be a valid UUID v4',
      'any.required': 'Browser UUID is required'
    }),

  refreshToken: Joi.string()
    .min(50)
    .max(500)
    .required()
    .messages({
      'string.min': 'Invalid refresh token format',
      'string.max': 'Invalid refresh token format',
      'any.required': 'Refresh token is required'
    })
};

// User registration validation
const registerUser = Joi.object({
  email: commonPatterns.email,
  password: commonPatterns.password,
  username: commonPatterns.username,
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'Terms acceptance is required'
    }),
  marketingConsent: Joi.boolean()
    .optional()
    .default(false)
}).options({
  stripUnknown: true,
  abortEarly: false
});

// User login validation
const loginUser = Joi.object({
  email: commonPatterns.email,
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password cannot be empty',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  rememberMe: Joi.boolean()
    .optional()
    .default(false),
  captcha: Joi.string()
    .optional() // For future CAPTCHA implementation
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Password change validation
const changePassword = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.min': 'Current password cannot be empty',
      'string.max': 'Current password cannot exceed 128 characters',
      'any.required': 'Current password is required'
    }),
  newPassword: commonPatterns.password
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'any.invalid': 'New password must be different from current password'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Forgot password validation
const forgotPassword = Joi.object({
  email: commonPatterns.email,
  captcha: Joi.string().optional()
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Reset password validation
const resetPassword = Joi.object({
  resetToken: Joi.string()
    .min(32)
    .max(128)
    .required()
    .messages({
      'string.min': 'Invalid reset token',
      'string.max': 'Invalid reset token',
      'any.required': 'Reset token is required'
    }),
  newPassword: commonPatterns.password,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Refresh token validation
const refreshToken = Joi.object({
  refreshToken: commonPatterns.refreshToken
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Link browser UUID validation
const linkBrowser = Joi.object({
  browserUUID: commonPatterns.browserUUID,
  userAgent: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'User agent string too long'
    }),
  deviceName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Device name cannot exceed 100 characters'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Google OAuth validation
const googleOAuth = Joi.object({
  token: Joi.string()
    .min(100)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Invalid Google token',
      'string.max': 'Invalid Google token',
      'any.required': 'Google token is required'
    }),
  linkToExisting: Joi.boolean()
    .optional()
    .default(false)
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Two-factor authentication setup
const setupTwoFactor = Joi.object({
  secret: Joi.string()
    .length(32)
    .required()
    .messages({
      'string.length': 'Invalid 2FA secret format',
      'any.required': '2FA secret is required'
    }),
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': '2FA code must be 6 digits',
      'any.required': '2FA code is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Two-factor authentication verification
const verifyTwoFactor = Joi.object({
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': '2FA code must be 6 digits',
      'any.required': '2FA code is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Email verification
const verifyEmail = Joi.object({
  token: Joi.string()
    .min(32)
    .max(128)
    .required()
    .messages({
      'string.min': 'Invalid verification token',
      'string.max': 'Invalid verification token',
      'any.required': 'Verification token is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Resend email verification
const resendEmailVerification = Joi.object({
  email: commonPatterns.email
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Update email validation
const updateEmail = Joi.object({
  newEmail: commonPatterns.email,
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password cannot be empty',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required to change email'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Account deletion validation
const deleteAccount = Joi.object({
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password cannot be empty',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required to delete account'
    }),
  confirmation: Joi.string()
    .valid('DELETE_ACCOUNT')
    .required()
    .messages({
      'any.only': 'Please type "DELETE_ACCOUNT" to confirm',
      'any.required': 'Confirmation is required'
    }),
  reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Session management validation
const terminateSession = Joi.object({
  sessionId: Joi.string()
    .min(10)
    .max(100)
    .required()
    .messages({
      'string.min': 'Invalid session ID',
      'string.max': 'Invalid session ID',
      'any.required': 'Session ID is required'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// API key generation validation
const generateApiKey = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'API key name cannot be empty',
      'string.max': 'API key name cannot exceed 100 characters',
      'any.required': 'API key name is required'
    }),
  scopes: Joi.array()
    .items(Joi.string().valid('read', 'write', 'admin'))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one scope is required',
      'any.required': 'Scopes are required'
    }),
  expiresIn: Joi.string()
    .valid('30d', '90d', '1y', 'never')
    .default('90d')
    .messages({
      'any.only': 'Expiration must be 30d, 90d, 1y, or never'
    })
}).options({
  stripUnknown: true,
  abortEarly: false
});

// Custom validation functions
const customValidations = {
  // Check if password is commonly used
  isCommonPassword: (password) => {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', '123456789', 'password1', 'abc123'
    ];
    return !commonPasswords.includes(password.toLowerCase());
  },

  // Check if email domain is allowed
  isAllowedEmailDomain: (email) => {
    const blockedDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    return !blockedDomains.includes(domain);
  },

  // Check if username is appropriate
  isAppropriateUsername: (username) => {
    const inappropriateWords = ['admin', 'root', 'user', 'test', 'api'];
    return !inappropriateWords.includes(username.toLowerCase());
  }
};

// Enhanced validation with custom rules
const enhancedRegisterUser = registerUser.custom((value, helpers) => {
  // Additional password validation
  if (!customValidations.isCommonPassword(value.password)) {
    return helpers.error('password.common', { 
      message: 'Password is too common, please choose a stronger password' 
    });
  }

  // Email domain validation
  if (!customValidations.isAllowedEmailDomain(value.email)) {
    return helpers.error('email.domain', { 
      message: 'Email domain is not allowed' 
    });
  }

  // Username appropriateness validation
  if (!customValidations.isAppropriateUsername(value.username)) {
    return helpers.error('username.inappropriate', { 
      message: 'Username is not allowed' 
    });
  }

  return value;
});

// Validation middleware factory
const createValidator = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        code: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'The provided data is invalid',
        details: {
          validationErrors: errors
        },
        timestamp: new Date().toISOString()
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  schemas: {
    registerUser,
    enhancedRegisterUser,
    loginUser,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    linkBrowser,
    googleOAuth,
    setupTwoFactor,
    verifyTwoFactor,
    verifyEmail,
    resendEmailVerification,
    updateEmail,
    deleteAccount,
    terminateSession,
    generateApiKey
  },
  patterns: commonPatterns,
  customValidations,
  createValidator
};