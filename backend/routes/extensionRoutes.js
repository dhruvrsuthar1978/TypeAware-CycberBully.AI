// routes/extensionRoutes.js
const express = require('express');
const router = express.Router();
const extensionController = require('../controllers/extensionController');
const rateLimitingService = require('../middleware/rateLimiting');

// Apply extension-specific rate limiting
router.use(rateLimitingService.generalApiLimiter());

// Extension middleware to validate headers
const validateExtensionHeaders = (req, res, next) => {
  const extensionId = req.headers['x-extension-id'];
  const version = req.headers['x-extension-version'];

  if (!extensionId) {
    return res.status(400).json({
      success: false,
      message: 'Extension ID header is required'
    });
  }

  if (!version) {
    return res.status(400).json({
      success: false,
      message: 'Extension version header is required'
    });
  }

  next();
};

// Apply validation to all routes except health check
router.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/platforms') {
    return next();
  }
  return validateExtensionHeaders(req, res, next);
});

// Health and status endpoints
router.get('/health', extensionController.getHealth);
router.get('/platforms', extensionController.getSupportedPlatforms);

// Extension lifecycle
router.post('/ping', 
  rateLimitingService.extensionSyncLimiter(),
  extensionController.ping
);

router.post('/register', 
  rateLimitingService.registerLimiter(),
  extensionController.registerInstallation
);

// Configuration and updates
router.get('/config', extensionController.getConfig);
router.get('/updates', extensionController.checkUpdates);
router.get('/patterns', extensionController.getDetectionPatterns);

// User settings management
router.get('/settings', extensionController.getSettings);
router.put('/settings', extensionController.updateSettings);

// Data synchronization
router.post('/sync', 
  rateLimitingService.extensionSyncLimiter(),
  extensionController.syncData
);

// Statistics and analytics
router.get('/stats', extensionController.getUserStats);
router.post('/analytics', 
  rateLimitingService.extensionSyncLimiter(),
  extensionController.submitAnalytics
);

// Report submission
router.post('/reports', 
  rateLimitingService.extensionReportLimiter(),
  extensionController.submitReport
);

router.post('/reports/batch', 
  rateLimitingService.extensionReportLimiter(),
  extensionController.submitReportsBatch
);

// Error reporting and feedback
router.post('/errors', extensionController.reportError);
router.post('/feedback', extensionController.submitFeedback);

// API key validation (for premium features)
router.post('/validate-key', extensionController.validateApiKey);

// Extension-specific middleware for authenticated routes
const requireUserUuid = (req, res, next) => {
  const userUuid = req.headers['x-user-uuid'];
  
  if (!userUuid) {
    return res.status(400).json({
      success: false,
      message: 'User UUID header is required for this endpoint'
    });
  }
  
  next();
};

// Apply user UUID requirement to specific routes
router.use(['/settings', '/stats', '/sync', '/reports'], requireUserUuid);

module.exports = router;