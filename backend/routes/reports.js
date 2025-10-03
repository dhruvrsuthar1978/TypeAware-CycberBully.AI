// backend/routes/reports.js (Verified, Stable Version)

const express = require('express');
const router = express.Router(); // 🛑 CRITICAL: Defines 'router' to fix ReferenceError
const reportController = require('../controllers/reportController');
const rateLimitingService = require('../middleware/rateLimiting');
const protect = require('../middleware/authMiddleware');

// Apply top-level middleware safely
router.use(rateLimitingService.generalApiLimiter()); 

// ------------------------------------
// UNAUTHENTICATED ROUTES
// ------------------------------------

// POST /api/reports (Report Submission)
router.post('/', reportController.submitReport);


// ------------------------------------
// AUTHENTICATED ROUTES
// ------------------------------------

// Apply authentication middleware to all routes below this line
router.use(protect); // 🛑 CRITICAL: Uses the correct function name

// GET /api/reports/my-reports
router.get('/my-reports', reportController.getUserReports);

// GET /api/reports/:reportId
router.get('/:reportId', reportController.getReportById);


// 🛑 CRITICAL: Exports the router 🛑
module.exports = router;