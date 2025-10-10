// Application Error Codes
export const ErrorCodes = {
  // Authentication Errors (400-403)
  AUTH_INVALID_CREDENTIALS: { code: 401, message: 'Invalid credentials provided' },
  AUTH_TOKEN_EXPIRED: { code: 401, message: 'Authentication token has expired' },
  AUTH_UNAUTHORIZED: { code: 401, message: 'Unauthorized access' },
  AUTH_FORBIDDEN: { code: 403, message: 'Access forbidden' },

  // Resource Errors (404)
  RESOURCE_NOT_FOUND: { code: 404, message: 'Requested resource not found' },
  USER_NOT_FOUND: { code: 404, message: 'User not found' },
  REPORT_NOT_FOUND: { code: 404, message: 'Report not found' },

  // Validation Errors (422)
  VALIDATION_ERROR: { code: 422, message: 'Invalid data provided' },
  INVALID_REQUEST_DATA: { code: 422, message: 'Invalid request data' },

  // Extension Errors (450-459)
  EXTENSION_DOWNLOAD_FAILED: { code: 450, message: 'Failed to download extension' },
  EXTENSION_INSTALL_FAILED: { code: 451, message: 'Failed to install extension' },
  EXTENSION_UPDATE_FAILED: { code: 452, message: 'Failed to update extension' },
  EXTENSION_NOT_FOUND: { code: 453, message: 'Extension not found' },

  // API Errors (500-503)
  API_ERROR: { code: 500, message: 'Internal server error' },
  API_TIMEOUT: { code: 504, message: 'Request timeout' },
  API_UNAVAILABLE: { code: 503, message: 'Service temporarily unavailable' },

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: { code: 429, message: 'Too many requests' },

  // Data Errors (460-469)
  DATA_EXPORT_FAILED: { code: 460, message: 'Failed to export data' },
  DATA_IMPORT_FAILED: { code: 461, message: 'Failed to import data' },
  DATA_SYNC_FAILED: { code: 462, message: 'Failed to sync data' },

  // User Action Errors (470-479)
  USER_ACTION_FAILED: { code: 470, message: 'Failed to complete action' },
  USER_UPDATE_FAILED: { code: 471, message: 'Failed to update user settings' },
  USER_DELETE_FAILED: { code: 472, message: 'Failed to delete user data' },

  // Report Errors (480-489)
  REPORT_CREATE_FAILED: { code: 480, message: 'Failed to create report' },
  REPORT_UPDATE_FAILED: { code: 481, message: 'Failed to update report' },
  REPORT_DELETE_FAILED: { code: 482, message: 'Failed to delete report' },

  // Platform Integration Errors (490-499)
  PLATFORM_CONNECTION_FAILED: { code: 490, message: 'Failed to connect to platform' },
  PLATFORM_AUTH_FAILED: { code: 491, message: 'Platform authentication failed' },
  PLATFORM_ACTION_FAILED: { code: 492, message: 'Platform action failed' }
};

// Error Categories
export const ErrorCategories = {
  AUTH: 'Authentication',
  RESOURCE: 'Resource',
  VALIDATION: 'Validation',
  EXTENSION: 'Extension',
  API: 'API',
  RATE_LIMIT: 'Rate Limit',
  DATA: 'Data',
  USER: 'User',
  REPORT: 'Report',
  PLATFORM: 'Platform'
};

// Error Severity Levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Helper function to get error details
export const getErrorDetails = (code) => {
  return ErrorCodes[code] || {
    code: 500,
    message: 'An unexpected error occurred'
  };
};

// Helper function to determine error severity
export const getErrorSeverity = (code) => {
  if (code >= 500) return ErrorSeverity.CRITICAL;
  if (code >= 400) return ErrorSeverity.HIGH;
  if (code >= 300) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
};