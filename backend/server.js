// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// --- Services, Configs, Middleware ---
const databaseConfig = require('./config/database');
const loggingService = require('./middleware/logging');
const rateLimitingService = require('./middleware/rateLimiting');

const emailService = require('./services/emailService');
const aiController = require('./controllers/aiController');

// --- Routes ---
const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analyticsRoutes');
const extensionRoutes = require('./routes/extensionRoutes');
const protect = require('./middleware/authMiddleware');

const app = express();

// ------------------
// 🛡️ Security & Middlewares
// ------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "https://*"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// ✅ Updated CORS Configuration
const allowedOrigins = [
  process.env.APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://typeaware.com',
  'https://www.typeaware.com',
  'https://app.typeaware.com',
  // 🔥 Add your Vercel domain here
  'https://type-aware-cycber-bully-ai-git-main-dhruvs-projects-1256a535.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://')
    ) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
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

// ------------------
// 🧰 Parsing & Logging
// ------------------
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

// ------------------
// 💾 Database Initialization
// ------------------
async function initializeDatabase() {
  try {
    console.log('🟢 Connecting to database...');
    await databaseConfig.connect();
    await databaseConfig.createIndexes();
    console.log('✅ Database connected and indexes created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// ------------------
// 🧩 Health & Status Routes
// ------------------
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
      dbHealth.status === 'connected' && loggingHealth.status === 'healthy'
        ? 'healthy'
        : 'degraded';

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
  });
});

// ------------------
// 🧠 API Routes
// ------------------
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// For frontend compatibility
app.post('/api/analyze', aiController.analyzeContent);
app.post('/api/rephrase', aiController.getRephrasingSuggestions);

// ------------------
// ❌ 404 + Error Handlers
// ------------------
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;

  loggingService.logError?.(`[${statusCode}] ${error.message}`, {
    stack: error.stack,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    status: 'error',
    message:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred on the server.'
        : error.message,
    timestamp: new Date().toISOString(),
  });
});

// ------------------
// 🚀 Server Startup
// ------------------
const PORT = process.env.PORT || 5000;

module.exports = app;

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      loggingService.logInfo?.(`Server started on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  });
}
