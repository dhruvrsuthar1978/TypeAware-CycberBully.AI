// middleware/logging.js
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

class LoggingService {
  constructor() {
    this.logDirectory = process.env.LOG_DIRECTORY || './logs';
    this.ensureLogDirectory();
    this.setupLogStreams();
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
    // User ID token
    morgan.token('user-id', (req) => {
      return req.user ? req.user.id || req.user._id : 'anonymous';
    });

    // User role token
    morgan.token('user-role', (req) => {
      return req.user ? req.user.role : 'anonymous';
    });

    // Request ID token
    morgan.token('request-id', (req) => {
      return req.requestId || 'no-id';
    });

    // Response time in microseconds
    morgan.token('response-time-microseconds', (req, res) => {
      if (!req._startTime) return '0';
      const diff = process.hrtime(req._startTime);
      return Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
    });

    // Request size
    morgan.token('req-size', (req) => {
      return req.get('content-length') || '0';
    });

    // Response size
    morgan.token('res-size', (req, res) => {
      return res.get('content-length') || '0';
    });

    // IP address (considering proxies)
    morgan.token('real-ip', (req) => {
      return req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
             'unknown';
    });

    // User agent
    morgan.token('user-agent', (req) => {
      return req.get('User-Agent') || 'unknown';
    });
  }

  // Request ID middleware
  requestIdMiddleware() {
    return (req, res, next) => {
      req.requestId = this.generateRequestId();
      res.setHeader('X-Request-ID', req.requestId);
      req._startTime = process.hrtime();
      next();
    };
  }

  // Generate unique request ID
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Basic access logging
  accessLogger() {
    this.setupMorganTokens();

    const format = ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-microseconds μs :request-id';

    return morgan(format, {
      stream: this.accessLogStream,
      skip: (req, res) => {
        // Skip health checks and static assets
        return req.url.includes('/health') || 
               req.url.includes('/favicon.ico') ||
               req.url.includes('/static/');
      }
    });
  }

  // Detailed access logging for development
  developmentLogger() {
    this.setupMorganTokens();

    const format = ':method :url :status :response-time ms - :res[content-length] - :user-id (:user-role) - :request-id';

    return morgan(format, {
      skip: (req, res) => {
        return req.url.includes('/health');
      }
    });
  }

