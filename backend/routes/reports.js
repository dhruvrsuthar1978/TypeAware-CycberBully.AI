const express = require('express');
const reportController = require('../controllers/reportController');
const { optionalAuth, validateBrowserUUID } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/reports/submit
// @desc    Submit a new report from browser extension
// @access  Public (but requires browserUUID)
router.post('/submit', 
  validateBrowserUUID, 
  optionalAuth,
  validate('submitReport'),
  reportController.submitReport
);

// @route   POST /api/reports/batch
// @desc    Submit multiple reports (for bulk processing)
// @access  Public (but requires browserUUID)
router.post('/batch', 
  validateBrowserUUID, 
  optionalAuth,
  validate('batchReports'),
  reportController.submitBatchReports
);

// @route   GET /api/reports/browser/:browserUUID
// @desc    Get reports for a specific browser UUID
// @access  Public (for browser extension)
router.get('/browser/:browserUUID', reportController.getReportsByBrowserUUID);

// @route   GET /api/reports/browser/:browserUUID/stats
// @desc    Get report statistics for a browser UUID
// @access  Public (for browser extension)
router.get('/browser/:browserUUID/stats', reportController.getBrowserUUIDStats);

// @route   PUT /api/reports/:reportId/feedback
// @desc    Submit feedback on a report
// @access  Public (for browser extension)
router.put('/:reportId/feedback', 
  validate('submitFeedback'),
  reportController.submitFeedback
);

// @route   GET /api/reports/:reportId
// @desc    Get specific report details
// @access  Private (requires authentication)
router.get('/:reportId', optionalAuth, reportController.getReportById);

// @route   DELETE /api/reports/:reportId
// @desc    Delete report (user can delete their own reports)
// @access  Private (requires authentication)
router.delete('/:reportId', optionalAuth, reportController.deleteReport);

// @route   GET /api/reports/:reportId/similar
// @desc    Get similar reports (for duplicate detection)
// @access  Private (requires authentication)
router.get('/:reportId/similar', optionalAuth, reportController.getSimilarReports);

// @route   PUT /api/reports/:reportId/status
// @desc    Update report status (for user corrections)
// @access  Private (requires authentication)
router.put('/:reportId/status', optionalAuth, reportController.updateReportStatus);

module.exports = router;