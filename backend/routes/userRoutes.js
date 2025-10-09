const express = require('express');
const userController = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', validate('updateProfile'), userController.updateProfile);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', userController.getStats);

// @route   GET /api/users/reports
// @desc    Get user's report history
// @access  Private
router.get('/reports', userController.getReports);

// @route   GET /api/users/reports/:reportId
// @desc    Get specific report details
// @access  Private
router.get('/reports/:reportId', userController.getReportDetails);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put(
  '/preferences',
  validate('updatePreferences'),
  userController.updatePreferences
);

// @route   GET /api/users/activity
// @desc    Get user activity summary
// @access  Private
router.get('/activity', userController.getActivitySummary);

// @route   GET /api/users/export
// @desc    Export user data (GDPR compliance)
// @access  Private
router.get('/export', userController.exportUserData);

// @route   DELETE /api/users/account
// @desc    Delete user account (deactivate)
// @access  Private
router.delete('/account', userController.deleteAccount);

// @route   GET /api/users/devices
// @desc    Get user's browser devices
// @access  Private
router.get('/devices', userController.getBrowserDevices);

// @route   DELETE /api/users/devices/:deviceId
// @desc    Remove browser device
// @access  Private
router.delete('/devices/:deviceId', userController.removeBrowserDevice);

// @route   PUT /api/users/security
// @desc    Update user security settings
// @access  Private
router.put('/security', userController.updateSecuritySettings);

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', userController.getNotifications);

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/notifications/:notificationId/read',
  userController.markNotificationRead
);

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', userController.markAllNotificationsRead);

// @route   GET /api/users/dashboard
// @desc    Get user dashboard summary
// @access  Private
router.get('/dashboard', userController.getDashboardSummary);

// @route   PUT /api/users/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', userController.updateAvatar);

// @route   GET /api/users/contributions
// @desc    Get user's contribution statistics
// @access  Private
router.get('/contributions', userController.getContributionStats);

module.exports = router;
