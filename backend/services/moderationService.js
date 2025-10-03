// services/moderationService.js
const User = require('../models/User');
const Report = require('../models/Report');

class ModerationService {
  constructor() {
    // Escalating penalty configuration
    this.penaltyConfig = {
      warnings: {
        maxWarnings: 3,
        resetPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        actions: {
          1: { type: 'warning', message: 'First warning: Please review community guidelines.' },
          2: { type: 'warning', message: 'Second warning: Continued violations may result in suspension.' },
          3: { type: 'suspension', duration: 24 * 60 * 60 * 1000, message: 'Account suspended for 24 hours due to repeated violations.' }
        }
      },
      suspensions: {
        maxSuspensions: 3,
        escalation: [
          { duration: 24 * 60 * 60 * 1000, message: '24-hour suspension' },
          { duration: 7 * 24 * 60 * 60 * 1000, message: '7-day suspension' },
          { duration: 30 * 24 * 60 * 60 * 1000, message: '30-day suspension' }
        ]
      }
    };
  }

  /**
   * Process a violation for a user based on report
   */
  async processViolation(userId, reportId, severity = 'medium', adminAction = false) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Record the violation
      const violation = {
        date: new Date(),
        type: 'warning', // Will be updated based on escalation
        reason: 'Content violation detected',
        severity,
        reportId,
        adminAction
      };

      // Determine action based on user's history and severity
      const action = await this.determineAction(user, severity);

      violation.type = action.type;

      // Apply the action
      await this.applyModerationAction(user, action, violation, reportId);

      // Update user stats
      user.stats.totalViolations += 1;
      if (action.type === 'warning') user.stats.warningCount += 1;
      if (action.type === 'suspension') user.stats.suspensionCount += 1;

      await user.save();

