// middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS, HTTP_STATUS } = require('../config/constants');
const { createResponse } = require('../utils/responseUtils');

class RateLimitingService {
  
  // Create rate limiter with custom options
  createRateLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        error: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
          createResponse(false, 'Rate limit exceeded. Please try again later.', null, 'RATE_LIMIT_EXCEEDED')
        );
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      },
      keyGenerator: (req) => {
        // Use IP address and user ID (if authenticated) for more granular rate limiting
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.user?.id || '';
        return `${ip}_${userId}`;
      }
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  // General API rate limiter
  generalApiLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.API.GENERAL.windowMs,
      max: RATE_LIMITS.API.GENERAL.max,
      message: createResponse(
        false, 
        `Too many API requests. Limit: ${RATE_LIMITS.API.GENERAL.max} requests per ${RATE_LIMITS.API.GENERAL.windowMs / 60000} minutes`,
        null,
        'API_RATE_LIMIT_EXCEEDED'
      )
    });
  }

  // Authentication rate limiter (more restrictive)
  authLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.AUTH.LOGIN.windowMs,
      max: RATE_LIMITS.AUTH.LOGIN.max,
      message: createResponse(
        false,
        `Too many authentication attempts. Limit: ${RATE_LIMITS.AUTH.LOGIN.max} attempts per ${RATE_LIMITS.AUTH.LOGIN.windowMs / 60000} minutes`,
        null,
        'AUTH_RATE_LIMIT_EXCEEDED'
      ),
      skipSuccessfulRequests: true, // Don't count successful requests
      keyGenerator: (req) => {
        // Use email for login attempts to prevent account enumeration attacks
        const ip = req.ip || req.connection.remoteAddress;
        const email = req.body?.email || '';
        return `auth_${ip}_${email}`;
      }
    });
  }

  // Registration rate limiter
  registerLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.AUTH.REGISTER.windowMs,
      max: RATE_LIMITS.AUTH.REGISTER.max,
      message: createResponse(
        false,
        `Too many registration attempts. Limit: ${RATE_LIMITS.AUTH.REGISTER.max} attempts per ${RATE_LIMITS.AUTH.REGISTER.windowMs / 60000} minutes`,
        null,
        'REGISTER_RATE_LIMIT_EXCEEDED'
      )
    });
  }

  // Password reset rate limiter
  passwordResetLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.AUTH.RESET_PASSWORD.windowMs,
      max: RATE_LIMITS.AUTH.RESET_PASSWORD.max,
      message: createResponse(
        false,
        `Too many password reset requests. Limit: ${RATE_LIMITS.AUTH.RESET_PASSWORD.max} attempts per ${RATE_LIMITS.AUTH.RESET_PASSWORD.windowMs / 60000} minutes`,
        null,
        'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
      ),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const email = req.body?.email || '';
        return `password_reset_${ip}_${email}`;
      }
    });
  }

  // Reports submission rate limiter
  reportLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.API.REPORTS.windowMs,
      max: RATE_LIMITS.API.REPORTS.max,
      message: createResponse(
        false,
        `Too many report submissions. Limit: ${RATE_LIMITS.API.REPORTS.max} reports per ${RATE_LIMITS.API.REPORTS.windowMs / 60000} minutes`,
        null,
        'REPORT_RATE_LIMIT_EXCEEDED'
      ),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const userId = req.user?.id || req.user?.uuid || '';
        return `reports_${ip}_${userId}`;
      }
    });
  }

  // Analytics rate limiter
  analyticsLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.API.ANALYTICS.windowMs,
      max: RATE_LIMITS.API.ANALYTICS.max,
      message: createResponse(
        false,
        `Too many analytics requests. Limit: ${RATE_LIMITS.API.ANALYTICS.max} requests per ${RATE_LIMITS.API.ANALYTICS.windowMs / 60000} minutes`,
        null,
        'ANALYTICS_RATE_LIMIT_EXCEEDED'
      )
    });
  }

  // Extension-specific rate limiters
  extensionReportLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.EXTENSION.REPORT_SUBMIT.windowMs,
      max: RATE_LIMITS.EXTENSION.REPORT_SUBMIT.max,
      message: createResponse(
        false,
        `Extension report rate limit exceeded. Limit: ${RATE_LIMITS.EXTENSION.REPORT_SUBMIT.max} reports per ${RATE_LIMITS.EXTENSION.REPORT_SUBMIT.windowMs / 1000} seconds`,
        null,
        'EXTENSION_REPORT_RATE_LIMIT_EXCEEDED'
      ),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const extensionId = req.headers['x-extension-id'] || '';
        const userUuid = req.headers['x-user-uuid'] || '';
        return `ext_report_${ip}_${extensionId}_${userUuid}`;
      }
    });
  }

  extensionSyncLimiter() {
    return this.createRateLimiter({
      windowMs: RATE_LIMITS.EXTENSION.DATA_SYNC.windowMs,
      max: RATE_LIMITS.EXTENSION.DATA_SYNC.max,
      message: createResponse(
        false,
        `Extension sync rate limit exceeded. Limit: ${RATE_LIMITS.EXTENSION.DATA_SYNC.max} requests per ${RATE_LIMITS.EXTENSION.DATA_SYNC.windowMs / 60000} minutes`,
        null,
        'EXTENSION_SYNC_RATE_LIMIT_EXCEEDED'
      ),
      keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const extensionId = req.headers['x-extension-id'] || '';
        return `ext_sync_${ip}_${extensionId}`;
      }
    });
  }

  // Admin-specific rate limiter (more lenient)
  adminLimiter() {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Higher limit for admins
      message: createResponse(
        false,
        'Admin rate limit exceeded. Contact system administrator.',
        null,
        'ADMIN_RATE_LIMIT_EXCEEDED'
      ),
      skip: (req) => {
        // Skip for super admin
        return req.user?.role === 'super_admin';
      }
    });
  }

  // Dynamic rate limiter based on user role
  dynamicRoleLimiter() {
    return (req, res, next) => {
      let maxRequests = 100; // default
      let windowMs = 15 * 60 * 1000; // 15 minutes

      if (req.user) {
        switch (req.user.role) {
          case 'admin':
            maxRequests = 200;
            break;
          case 'moderator':
            maxRequests = 150;
            break;
          case 'user':
            maxRequests = 100;
            break;
          default:
            maxRequests = 50;
        }
      } else {
        maxRequests = 50; // Lower limit for unauthenticated users
      }

      const limiter = this.createRateLimiter({
        windowMs,
        max: maxRequests,
        message: createResponse(
          false,
          `Rate limit exceeded for your user role. Limit: ${maxRequests} requests per ${windowMs / 60000} minutes`,
          null,
          'ROLE_BASED_RATE_LIMIT_EXCEEDED'
        )
      });

      return limiter(req, res, next);
    };
  }

  // IP-based suspicious activity limiter
  suspiciousActivityLimiter() {
    return this.createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Very restrictive
      message: createResponse(
        false,
        'Suspicious activity detected. Access temporarily restricted.',
        null,
        'SUSPICIOUS_ACTIVITY_DETECTED'
      ),
      skip: (req) => {
        // This would typically be called based on some suspicious activity detection
        return !req.suspiciousActivity;
      }
    });
  }

  // Custom rate limiter with Redis store (for production)
  createRedisRateLimiter(redisClient, options = {}) {
    if (!redisClient) {
      console.warn('Redis client not provided, falling back to memory store');
      return this.createRateLimiter(options);
    }

    const RedisStore = require('rate-limit-redis');
    
    const defaultOptions = {
      store: new RedisStore({
        client: redisClient,
        prefix: 'typeaware_rl:',
      }),
      windowMs: 15 * 60 * 1000,
      max: 100
    };

    return this.createRateLimiter({ ...defaultOptions, ...options });
  }

  // Rate limiting status middleware
  rateLimitStatus() {
    return (req, res, next) => {
      // Add rate limiting information to response headers
      res.on('finish', () => {
        if (res.getHeader('X-RateLimit-Limit')) {
          console.log(`Rate limit info - IP: ${req.ip}, Limit: ${res.getHeader('X-RateLimit-Limit')}, Remaining: ${res.getHeader('X-RateLimit-Remaining')}`);
        }
      });
      next();
    };
  }

  // Whitelist middleware (bypass rate limiting for specific IPs/users)
  createWhitelistMiddleware(whitelist = []) {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user?.id;

      // Check IP whitelist
      if (whitelist.includes(ip)) {
        req.skipRateLimit = true;
      }

      // Check user whitelist (for admin users, etc.)
      if (req.user && (req.user.role === 'admin' || whitelist.includes(userId))) {
        req.skipRateLimit = true;
      }

      next();
    };
  }

  // Rate limit bypass for health checks and monitoring
  healthCheckBypass() {
    return (req, res, next) => {
      const healthCheckPaths = [
        '/health',
        '/api/health',
        '/status',
        '/ping',
        '/api/status'
      ];

      if (healthCheckPaths.includes(req.path)) {
        req.skipRateLimit = true;
      }

      next();
    };
  }

  // Get rate limiting statistics
  getRateLimitStats(store) {
    return async (req, res, next) => {
      try {
        if (store && store.totalHits) {
          const stats = await store.totalHits();
          req.rateLimitStats = stats;
        }
      } catch (error) {
        console.error('Error getting rate limit stats:', error);
      }
      next();
    };
  }

  // Progressive rate limiting (increases restriction based on violations)
  createProgressiveRateLimiter(baseOptions = {}) {
    const violations = new Map(); // In production, use Redis

    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const violationCount = violations.get(key) || 0;

      // Increase restrictions based on violation history
      let multiplier = 1;
      if (violationCount > 0) {
        multiplier = Math.min(10, Math.pow(2, violationCount)); // Exponential backoff
      }

      const dynamicOptions = {
        ...baseOptions,
        max: Math.max(1, Math.floor((baseOptions.max || 100) / multiplier)),
        windowMs: (baseOptions.windowMs || 15 * 60 * 1000) * multiplier
      };

      const limiter = this.createRateLimiter({
        ...dynamicOptions,
        onLimitReached: (req, res) => {
          // Increase violation count
          violations.set(key, violationCount + 1);
          
          // Set expiry for violations (clean up after 24 hours)
          setTimeout(() => {
            violations.delete(key);
          }, 24 * 60 * 60 * 1000);
        }
      });

      return limiter(req, res, next);
    };
  }
}

module.exports = new RateLimitingService();