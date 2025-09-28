// config/constants.js

// User roles and permissions
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

const USER_PERMISSIONS = {
  [USER_ROLES.USER]: [
    'reports:create',
    'reports:read:own',
    'profile:read:own',
    'profile:update:own',
    'dashboard:access'
  ],
  [USER_ROLES.MODERATOR]: [
    'reports:create',
    'reports:read:all',
    'reports:update',
    'reports:moderate',
    'users:read',
    'analytics:read',
    'dashboard:access'
  ],
  [USER_ROLES.ADMIN]: [
    'reports:create',
    'reports:read:all',
    'reports:update',
    'reports:delete',
    'reports:moderate',
    'users:read',
    'users:update',
    'users:delete',
    'users:block',
    'users:unblock',
    'analytics:read',
    'analytics:export',
    'system:admin',
    'dashboard:access',
    'dashboard:admin'
  ]
};

// Platform identifiers
const SUPPORTED_PLATFORMS = {
  TWITTER: 'twitter',
  YOUTUBE: 'youtube',
  REDDIT: 'reddit',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  DISCORD: 'discord',
  TWITCH: 'twitch',
  OTHER: 'other'
};

// Flag reasons and their severity levels
const FLAG_REASONS = {
  HARASSMENT: {
    code: 'harassment',
    label: 'Harassment',
    severity: 'high',
    description: 'Targeted harassment or bullying'
  },
  HATE_SPEECH: {
    code: 'hate_speech',
    label: 'Hate Speech',
    severity: 'high',
    description: 'Content that promotes hatred against groups'
  },
  SPAM: {
    code: 'spam',
    label: 'Spam',
    severity: 'low',
    description: 'Unwanted or repetitive content'
  },
  VIOLENCE: {
    code: 'violence',
    label: 'Violence',
    severity: 'high',
    description: 'Content promoting or inciting violence'
  },
  MISINFORMATION: {
    code: 'misinformation',
    label: 'Misinformation',
    severity: 'medium',
    description: 'False or misleading information'
  },
  ADULT_CONTENT: {
    code: 'adult_content',
    label: 'Adult Content',
    severity: 'medium',
    description: 'Inappropriate adult or sexual content'
  },
  THREAT: {
    code: 'threat',
    label: 'Threat',
    severity: 'high',
    description: 'Direct or implied threats'
  },
  DOXXING: {
    code: 'doxxing',
    label: 'Doxxing',
    severity: 'high',
    description: 'Sharing personal information without consent'
  },
  IMPERSONATION: {
    code: 'impersonation',
    label: 'Impersonation',
    severity: 'medium',
    description: 'Pretending to be someone else'
  },
  COPYRIGHT: {
    code: 'copyright',
    label: 'Copyright Violation',
    severity: 'medium',
    description: 'Content violating copyright'
  },
  OTHER: {
    code: 'other',
    label: 'Other',
    severity: 'medium',
    description: 'Other policy violations'
  }
};

// Severity levels
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Report statuses
const REPORT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

// User statuses
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  PENDING_VERIFICATION: 'pending_verification'
};

// Analytics time periods
const ANALYTICS_PERIODS = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year'
};

// Rate limiting configurations
const RATE_LIMITS = {
  AUTH: {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
    RESET_PASSWORD: { windowMs: 60 * 60 * 1000, max: 3 }
  },
  API: {
    GENERAL: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    REPORTS: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 reports per 15 minutes
    ANALYTICS: { windowMs: 15 * 60 * 1000, max: 20 } // 20 analytics requests per 15 minutes
  },
  EXTENSION: {
    REPORT_SUBMIT: { windowMs: 60 * 1000, max: 10 }, // 10 reports per minute
    DATA_SYNC: { windowMs: 5 * 60 * 1000, max: 30 } // 30 sync requests per 5 minutes
  }
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error types
const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND_ERROR: 'not_found_error',
  DUPLICATE_ERROR: 'duplicate_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  INTERNAL_ERROR: 'internal_error',
  EXTERNAL_API_ERROR: 'external_api_error',
  DATABASE_ERROR: 'database_error'
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  REPORT_CONFIRMATION: 'report_confirmation',
  ACCOUNT_SUSPENDED: 'account_suspended',
  WEEKLY_SUMMARY: 'weekly_summary'
};

// File upload constraints
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'],
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
};

// Extension-specific constants
const EXTENSION_CONFIG = {
  SUPPORTED_VERSIONS: ['1.0.0', '1.1.0', '1.2.0'],
  MIN_VERSION: '1.0.0',
  UPDATE_CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  HEARTBEAT_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_OFFLINE_REPORTS: 100,
  SYNC_BATCH_SIZE: 50
};

// Detection settings
const DETECTION_CONFIG = {
  MAX_CONTENT_LENGTH: 10000,
  MIN_CONTENT_LENGTH: 5,
  CONFIDENCE_THRESHOLD: 0.7,
  FUZZY_MATCH_THRESHOLD: 0.8,
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it'],
  DEFAULT_LANGUAGE: 'en'
};

