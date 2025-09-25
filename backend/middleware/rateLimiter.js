const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client if Redis URL is provided
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.warn('Redis server refused connection, falling back to memory store');
        return undefined; // Don't retry
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return undefined; // Stop retrying after 1 hour
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  redisClient.on('error', (err) => {
    console.warn('Redis client error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis for rate limiting');
  });
}

/**
 * Create rate limiter with optional Redis store
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use Redis store if available, otherwise fall back to memory store
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }) : undefined,
    ...options
  };

  return rateLimit(defaultOptions);
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Authentication rate limiter (stricter)
 * 5 login attempts per 15 minutes per IP
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false // Count failed requests
});

/**
 * Report submission rate limiter
 * 50 reports per hour per IP (to prevent spam)
 */
const reportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: 'Too many reports submitted, please try again after 1 hour.'
  }
});

/**
 * Admin operations rate limiter (more lenient)
 * 500 requests per 15 minutes for admin operations
 */
const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Admin rate limit exceeded, please try again later.'
  }
});

/**
 * Registration rate limiter (very strict)
 * 3 registrations per hour per IP
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again after 1 hour.'
  }
});

/**
 * Password reset rate limiter
 * 3 password reset attempts per hour per IP
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.'
  }
});

/**
 * Analytics rate limiter (moderate)
 * 200 requests per 15 minutes per IP
 */
const analyticsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Analytics rate limit exceeded, please try again later.'
  }
});

/**
 * Browser extension rate limiter (higher limit for extensions)
 * 1000 requests per hour per IP (extensions may send frequent reports)
 */
const extensionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Extension rate limit exceeded, please try again later.'
  }
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicUserLimiter = (req, res, next) => {
  // If user is not authenticated, use general limiter
  if (!req.user) {
    return generalLimiter(req, res, next);
  }

  // Different limits based on user role
  let limiter;
  switch (req.user.role) {
    case 'admin':
      limiter = adminLimiter;
      break;
    case 'moderator':
      limiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 300,
        message: {
          success: false,
          message: 'Moderator rate limit exceeded, please try again later.'
        }
      });
      break;
    default:
      limiter = generalLimiter;
  }

  return limiter(req, res, next);
};

/**
 * Create a custom rate limiter with browser UUID tracking
 * This prevents a single browser extension from overwhelming the system
 */
const browserUUIDLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 reports per hour per browser UUID
  keyGenerator: (req) => {
    // Use browser UUID from request body as the key
    return req.body.browserUUID || req.ip;
  },
  message: {
    success: false,
    message: 'Browser extension rate limit exceeded, please try again later.'
  }
});

/**
 * Middleware to handle rate limit errors gracefully
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err && err.type === 'rate-limit-exceeded') {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      retryAfter: err.retryAfter,
      limit: err.limit,
      current: err.current,
      remaining: err.remaining
    });
  }
  next(err);
};

/**
 * Get current rate limit status for debugging
 */
const getRateLimitStatus = async (req, res, next) => {
  try {
    // This is mainly for debugging and admin purposes
    if (req.user && req.user.role === 'admin') {
      const key = req.ip;
      
      // If using Redis, get current count
      if (redisClient) {
        const current = await redisClient.get(`rl:${key}`);
        req.rateLimitStatus = {
          key,
          current: current || 0,
          store: 'redis'
        };
      } else {
        req.rateLimitStatus = {
          key,
          store: 'memory'
        };
      }
    }
    next();
  } catch (error) {
    // Don't fail the request if we can't get rate limit status
    next();
  }
};

/**
 * Clear rate limits for a specific IP (admin only)
 */
const clearRateLimit = async (ip) => {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(`rl:${ip}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error clearing rate limit:', error);
    return false;
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  reportLimiter,
  adminLimiter,
  registrationLimiter,
  passwordResetLimiter,
  analyticsLimiter,
  extensionLimiter,
  dynamicUserLimiter,
  browserUUIDLimiter,
  rateLimitErrorHandler,
  getRateLimitStatus,
  clearRateLimit,
  createRateLimiter
};