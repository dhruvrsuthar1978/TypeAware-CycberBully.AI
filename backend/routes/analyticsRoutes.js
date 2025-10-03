// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Each route explicitly calls the controller method
router.get('/overview', (req, res) => analyticsController.getSystemAnalytics(req, res));
router.get('/system', (req, res) => analyticsController.getSystemAnalytics(req, res));
router.get('/abusive-terms', (req, res) => analyticsController.getAbusiveTermsStats(req, res));
router.get('/platform-stats', (req, res) => analyticsController.getPlatformStats(req, res));
router.get('/detection-trends', (req, res) => analyticsController.getDetectionTrends(req, res));
router.get('/user-engagement', (req, res) => analyticsController.getUserEngagementStats(req, res));
router.get('/top-flagged-users', (req, res) => analyticsController.getTopFlaggedUsers(req, res));
router.get('/recently-flagged', (req, res) => analyticsController.getRecentlyFlaggedContent(req, res));
router.get('/dashboard-summary', (req, res) => analyticsController.getDashboardSummary(req, res));
router.get('/export', (req, res) => analyticsController.exportAnalyticsData(req, res));

module.exports = router;
