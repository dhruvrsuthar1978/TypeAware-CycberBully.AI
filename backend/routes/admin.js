// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// Import the AdminController instance
const adminController = require('../controllers/adminController');
// Import middleware (assuming correct exports from auth.js)
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const loggingService = require('../middleware/logging'); 

// ---------------------------------------------
// GLOBAL ADMIN MIDDLEWARE (Recommended)
// ---------------------------------------------

// Ensure all routes require authentication and admin privileges
router.use(protect); 
router.use(requireAdmin); 
router.use(loggingService.auditLogger()); 

// ---------------------------------------------
// DASHBOARD & ANALYTICS ROUTES
// ---------------------------------------------

// @route GET /api/admin/dashboard (Maps to getDashboard)
router.get('/dashboard', adminController.getDashboard);

// @route GET /api/admin/analytics/system (Maps to getSystemAnalytics)
router.get('/analytics/system', adminController.getSystemAnalytics);

// @route GET /api/admin/analytics/accuracy (Maps to getDetectionAccuracy)
router.get('/analytics/accuracy', adminController.getDetectionAccuracy);

// @route GET /api/admin/analytics/platform-stats (Maps to getPlatformStats)
router.get('/analytics/platform-stats', adminController.getPlatformStats);

// ---------------------------------------------
// REPORT MANAGEMENT ROUTES
// ---------------------------------------------

// @route GET /api/admin/reports/pending (Maps to getPendingReports)
router.get('/reports/pending', adminController.getPendingReports);

// @route GET /api/admin/reports/flagged (Maps to getFlaggedReports)
router.get('/reports/flagged', adminController.getFlaggedReports);

// @route PUT /api/admin/reports/:reportId/review (Maps to reviewReport)
router.put('/reports/:reportId/review', adminController.reviewReport);

// @route POST /api/admin/reports/bulk-review (Maps to bulkReviewReports)
router.post('/reports/bulk-review', adminController.bulkReviewReports);

// @route DELETE /api/admin/reports/:reportId (Maps to deleteReport)
router.delete('/reports/:reportId', adminController.deleteReport);

// @route GET /api/admin/reports/export (Maps to exportReports)
router.get('/reports/export', adminController.exportReports);


// ---------------------------------------------
// USER & SYSTEM MANAGEMENT ROUTES
// ---------------------------------------------

// @route GET /api/admin/users/flagged (Maps to getFlaggedUsers)
router.get('/users/flagged', adminController.getFlaggedUsers);

// @route GET /api/admin/users/:userId (Maps to getUserDetails)
router.get('/users/:userId', adminController.getUserDetails);

// @route PUT /api/admin/users/:userId/status (Maps to updateUserStatus)
router.put('/users/:userId/status', adminController.updateUserStatus);

// @route GET /api/admin/logs (Maps to getAdminLogs)
router.get('/logs', adminController.getAdminLogs);

// @route GET /api/admin/queue (Maps to getModerationQueue)
router.get('/queue', adminController.getModerationQueue);

// @route PUT /api/admin/settings (Maps to updateSystemSettings)
router.put('/settings', adminController.updateSystemSettings);


// ---------------------------------------------
// MODERATION ROUTES
// ---------------------------------------------

const moderationController = require('../controllers/moderationController');

// Apply manual moderation action
router.post('/moderation/apply-action/:userId', moderationController.applyModerationAction);

// Get user moderation status
router.get('/moderation/status/:userId', moderationController.getUserModerationStatus);

// Check expired suspensions and reactivate users
router.post('/moderation/check-expired-suspensions', moderationController.checkExpiredSuspensions);

// ---------------------------------------------
// EXPORT
// ---------------------------------------------
module.exports = router;