// Cache settings
const CACHE_CONFIG = {
  DEFAULT_TTL: 15 * 60, // 15 minutes
  USER_SESSION_TTL: 24 * 60 * 60, // 24 hours
  ANALYTICS_TTL: 30 * 60, // 30 minutes
  REPORTS_TTL: 10 * 60, // 10 minutes
  PLATFORM_STATS_TTL: 60 * 60 // 1 hour
};

// Notification settings
const NOTIFICATION_TYPES = {
  REPORT_SUBMITTED: 'report_submitted',
  REPORT_APPROVED: 'report_approved',
  REPORT_REJECTED: 'report_rejected',
  ACCOUNT_WARNING: 'account_warning',
  ACCOUNT_SUSPENDED: 'account_suspended',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  FEATURE_UPDATE: 'feature_update'
};

// Database collection names
const COLLECTIONS = {
  USERS: 'users',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  AUDIT_LOGS: 'auditlogs',
  SESSIONS: 'sessions',
  BLACKLISTED_TOKENS: 'blacklistedtokens',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'systemsettings'
};

// API versioning
const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  CURRENT: 'v1',
  SUPPORTED: ['v1']
};

// Content analysis patterns (for extension detection)
const DETECTION_PATTERNS = {
  PROFANITY: {
    HIGH_SEVERITY: [
      'extreme_word_1', 'extreme_word_2' // Replace with actual patterns
    ],
    MEDIUM_SEVERITY: [
      'moderate_word_1', 'moderate_word_2'
    ],
    LOW_SEVERITY: [
      'mild_word_1', 'mild_word_2'
    ]
  },
  HARASSMENT_INDICATORS: [
    'kill yourself',
    'you should die',
    'worthless piece of',
    'nobody likes you'
  ],
  SPAM_INDICATORS: [
    'click here now',
    'limited time offer',
    'make money fast',
    'lose weight quick'
  ]
};

// System health thresholds
const SYSTEM_THRESHOLDS = {
  HIGH_REPORT_VOLUME: 1000, // reports per hour
  HIGH_ERROR_RATE: 0.05, // 5% error rate
  LOW_DISK_SPACE: 0.1, // 10% remaining
  HIGH_MEMORY_USAGE: 0.9, // 90% memory usage
  HIGH_CPU_USAGE: 0.85, // 85% CPU usage
  DATABASE_CONNECTION_TIMEOUT: 5000 // 5 seconds
};

// Export configuration
const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XML: 'xml',
  XLSX: 'xlsx'
};

// Audit log actions
const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_SUSPEND: 'user_suspend',
  USER_UNSUSPEND: 'user_unsuspend',
  REPORT_CREATE: 'report_create',
  REPORT_UPDATE: 'report_update',
  REPORT_DELETE: 'report_delete',
  REPORT_MODERATE: 'report_moderate',
  ADMIN_ACTION: 'admin_action',
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
  DATA_EXPORT: 'data_export',
  PASSWORD_RESET: 'password_reset'
};

// Environment types
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Feature flags
const FEATURES = {
  ANALYTICS_EXPORT: process.env.FEATURE_ANALYTICS_EXPORT === 'true',
  EMAIL_NOTIFICATIONS: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
  ADVANCED_DETECTION: process.env.FEATURE_ADVANCED_DETECTION === 'true',
  USER_BLOCKING: process.env.FEATURE_USER_BLOCKING === 'true',
  REAL_TIME_UPDATES: process.env.FEATURE_REAL_TIME_UPDATES === 'true'
};

// Default configuration values
const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  REPORT_CONTENT_MAX_LENGTH: 5000,
  MAX_REPORTS_PER_USER_PER_DAY: 50
};

// Regular expressions for validation
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// API response messages
const MESSAGES = {
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REPORT_CREATED: 'Report submitted successfully',
    REPORT_UPDATED: 'Report updated successfully',
    PASSWORD_RESET: 'Password reset successfully',
    EMAIL_SENT: 'Email sent successfully'
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_ALREADY_EXISTS: 'Email already registered',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INVALID_TOKEN: 'Invalid or expired token',
    ACCOUNT_SUSPENDED: 'Account has been suspended'
  }
};

module.exports = {
  USER_ROLES,
  USER_PERMISSIONS,
  SUPPORTED_PLATFORMS,
  FLAG_REASONS,
  SEVERITY_LEVELS,
  REPORT_STATUS,
  USER_STATUS,
  ANALYTICS_PERIODS,
  RATE_LIMITS,
  HTTP_STATUS,
  ERROR_TYPES,
  EMAIL_TEMPLATES,
  UPLOAD_LIMITS,
  EXTENSION_CONFIG,
  DETECTION_CONFIG,
  CACHE_CONFIG,
  NOTIFICATION_TYPES,
  COLLECTIONS,
  API_VERSIONS,
  DETECTION_PATTERNS,
  SYSTEM_THRESHOLDS,
  EXPORT_FORMATS,
  AUDIT_ACTIONS,
  ENVIRONMENTS,
  FEATURES,
  DEFAULTS,
  REGEX_PATTERNS,
  MESSAGES
};