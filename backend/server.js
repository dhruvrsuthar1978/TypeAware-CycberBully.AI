// server.js - Production-Ready TypeAware Backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import configurations and utilities
const databaseConfig = require('./config/database');
const jwtConfig = require('./config/jwt');
const loggingService = require('./middleware/logging');
const rateLimitingService = require('./middleware/rateLimiting');

// Import routes (fixed file names)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/user');          // ✅ fixed
const reportRoutes = require('./routes/reports');     // ✅ fixed
const adminRoutes = require('./routes/admin');        // ✅ fixed
const analyticsRoutes = require('./routes/analyticsRoutes');
const extensionRoutes = require('./routes/extensionRoutes');

// Import services for initialization
const emailService = require('./services/emailService');
const contentModerationService = require('./services/contentModerationService');

const app = express();

// ============================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.APP_URL || "http://localhost:3000"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
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
      callback(new Error('Not allowed by CORS'));
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize logging system
loggingService.initialize();

// Request logging
app.use(loggingService.requestIdMiddleware());
app.use(loggingService.accessLogger());
app.use(loggingService.sanitizeRequestMiddleware());
app.use(loggingService.auditLogger());
app.use(loggingService.securityLogger());
app.use(loggingService.performanceLogger());
app.use(loggingService.rateLimitLogger());

// Health check bypass for rate limiting
app.use(rateLimitingService.healthCheckBypass());

// General rate limiting
app.use(rateLimitingService.generalApiLimiter());

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await databaseConfig.connect();

    // Create indexes for better performance
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
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/extension', extensionRoutes);

// ... rest of your file (unchanged, error handling, server start etc.)
