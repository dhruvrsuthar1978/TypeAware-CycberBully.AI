const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

class LoggingService {
  constructor() {
    this.logDirectory = process.env.LOG_DIRECTORY || './logs';
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
      console.log(`📝 Created log directory: ${this.logDirectory}`);
    }
  }

  // Setup log streams
  setupLogStreams() {
    const logDate = new Date().toISOString().split('T')[0];
    
    this.accessLogStream = fs.createWriteStream(
      path.join(this.logDirectory, `access-${logDate}.log`),
      { flags: 'a' }
    );

    this.errorLogStream = fs.createWriteStream(
      path.join(this.logDirectory, `error-${logDate}.log`),
      { flags: 'a' }
    );

    this.auditLogStream = fs.createWriteStream(
      path.join(this.logDirectory, `audit-${logDate}.log`),
      { flags: 'a' }
    );
  }

  // Custom Morgan token for user information
  setupMorganTokens() {
    morgan.token('user-id', (req) => req.user ? req.user.id || req.user._id : 'anonymous');
    morgan.token('user-role', (req) => req.user ? req.user.role : 'anonymous');
    morgan.token('request-id', (req) => req.requestId || 'no-id');
    morgan.token('real-ip', (req) => req.ip || req.connection.remoteAddress || 'unknown');

    // --- CORRECTED & IMPROVED ---
    // Renamed to 'response-time-ms' for accuracy and made more robust.
    morgan.token('response-time-ms', (req, res) => {
      if (!req._startTime || !Array.isArray(req._startTime)) {
        return '0.000';
      }
      const diff = process.hrtime(req._startTime);
      const ms = (diff[0] * 1e3) + (diff[1] * 1e-6);
      return ms.toFixed(3);
    });
  }

  // Request ID middleware - THIS IS WHERE THE TIMER IS STARTED
  requestIdMiddleware() {
    return (req, res, next) => {
      req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.requestId);
      req._startTime = process.hrtime();
      next();
    };
  }

  // Basic access logging
  accessLogger() {
    this.setupMorganTokens();
    const format = ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :request-id';
    return morgan(format, {
      stream: this.accessLogStream,
      skip: (req) => req.url.includes('/health')
    });
  }
  
  // --- RE-ADDED MISSING METHODS ---

  // Sanitize request body for logging (remove sensitive data)
  sanitizeRequestBody(body) {
    if (!body) return undefined;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'authorization'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  // Request sanitization middleware
  sanitizeRequestMiddleware() {
    return (req, res, next) => {
      req.sanitizedBody = this.sanitizeRequestBody(req.body);
      next();
    };
  }
  
  // Audit logging for sensitive operations
  auditLogger() {
    return (req, res, next) => {
      // This is a placeholder for your audit logic.
      // You can expand this to log specific actions.
      next();
    };
  }
  
  // Security logging for authentication events
  securityLogger() {
    return (req, res, next) => {
      // This is a placeholder for your security event logic.
      next();
    };
  }

  // Performance logging
  performanceLogger() {
    return (req, res, next) => {
      // This is a placeholder for your performance logging logic.
      next();
    };
  }

  // Rate limit logging
  rateLimitLogger() {
      return (req, res, next) => {
          // This is a placeholder for your rate limit logging logic.
          next();
      };
  }

  healthCheck() {
      return { status: 'healthy' };
  }

  // Error logging middleware
  errorLogger() {
    return (error, req, res, next) => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous',
        error: {
          name: error.name,
          message: error.message,
          statusCode: res.statusCode,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
      };

      this.errorLogStream.write(JSON.stringify(errorLog) + '\n');
      console.error('🚨 Error logged:', error.message);
      next(error);
    };
  }

  // Initialize all logging components
  initialize() {
    console.log('📝 Initializing logging system...');
    this.ensureLogDirectory();
    this.setupLogStreams();
    console.log('✅ Logging system initialized successfully');
    console.log(`📁 Log directory: ${this.logDirectory}`);
  }

  // Graceful shutdown
  shutdown() {
    console.log('📝 Shutting down logging system...');
    this.accessLogStream?.end();
    this.errorLogStream?.end();
    this.auditLogStream?.end();
    console.log('✅ Logging system shutdown complete');
  }
}

// Export a single instance of the service
module.exports = new LoggingService();

