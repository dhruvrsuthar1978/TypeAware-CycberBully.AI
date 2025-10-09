const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
require('dotenv').config();

const databaseConfig = require('./config/database');
const loggingService = require('./middleware/logging');
const rateLimitingService = require('./middleware/rateLimiting');

const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analyticsRoutes');
const extensionRoutes = require('./routes/extensionRoutes');

const protect = require('./middleware/authMiddleware');

const emailService = require('./services/emailService');
const contentModerationService = require('./services/contentModerationService');

const aiController = require('./controllers/aiController');

const app = express();

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

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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


async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await databaseConfig.connect();
    await databaseConfig.createIndexes();
    console.log('Database connected and indexes created');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}


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

    const overallHealth = dbHealth.status === 'connected' && loggingHealth.status === 'healthy'
      ? 'healthy' : 'degraded';

    res.json({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: { database: dbHealth, email: emailHealth, logging: loggingHealth },
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

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// Proxy routes for frontend compatibility
app.post('/api/analyze', aiController.analyzeContent);
app.post('/api/rephrase', aiController.getRephrasingSuggestions);


// 404 Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// General Error Handler
app.use((error, req, res, next) => {
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

  if (error.message.includes('Router.use() requires middleware function but got a Object')) {
    const routeError = new Error('Server Configuration Error: A route file is not exporting its Express Router correctly.');
    routeError.status = 500;
    return res.status(routeError.status).json({
      status: 'error',
      message: routeError.message,
      hint: process.env.NODE_ENV !== 'production' ? 'Check all route files for "module.exports = router;"' : undefined,
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = error.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server.'
      : error.message,
    timestamp: new Date().toISOString(),
  });
});


const PORT = process.env.PORT || 5000;

module.exports = app;

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      try {
        if (loggingService && loggingService.infoLogger) {
          loggingService.logInfo(`Server started successfully on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
        }
      } catch (logError) {
        console.error('Failed to log server start event:', logError.message);
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free it or change the PORT in .env`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  }).catch(err => {
    console.error('Failed to start server after database connection failure.', err);
    process.exit(1);
  });
}