  // Error logging middleware
  errorLogger() {
    return (error, req, res, next) => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user.id : 'anonymous',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode || 500
        },
        body: req.method !== 'GET' ? this.sanitizeRequestBody(req.body) : undefined,
        query: req.query,
        params: req.params
      };

      // Write to error log
      this.errorLogStream.write(JSON.stringify(errorLog) + '\n');

      // Console log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Error logged:', errorLog);
      }

      next(error);
    };
  }

  // Audit logging for sensitive operations
  auditLogger() {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(body) {
        // Log audit trail for specific operations
        if (req.auditLog || req.method !== 'GET') {
          const auditLog = {
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            action: req.auditAction || `${req.method} ${req.route?.path || req.url}`,
            userId: req.user ? req.user.id : 'anonymous',
            userRole: req.user ? req.user.role : 'anonymous',
            ip: req.ip,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            requestBody: req.method !== 'GET' ? req.sanitizedBody : undefined,
            responseTime: req._startTime ? process.hrtime(req._startTime)[1] / 1e6 : 0,
            success: res.statusCode < 400
          };

          // Write to audit log
          req.auditLogStream?.write(JSON.stringify(auditLog) + '\n');
        }

        return originalSend.call(this, body);
      };

      req.auditLogStream = this.auditLogStream;
      next();
    };
  }

  // Security logging for authentication events
  securityLogger() {
    return (req, res, next) => {
      // Log security-related events
      const securityEvents = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout',
        '/api/auth/reset-password',
        '/api/admin'
      ];

      const isSecurityEvent = securityEvents.some(event => req.url.includes(event));

      if (isSecurityEvent) {
        const originalSend = res.send;
        
        res.send = function(body) {
          const securityLog = {
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            event: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user.id : 'anonymous',
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            method: req.method,
            attemptedCredentials: req.body?.email ? { email: req.body.email } : undefined
          };

          // Write to security log
          const securityLogPath = path.join(req.logDirectory || './logs', 
            `security-${new Date().toISOString().split('T')[0]}.log`);
          
          fs.appendFile(securityLogPath, JSON.stringify(securityLog) + '\n', (err) => {
            if (err) console.error('Security log write error:', err);
          });

          return originalSend.call(this, body);
        };
      }

      next();
    };
  }

  // Performance logging
  performanceLogger() {
    return (req, res, next) => {
      const start = process.hrtime();
      
      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds

        // Log slow requests (over 1 second)
        if (duration > 1000) {
          const performanceLog = {
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            duration: `${duration.toFixed(2)}ms`,
            statusCode: res.statusCode,
            userId: req.user ? req.user.id : 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            memoryUsage: process.memoryUsage()
          };

          const performanceLogPath = path.join(this.logDirectory, 
            `performance-${new Date().toISOString().split('T')[0]}.log`);
          
          fs.appendFile(performanceLogPath, JSON.stringify(performanceLog) + '\n', (err) => {
            if (err) console.error('Performance log write error:', err);
          });

          console.warn(`🐌 Slow request detected: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
        }
      });

      next();
    };
  }

  // Rate limit logging
  rateLimitLogger() {
    return (req, res, next) => {
      res.on('finish', () => {
        if (res.statusCode === 429) { // Too Many Requests
          const rateLimitLog = {
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            ip: req.ip,
            method: req.method,
            url: req.url,
            userId: req.user ? req.user.id : 'anonymous',
            userAgent: req.get('User-Agent'),
            rateLimitHeader: res.get('X-RateLimit-Limit'),
            remainingRequests: res.get('X-RateLimit-Remaining')
          };

          const rateLimitLogPath = path.join(this.logDirectory, 
            `rate-limit-${new Date().toISOString().split('T')[0]}.log`);
          
          fs.appendFile(rateLimitLogPath, JSON.stringify(rateLimitLog) + '\n', (err) => {
            if (err) console.error('Rate limit log write error:', err);
          });
        }
      });

      next();
    };
  }

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

    // Also check nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
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

  // Log rotation (daily)
  setupLogRotation() {
    const rotateInterval = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(() => {
      console.log('📝 Rotating log files...');
      
      // Close current streams
      this.accessLogStream.end();
      this.errorLogStream.end();
      this.auditLogStream.end();

      // Create new streams with new date
      this.setupLogStreams();
      
      // Clean up old logs (keep only last 30 days)
      this.cleanupOldLogs(30);
    }, rotateInterval);
  }

  // Clean up old log files
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            console.log(`📝 Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        logTypes: {},
        oldestLog: null,
        newestLog: null
      };

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const fileStats = fs.statSync(filePath);
          
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
          
          const logType = file.split('-')[0];
          stats.logTypes[logType] = (stats.logTypes[logType] || 0) + 1;
          
          if (!stats.oldestLog || fileStats.mtime < stats.oldestLog.mtime) {
            stats.oldestLog = { name: file, mtime: fileStats.mtime };
          }
          
          if (!stats.newestLog || fileStats.mtime > stats.newestLog.mtime) {
            stats.newestLog = { name: file, mtime: fileStats.mtime };
          }
        }
      }

      // Convert size to human readable
      stats.totalSizeFormatted = this.formatFileSize(stats.totalSize);
      
      return stats;
    } catch (error) {
      console.error('Error getting log stats:', error);
      return null;
    }
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Search logs by criteria
  async searchLogs(criteria = {}) {
    const {
      logType = 'access',
      startDate,
      endDate,
      userId,
      ip,
      statusCode,
      method,
      url,
      limit = 100
    } = criteria;

    try {
      const logDate = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDirectory, `${logType}-${logDate}.log`);
      
      if (!fs.existsSync(logFile)) {
        return { results: [], total: 0 };
      }

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      let results = [];
      
      for (const line of lines) {
        try {
          let logEntry;
          
          // Try to parse as JSON first (for structured logs)
          try {
            logEntry = JSON.parse(line);
          } catch {
            // If not JSON, treat as access log format
            logEntry = this.parseAccessLogLine(line);
          }
          
          if (this.matchesCriteria(logEntry, criteria)) {
            results.push(logEntry);
          }
          
          if (results.length >= limit) break;
        } catch (error) {
          // Skip malformed lines
          continue;
        }
      }
      
      return {
        results,
        total: results.length,
        searchCriteria: criteria
      };
    } catch (error) {
      console.error('Error searching logs:', error);
      throw error;
    }
  }

  // Parse access log line into structured data
  parseAccessLogLine(line) {
    // Basic parsing for common log format
    const parts = line.split(' ');
    return {
      ip: parts[0],
      timestamp: parts[3]?.replace('[', ''),
      method: parts[5]?.replace('"', ''),
      url: parts[6],
      statusCode: parseInt(parts[8]) || 0,
      size: parseInt(parts[9]) || 0,
      userAgent: line.split('"')[5] || ''
    };
  }

  // Check if log entry matches search criteria
  matchesCriteria(logEntry, criteria) {
    if (criteria.userId && logEntry.userId !== criteria.userId) return false;
    if (criteria.ip && logEntry.ip !== criteria.ip) return false;
    if (criteria.statusCode && logEntry.statusCode !== criteria.statusCode) return false;
    if (criteria.method && logEntry.method !== criteria.method) return false;
    if (criteria.url && !logEntry.url?.includes(criteria.url)) return false;
    
    if (criteria.startDate) {
      const entryDate = new Date(logEntry.timestamp);
      if (entryDate < new Date(criteria.startDate)) return false;
    }
    
    if (criteria.endDate) {
      const entryDate = new Date(logEntry.timestamp);
      if (entryDate > new Date(criteria.endDate)) return false;
    }
    
    return true;
  }

  // Export logs as ZIP file
  async exportLogs(dateRange = {}) {
    const archiver = require('archiver');
    const { startDate, endDate } = dateRange;
    
    try {
      const files = fs.readdirSync(this.logDirectory);
      const logsToExport = [];
      
      for (const file of files) {
        if (!file.endsWith('.log')) continue;
        
        const filePath = path.join(this.logDirectory, file);
        const stats = fs.statSync(filePath);
        
        // Filter by date range if specified
        if (startDate && stats.mtime < new Date(startDate)) continue;
        if (endDate && stats.mtime > new Date(endDate)) continue;
        
        logsToExport.push(filePath);
      }
      
      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      for (const logFile of logsToExport) {
        archive.file(logFile, { name: path.basename(logFile) });
      }
      
      await archive.finalize();
      
      return {
        success: true,
        filesCount: logsToExport.length,
        archive
      };
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }

  // Real-time log monitoring (WebSocket support)
  createLogMonitor() {
    const EventEmitter = require('events');
    const monitor = new EventEmitter();
    
    // Watch for new log entries
    const logFile = path.join(this.logDirectory, `access-${new Date().toISOString().split('T')[0]}.log`);
    
    if (fs.existsSync(logFile)) {
      const watcher = fs.watchFile(logFile, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          // File was modified, read new content
          fs.readFile(logFile, 'utf8', (err, data) => {
            if (err) return;
            
            const lines = data.split('\n');
            const newLine = lines[lines.length - 2]; // Last line is usually empty
            
            if (newLine) {
              try {
                const logEntry = JSON.parse(newLine);
                monitor.emit('newLogEntry', logEntry);
              } catch {
                // If not JSON, emit as plain text
                monitor.emit('newLogEntry', { message: newLine });
              }
            }
          });
        }
      });
      
      monitor.stopWatching = () => {
        fs.unwatchFile(logFile);
      };
    }
    
    return monitor;
  }

  // Health check for logging system
  healthCheck() {
    const health = {
      status: 'healthy',
      checks: {
        logDirectory: false,
        logStreams: false,
        diskSpace: false
      },
      stats: null,
      issues: []
    };

    try {
      // Check log directory
      if (fs.existsSync(this.logDirectory)) {
        health.checks.logDirectory = true;
      } else {
        health.issues.push('Log directory does not exist');
      }

      // Check log streams
      if (this.accessLogStream && this.errorLogStream && this.auditLogStream) {
        health.checks.logStreams = true;
      } else {
        health.issues.push('One or more log streams are not initialized');
      }

      // Check disk space (basic check)
      const stats = fs.statSync(this.logDirectory);
      if (stats.isDirectory()) {
        health.checks.diskSpace = true;
      }

      // Get log statistics
      health.stats = this.getLogStats();

      // Determine overall status
      const allChecks = Object.values(health.checks);
      if (allChecks.every(check => check === true)) {
        health.status = 'healthy';
      } else if (allChecks.some(check => check === true)) {
        health.status = 'degraded';
      } else {
        health.status = 'unhealthy';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.issues.push(`Health check error: ${error.message}`);
    }

    return health;
  }

  // Initialize logging system
  initialize() {
    console.log('📝 Initializing logging system...');
    
    this.ensureLogDirectory();
    this.setupLogStreams();
    this.setupLogRotation();
    
    console.log('✅ Logging system initialized successfully');
    console.log(`📁 Log directory: ${this.logDirectory}`);
  }

  // Graceful shutdown
  shutdown() {
    console.log('📝 Shutting down logging system...');
    
    if (this.accessLogStream) {
      this.accessLogStream.end();
    }
    
    if (this.errorLogStream) {
      this.errorLogStream.end();
    }
    
    if (this.auditLogStream) {
      this.auditLogStream.end();
    }
    
    console.log('✅ Logging system shutdown complete');
  }
}

module.exports = new LoggingService();