      return {
        action: action.type,
        message: action.message,
        duration: action.duration || null,
        userStatus: user.moderation.status
      };

    } catch (error) {
      console.error('Error processing violation:', error);
      throw error;
    }
  }

  /**
   * Determine the appropriate action based on user history and violation severity
   */
  async determineAction(user, severity) {
    const { warningCount, suspensionCount } = user.stats;
    const { status, lastWarningDate, lastSuspensionDate } = user.moderation;

    // Check if user is already suspended or banned
    if (status === 'suspended' || status === 'banned') {
      return { type: 'ban', message: 'Account already restricted' };
    }

    // Reset counters if enough time has passed
    const now = new Date();
    const resetPeriod = this.penaltyConfig.warnings.resetPeriod;

    if (lastWarningDate && (now - lastWarningDate) > resetPeriod) {
      user.stats.warningCount = 0;
      await user.save();
    }

    // Determine action based on severity and history
    if (severity === 'critical') {
      return { type: 'suspension', duration: 7 * 24 * 60 * 60 * 1000, message: 'Critical violation: 7-day suspension' };
    }

    if (severity === 'high') {
      if (suspensionCount >= 2) {
        return { type: 'ban', message: 'Permanent ban due to repeated serious violations' };
      }
      return { type: 'suspension', duration: 24 * 60 * 60 * 1000, message: 'High severity violation: 24-hour suspension' };
    }

    // Medium/low severity - use warning system
    const newWarningCount = warningCount + 1;
    const warningAction = this.penaltyConfig.warnings.actions[newWarningCount];

    if (warningAction) {
      return warningAction;
    } else {
      // Exceeded max warnings, escalate to suspension
      const suspensionLevel = Math.min(suspensionCount + 1, this.penaltyConfig.suspensions.escalation.length);
      const suspensionConfig = this.penaltyConfig.suspensions.escalation[suspensionLevel - 1];
      return {
        type: 'suspension',
        duration: suspensionConfig.duration,
        message: suspensionConfig.message
      };
    }
  }

  /**
   * Apply the determined moderation action to the user
   */
  async applyModerationAction(user, action, violation, reportId) {
    const now = new Date();

    // Add to violation history
    user.moderation.violationHistory.push(violation);

    // Add moderation note
    user.moderation.moderationNotes.push({
      date: now,
      admin: 'system',
      action: action.type,
      reason: violation.reason,
      details: `Automated action based on violation severity: ${violation.severity}`
    });

    // Apply specific action
    switch (action.type) {
      case 'warning':
        user.moderation.status = 'warned';
        user.moderation.lastWarningDate = now;
        break;

      case 'suspension':
        user.moderation.status = 'suspended';
        user.moderation.suspensionEndDate = new Date(now.getTime() + action.duration);
        user.moderation.lastSuspensionDate = now;
        user.isActive = false; // Deactivate account during suspension
        break;

      case 'ban':
        user.moderation.status = 'banned';
        user.moderation.banReason = violation.reason;
        user.isActive = false;
        break;

      case 'shadow_ban':
        user.moderation.status = 'shadow_banned';
        user.moderation.shadowBanned = true;
        break;
    }
  }

  /**
   * Check if suspended users should be reactivated
   */
  async checkExpiredSuspensions() {
    try {
      const now = new Date();
      const expiredUsers = await User.find({
        'moderation.status': 'suspended',
        'moderation.suspensionEndDate': { $lt: now }
      });

      for (const user of expiredUsers) {
        user.moderation.status = 'active';
        user.isActive = true;
        user.moderation.suspensionEndDate = null;

        user.moderation.moderationNotes.push({
          date: now,
          admin: 'system',
          action: 'reactivation',
          reason: 'Suspension period expired',
          details: 'Account automatically reactivated'
        });

        await user.save();
      }

      return expiredUsers.length;
    } catch (error) {
      console.error('Error checking expired suspensions:', error);
      throw error;
    }
  }

  /**
   * Manually apply moderation action (admin only)
   */
  async applyManualAction(userId, action, reason, adminUsername, duration = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const violation = {
        date: now,
        type: action,
        reason,
        severity: 'high',
        adminAction: true
      };

      // Add to violation history
      user.moderation.violationHistory.push(violation);

      // Add moderation note
      user.moderation.moderationNotes.push({
        date: now,
        admin: adminUsername,
        action,
        reason,
        details: 'Manual admin action'
      });

      // Apply action
      switch (action) {
        case 'warning':
          user.moderation.status = 'warned';
          user.moderation.lastWarningDate = now;
          break;

        case 'suspension':
          user.moderation.status = 'suspended';
          user.moderation.suspensionEndDate = duration ? new Date(now.getTime() + duration) : null;
          user.moderation.lastSuspensionDate = now;
          user.isActive = false;
          break;

        case 'ban':
          user.moderation.status = 'banned';
          user.moderation.banReason = reason;
          user.isActive = false;
          break;

        case 'shadow_ban':
          user.moderation.status = 'shadow_banned';
          user.moderation.shadowBanned = true;
          break;

        case 'unban':
        case 'reactivate':
          user.moderation.status = 'active';
          user.moderation.shadowBanned = false;
          user.moderation.suspensionEndDate = null;
          user.isActive = true;
          break;
      }

      await user.save();

      return {
        success: true,
        action,
        userStatus: user.moderation.status
      };

    } catch (error) {
      console.error('Error applying manual action:', error);
      throw error;
    }
  }

  /**
   * Get user moderation status
   */
  async getUserModerationStatus(userId) {
    try {
      const user = await User.findById(userId).select('moderation stats');
      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      let timeRemaining = null;

      if (user.moderation.status === 'suspended' && user.moderation.suspensionEndDate) {
        timeRemaining = Math.max(0, user.moderation.suspensionEndDate - now);
      }

      return {
        status: user.moderation.status,
        shadowBanned: user.moderation.shadowBanned,
        suspensionEndDate: user.moderation.suspensionEndDate,
        timeRemaining,
        totalViolations: user.stats.totalViolations,
        warningCount: user.stats.warningCount,
        suspensionCount: user.stats.suspensionCount,
        lastWarningDate: user.moderation.lastWarningDate,
        lastSuspensionDate: user.moderation.lastSuspensionDate,
        banReason: user.moderation.banReason
      };

    } catch (error) {
      console.error('Error getting user moderation status:', error);
      throw error;
    }
  }

  /**
   * Check if user is allowed to post content
   */
  async canUserPost(userId) {
    try {
      const user = await User.findById(userId).select('moderation isActive');
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      if (!user.isActive) {
        return { allowed: false, reason: 'Account is deactivated' };
      }

      if (user.moderation.status === 'banned') {
        return { allowed: false, reason: 'Account is permanently banned' };
      }

      if (user.moderation.status === 'suspended') {
        const now = new Date();
        if (user.moderation.suspensionEndDate && user.moderation.suspensionEndDate > now) {
          return {
            allowed: false,
            reason: 'Account is temporarily suspended',
            suspensionEndDate: user.moderation.suspensionEndDate
          };
        } else {
          // Suspension expired, reactivate
          user.moderation.status = 'active';
          user.isActive = true;
          user.moderation.suspensionEndDate = null;
          await user.save();
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking user posting permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }
}

module.exports = new ModerationService();
