const User = require('../models/User');
const Report = require('../models/Report');
const userService = require('../services/userService');
const reportService = require('../services/reportService');
const authService = require('../services/authService');
const { createResponse, createErrorResponse, createPaginatedResponse } = require('../utils/responseUtils');

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await userService.getUserProfile(req.userId);
      
      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User profile not found'
        ));
      }

      res.json(createResponse(
        'Profile retrieved successfully',
        { user }
      ));

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(createErrorResponse(
        'Profile Error',
        'Unable to fetch profile'
      ));
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { username, preferences, profile } = req.body;
      
      const updatedUser = await userService.updateUserProfile(req.userId, {
        username,
        preferences,
        profile
      });

      res.json(createResponse(
        'Profile updated successfully',
        { user: updatedUser }
      ));

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message.includes('Username already exists')) {
        return res.status(400).json(createErrorResponse(
          'Username Taken',
          'Username is already taken by another user'
        ));
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          messages.join(', ')
        ));
      }

      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update profile'
      ));
    }
  }

  // Get user statistics
  async getStats(req, res) {
    try {
      const stats = await userService.getUserStatistics(req.userId);

      res.json(createResponse(
        'Statistics retrieved successfully',
        { stats }
      ));

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json(createErrorResponse(
        'Stats Error',
        'Unable to fetch statistics'
      ));
    }
  }

  // Get user's report history
  async getReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const category = req.query.category;

      const result = await userService.getUserReports(req.userId, {
        page,
        limit,
        status,
        category
      });

      res.json(createPaginatedResponse(
        result.reports,
        page,
        limit,
        result.total,
        'Reports retrieved successfully'
      ));

    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json(createErrorResponse(
        'Reports Error',
        'Unable to fetch reports'
      ));
    }
  }

  // Get specific report details
  async getReportDetails(req, res) {
    try {
      const { reportId } = req.params;
      
      const report = await reportService.getReportById(reportId, req.userId);

      if (!report) {
        return res.status(404).json(createErrorResponse(
          'Report Not Found',
          'Report not found or you do not have access to it'
        ));
      }

      res.json(createResponse(
        'Report retrieved successfully',
        { report }
      ));

    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json(createErrorResponse(
        'Report Error',
        'Unable to fetch report'
      ));
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const { darkMode, notifications, emailUpdates, language } = req.body;
      
      const updatedUser = await userService.updateUserPreferences(req.userId, {
        darkMode,
        notifications,
        emailUpdates,
        language
      });

      res.json(createResponse(
        'Preferences updated successfully',
        { preferences: updatedUser.preferences }
      ));

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update preferences'
      ));
    }
  }

  // Get user activity summary
  async getActivitySummary(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      
      const activity = await userService.getUserActivity(req.userId, days);

      res.json(createResponse(
        'Activity summary retrieved successfully',
        { activity }
      ));

    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json(createErrorResponse(
        'Activity Error',
        'Unable to fetch activity summary'
      ));
    }
  }

  // Export user data (GDPR compliance)
  async exportUserData(req, res) {
    try {
      const userData = await userService.exportUserData(req.userId);

      res.json(createResponse(
        'User data exported successfully',
        { userData }
      ));

    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json(createErrorResponse(
        'Export Failed',
        'Unable to export user data'
      ));
    }
  }

  // Delete user account (deactivate)
  async deleteAccount(req, res) {
    try {
      const { password, confirmation } = req.body;

      if (confirmation !== 'DELETE_ACCOUNT') {
        return res.status(400).json(createErrorResponse(
          'Confirmation Required',
          'Please confirm account deletion by providing "DELETE_ACCOUNT" as confirmation'
        ));
      }

      const user = await authService.findUserById(req.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User not found'
        ));
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json(createErrorResponse(
          'Invalid Password',
          'Password is incorrect'
        ));
      }

      await userService.deactivateAccount(req.userId);

      res.json(createResponse(
        'Account deactivated successfully',
        { message: 'Your account has been deactivated. Contact support to reactivate.' }
      ));

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json(createErrorResponse(
        'Delete Failed',
        'Unable to delete account'
      ));
    }
  }

  // Get user's browser devices
  async getBrowserDevices(req, res) {
    try {
      const devices = await userService.getUserBrowserDevices(req.userId);

      res.json(createResponse(
        'Browser devices retrieved successfully',
        { devices }
      ));

    } catch (error) {
      console.error('Get browser devices error:', error);
      res.status(500).json(createErrorResponse(
        'Devices Error',
        'Unable to fetch browser devices'
      ));
    }
  }

  // Remove browser device
  async removeBrowserDevice(req, res) {
    try {
      const { deviceId } = req.params;
      
      await userService.removeBrowserDevice(req.userId, deviceId);

      res.json(createResponse(
        'Browser device removed successfully',
        null
      ));

    } catch (error) {
      console.error('Remove browser device error:', error);
      res.status(500).json(createErrorResponse(
        'Remove Failed',
        'Unable to remove browser device'
      ));
    }
  }

  // Update user security settings
  async updateSecuritySettings(req, res) {
    try {
      const { twoFactorEnabled, loginNotifications, securityAlerts } = req.body;
      
      const updatedUser = await userService.updateSecuritySettings(req.userId, {
        twoFactorEnabled,
        loginNotifications,
        securityAlerts
      });

      res.json(createResponse(
        'Security settings updated successfully',
        { securitySettings: updatedUser.securitySettings }
      ));

    } catch (error) {
      console.error('Update security settings error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update security settings'
      ));
    }
  }

  // Get user notifications
  async getNotifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await userService.getUserNotifications(req.userId, {
        page,
        limit,
        unreadOnly
      });

      res.json(createPaginatedResponse(
        result.notifications,
        page,
        limit,
        result.total,
        'Notifications retrieved successfully'
      ));

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json(createErrorResponse(
        'Notifications Error',
        'Unable to fetch notifications'
      ));
    }
  }

  // Mark notification as read
  async markNotificationRead(req, res) {
    try {
      const { notificationId } = req.params;
      
      await userService.markNotificationAsRead(req.userId, notificationId);

      res.json(createResponse(
        'Notification marked as read',
        null
      ));

    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to mark notification as read'
      ));
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(req, res) {
    try {
      const count = await userService.markAllNotificationsAsRead(req.userId);

      res.json(createResponse(
        'All notifications marked as read',
        { markedCount: count }
      ));

    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to mark all notifications as read'
      ));
    }
  }

  // Get user dashboard summary
  async getDashboardSummary(req, res) {
    try {
      const summary = await userService.getDashboardSummary(req.userId);

      res.json(createResponse(
        'Dashboard summary retrieved successfully',
        { summary }
      ));

    } catch (error) {
      console.error('Get dashboard summary error:', error);
      res.status(500).json(createErrorResponse(
        'Dashboard Error',
        'Unable to fetch dashboard summary'
      ));
    }
  }

  // Update user avatar
  async updateAvatar(req, res) {
    try {
      const { avatar } = req.body;
      
      const updatedUser = await userService.updateUserAvatar(req.userId, avatar);

      res.json(createResponse(
        'Avatar updated successfully',
        { avatar: updatedUser.profile.avatar }
      ));

    } catch (error) {
      console.error('Update avatar error:', error);
      res.status(500).json(createErrorResponse(
        'Update Failed',
        'Unable to update avatar'
      ));
    }
  }

  // Get user's contribution statistics
  async getContributionStats(req, res) {
    try {
      const stats = await userService.getContributionStatistics(req.userId);

      res.json(createResponse(
        'Contribution statistics retrieved successfully',
        { stats }
      ));

    } catch (error) {
      console.error('Get contribution stats error:', error);
      res.status(500).json(createErrorResponse(
        'Stats Error',
        'Unable to fetch contribution statistics'
      ));
    }
  }
}

module.exports = new UserController();