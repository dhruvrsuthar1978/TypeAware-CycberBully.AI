// backend/controllers/moderationController.js

const moderationService = require('../services/moderationService');
const adminService = require('../services/adminService');
const { createResponse, createErrorResponse } = require('../utils/responseUtils');

class ModerationController {
  // Apply manual moderation action to user
  async applyModerationAction(req, res) {
    try {
      const { userId } = req.params;
      const { action, reason, duration } = req.body;

      const validActions = ['warning', 'suspension', 'ban', 'shadow_ban', 'unban', 'reactivate'];
      if (!validActions.includes(action)) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          `Action must be one of: ${validActions.join(', ')}`
        ));
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Reason is required for moderation actions'
        ));
      }

      const result = await moderationService.applyManualAction(
        userId,
        action,
        reason.trim(),
        req.user.username || 'admin',
        duration ? duration * 60 * 60 * 1000 : null // Convert hours to milliseconds
      );

      // Log admin action
      await adminService.logAdminAction(req.userId, 'apply_moderation_action', {
        targetUserId: userId,
        action,
        reason,
        duration
      });

      res.json(createResponse(
        `Moderation action '${action}' applied successfully`,
        result
      ));

    } catch (error) {
      console.error('Apply moderation action error:', error);
      res.status(500).json(createErrorResponse(
        'Moderation Failed',
        'Unable to apply moderation action'
      ));
    }
  }

  // Get user moderation status
  async getUserModerationStatus(req, res) {
    try {
      const { userId } = req.params;

      const status = await moderationService.getUserModerationStatus(userId);

      res.json(createResponse(
        'User moderation status retrieved successfully',
        { status }
      ));

    } catch (error) {
      console.error('Get user moderation status error:', error);
      res.status(500).json(createErrorResponse(
        'Status Error',
        'Unable to fetch user moderation status'
      ));
    }
  }

  // Check expired suspensions and reactivate users
  async checkExpiredSuspensions(req, res) {
    try {
      const reactivatedCount = await moderationService.checkExpiredSuspensions();

      res.json(createResponse(
        `Checked expired suspensions: ${reactivatedCount} users reactivated`,
        { reactivatedCount }
      ));

    } catch (error) {
      console.error('Check expired suspensions error:', error);
      res.status(500).json(createErrorResponse(
        'Check Failed',
        'Unable to check expired suspensions'
      ));
    }
  }
}

module.exports = new ModerationController();
