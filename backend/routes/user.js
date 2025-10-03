const express = require('express');
const userController = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Note: The prompt mentions that the protect middleware is applied
// in server.js for the entire '/api/users' path. If not, it should be added here.
// Example: router.use(protect);

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  validate('updateProfile'),
  userController.updateProfile
);

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', userController.getStats);

// @route   GET /api/user/reports
// @desc    Get user's report history
// @access  Private
router.get('/reports', userController.getReports);

// @route   GET /api/user/reports/:reportId
// @desc    Get specific report details
// @access  Private
router.get('/reports/:reportId', userController.getReportDetails);

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', 
  validate('updatePreferences'),
  userController.updatePreferences
);

// @route   GET /api/user/activity
// @desc    Get user activity summary
// @access  Private
router.get('/activity', userController.getActivitySummary);

// @route   GET /api/user/export
// @desc    Export user data (GDPR compliance)
// @access  Private
router.get('/export', userController.exportUserData);

// @route   DELETE /api/user/account
// @desc    Delete user account (deactivate)
// @access  Private
router.delete('/account', userController.deleteAccount);

// @route   GET /api/user/devices
// @desc    Get user's browser devices
// @access  Private
router.get('/devices', userController.getBrowserDevices);

// @route   DELETE /api/user/devices/:deviceId
// @desc    Remove browser device
// @access  Private
router.delete('/devices/:deviceId', userController.removeBrowserDevice);

// @route   PUT /api/user/security
// @desc    Update user security settings
// @access  Private
router.put('/security', userController.updateSecuritySettings);

// @route   GET /api/user/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', userController.getNotifications);

// @route   PUT /api/user/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:notificationId/read', userController.markNotificationRead);

// @route   PUT /api/user/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', userController.markAllNotificationsRead);

// @route   GET /api/user/dashboard
// @desc    Get user dashboard summary
// @access  Private
router.get('/dashboard', userController.getDashboardSummary);

// @route   PUT /api/user/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', userController.updateAvatar);

// @route   GET /api/user/contributions
// @desc    Get user's contribution statistics
// @access  Private
router.get('/contributions', userController.getContributionStats);

module.exports = router;

