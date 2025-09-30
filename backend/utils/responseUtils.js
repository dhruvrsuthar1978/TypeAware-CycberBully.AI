/**
 * Create standardized success response
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {object} meta - Additional metadata
 * @returns {object} Formatted response object
 */
const createResponse = (message, data = null, meta = {}) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

/**
 * Create standardized error response
 * @param {string} error - Error type/title
 * @param {string} message - Error message
 * @param {object} details - Additional error details
 * @param {number} code - Internal error code
 * @returns {object} Formatted error response object
 */
const createErrorResponse = (error, message, details = null, code = null) => {
  const response = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };

  if (details !== null) {
    response.details = details;
  }

  if (code !== null) {
    response.code = code;
  }

  return response;
};

/**
 * Create paginated response
 * @param {Array} data - Array of data items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {object} Formatted paginated response
 */
const createPaginatedResponse = (data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return createResponse(message, data, {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    }
  });
};

/**
 * Create validation error response
 * @param {Array} errors - Array of validation errors
 * @returns {object} Formatted validation error response
 */
const createValidationErrorResponse = (errors) => {
  return createErrorResponse(
    'Validation Error',
    'The provided data is invalid',
    {
      validationErrors: errors.map(error => ({
        field: error.field || error.path,
        message: error.message,
        value: error.value || error.context?.value,
        code: error.code || error.type
      }))
    }
  );
};

/**
 * Create authentication error response
 * @param {string} message - Authentication error message
 * @param {string} type - Type of authentication error
 * @returns {object} Formatted authentication error response
 */
const createAuthErrorResponse = (message = 'Authentication required', type = 'UNAUTHORIZED') => {
  return createErrorResponse(
    'Authentication Error',
    message,
    { type }
  );
};

/**
 * Create authorization error response
 * @param {string} message - Authorization error message
 * @param {string} requiredRole - Required role for access
 * @returns {object} Formatted authorization error response
 */
const createAuthorizationErrorResponse = (message = 'Insufficient permissions', requiredRole = null) => {
  const details = { type: 'FORBIDDEN' };
  if (requiredRole) {
    details.requiredRole = requiredRole;
  }

  return createErrorResponse(
    'Authorization Error',
    message,
    details
  );
};

/**
 * Create rate limit error response
 * @param {string} message - Rate limit message
 * @param {number} retryAfter - Seconds until retry is allowed
 * @returns {object} Formatted rate limit error response
 */
const createRateLimitErrorResponse = (message = 'Rate limit exceeded', retryAfter = 60) => {
  return createErrorResponse(
    'Rate Limit Exceeded',
    message,
    {
      type: 'RATE_LIMIT',
      retryAfter,
      retryAfterDate: new Date(Date.now() + (retryAfter * 1000)).toISOString()
    }
  );
};

/**
 * Create not found error response
 * @param {string} resource - Resource that was not found
 * @param {string} identifier - Resource identifier
 * @returns {object} Formatted not found error response
 */
const createNotFoundErrorResponse = (resource = 'Resource', identifier = null) => {
  let message = `${resource} not found`;
  if (identifier) {
    message += ` with identifier: ${identifier}`;
  }

  return createErrorResponse(
    'Not Found',
    message,
    {
      type: 'NOT_FOUND',
      resource,
      identifier
    }
  );
};

/**
 * Create conflict error response
 * @param {string} message - Conflict message
 * @param {string} field - Conflicting field
 * @param {string} value - Conflicting value
 * @returns {object} Formatted conflict error response
 */
const createConflictErrorResponse = (message, field = null, value = null) => {
  const details = { type: 'CONFLICT' };
  if (field) details.field = field;
  if (value) details.value = value;

  return createErrorResponse(
    'Conflict',
    message,
    details
  );
};

/**
 * Create server error response
 * @param {string} message - Error message
 * @param {string} errorId - Unique error ID for tracking
 * @returns {object} Formatted server error response
 */
const createServerErrorResponse = (message = 'Internal server error', errorId = null) => {
  const details = { type: 'SERVER_ERROR' };
  if (errorId) details.errorId = errorId;

  return createErrorResponse(
    'Internal Server Error',
    message,
    details
  );
};

/**
 * Create analytics response with summary
 * @param {object} data - Analytics data
 * @param {object} summary - Analytics summary
 * @param {object} dateRange - Date range for analytics
 * @param {string} message - Success message
 * @returns {object} Formatted analytics response
 */
const createAnalyticsResponse = (data, summary = {}, dateRange = {}, message = 'Analytics data retrieved successfully') => {
  return createResponse(message, data, {
    summary,
    dateRange,
    generatedAt: new Date().toISOString()
  });
};

/**
 * Create health check response
 * @param {string} status - Health status ('healthy', 'degraded', 'unhealthy')
 * @param {object} checks - Individual health checks
 * @param {object} system - System information
 * @returns {object} Formatted health check response
 */
const createHealthCheckResponse = (status, checks = {}, system = {}) => {
  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      ...system
    }
  };
};

/**
 * Format error for logging
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 * @returns {object} Formatted error for logging
 */
const formatErrorForLogging = (error, context = {}) => {
  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context
  };
};

/**
 * Create batch operation response
 * @param {Array} successful - Successfully processed items
 * @param {Array} failed - Failed items with errors
 * @param {string} message - Operation message
 * @returns {object} Formatted batch response
 */
const createBatchResponse = (successful = [], failed = [], message = 'Batch operation completed') => {
  const total = successful.length + failed.length;
  const successRate = total > 0 ? ((successful.length / total) * 100).toFixed(2) : 0;

  return createResponse(message, {
    successful,
    failed,
    summary: {
      total,
      successful: successful.length,
      failed: failed.length,
      successRate: parseFloat(successRate)
    }
  });
};

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Send JSON response with proper status code
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {object} data - Response data
 */
const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json(data);
};

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  sendResponse(res, statusCode, createResponse(message, data));
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {object} details - Additional error details
 */
const sendError = (res, error, message, statusCode = 400, details = null) => {
  sendResponse(res, statusCode, createErrorResponse(error, message, details));
};

module.exports = {
  createResponse,
  createErrorResponse,
  createPaginatedResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createAuthorizationErrorResponse,
  createRateLimitErrorResponse,
  createNotFoundErrorResponse,
  createConflictErrorResponse,
  createServerErrorResponse,
  createAnalyticsResponse,
  createHealthCheckResponse,
  createBatchResponse,
  formatErrorForLogging,
  asyncHandler,
  sendResponse,
  sendSuccess,
  sendError
};
