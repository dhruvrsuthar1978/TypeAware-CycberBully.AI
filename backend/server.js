// server.js - Production-Ready TypeAware Backend

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
require('dotenv').config();

// Import configurations and utilities
const databaseConfig = require('./config/database');
const jwtConfig = require('./config/jwt'); 
const loggingService = require('./middleware/logging');
const rateLimitingService = require('./middleware/rateLimiting');

// Import routes (All verified to export router correctly)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analyticsRoutes');
const extensionRoutes = require('./routes/extensionRoutes');

// Import authentication middleware
const protect = require('./middleware/authMiddleware');

// Import services for initialization
const emailService = require('./services/emailService');
const contentModerationService = require('./services/contentModerationService'); 

const app = express();

// ============================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:8080',
      'http://localhost:8081',
      'https://typeaware.com',
      'https://www.typeaware.com',
      'https://app.typeaware.com'
    ];

    if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Instead of throwing an error, return false to block the request without error
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Extension-ID',
    'X-Extension-Version',
    'X-User-UUID',
    'X-API-Key'
  ]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging & rate limiting
loggingService.initialize();
app.use(loggingService.requestIdMiddleware());
app.use(loggingService.accessLogger());
app.use(loggingService.sanitizeRequestMiddleware());
app.use(loggingService.auditLogger());
app.use(loggingService.securityLogger());
app.use(loggingService.performanceLogger());
app.use(loggingService.rateLimitLogger());
app.use(rateLimitingService.healthCheckBypass());
app.use(rateLimitingService.generalApiLimiter());

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await databaseConfig.connect();
    await databaseConfig.createIndexes();
    console.log('✅ Database connected and indexes created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the TypeAware API!',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    const [dbHealth, emailHealth, loggingHealth] = await Promise.all([
      databaseConfig.checkHealth(),
      emailService.verifyConnection(),
      loggingService.healthCheck()
    ]);

    const overallHealth =
      dbHealth.status === 'connected' &&
      loggingHealth.status === 'healthy' ? 'healthy' : 'degraded';

    res.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        email: emailHealth,
        logging: loggingHealth
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    api: 'TypeAware Backend API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      authentication: true,
      userManagement: true,
      reportSystem: true,
      analytics: true,
      adminPanel: true,
      extensionSupport: true,
      emailNotifications: emailService.getServiceStatus().configured,
      contentModeration: true
    }
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// ============================================================================
// AI INTEGRATION ROUTE
// ============================================================================

app.post('/api/ai/predict', async (req, res) => {
  try {
    const input = req.body;

    // Call AI service (Python FastAPI/Flask server)
    const aiResponse = await axios.post(
      process.env.AI_URL || 'http://localhost:8000/predict',
      input
    );

    res.json(aiResponse.data);
  } catch (error) {
    // Log detailed AI service error, but return a generic 500
    loggingService.logError('AI service error:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'AI service unavailable or request failed' });
  }
});

// ============================================================================
// ERROR HANDLERS (MUST BE LAST MIDDLEWARE)
// ============================================================================

// 404 Handler - Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// General Error Handler - Catches all errors passed with next(error)
app.use((error, req, res, next) => {
  // Log the detailed error for backend tracking
  // We wrap this logging call in a try/catch to ensure the server doesn't crash on logging failure
  try {
      if (loggingService && loggingService.errorLogger) {
          loggingService.logError(`[${error.status || 500}] ${error.message}`, {
            stack: error.stack,
            endpoint: req.originalUrl,
            method: req.method,
            ip: req.ip
          });
      }
  } catch(e) {
      console.error('CRITICAL LOGGING FAILURE:', e.message);
  }

  // Handle the "Router not exported" issue cleanly
  if (error.message.includes('Router.use() requires middleware function but got a Object')) {
    const routeError = new Error('Server Configuration Error: A route file is not exporting its Express Router correctly. Check all route files for "module.exports = router;".');
    routeError.status = 500;
    
    console.error('\n\n🚨 MAJOR CONFIG ERROR DETECTED: A route file is likely MISSING "module.exports = router;"\n\n');
    
    return res.status(routeError.status).json({
      status: 'error',
      message: routeError.message,
      hint: process.env.NODE_ENV !== 'production' ? 'Check all files imported by app.use() for the missing export.' : undefined,
      timestamp: new Date().toISOString()
    });
  }

  // Send a generic, non-leaking error response in production
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server.'
      : error.message,
    timestamp: new Date().toISOString(),
  });
});


// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 5001;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    
    // 🛑 FIX: Safely logging the startup event
    try {
        if (loggingService && loggingService.infoLogger) {
            loggingService.logInfo(`Server started successfully on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
        } else {
            // Fallback console log for confirmation if the logger failed to initialize
            console.log('✅ Server startup logged.');
        }
    } catch (logError) {
        console.error('❌ Failed to log server start event:', logError.message);
    }
  });
})
.catch(err => {
    // Catch-all for unhandled rejection from initializeDatabase()
    console.error('❌ Failed to start server after database connection failure.', err);
    process.exit(1);
});
