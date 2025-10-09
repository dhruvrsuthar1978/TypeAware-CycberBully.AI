const User = require('../models/User');
const Report = require('../models/Report');

class UserService {
  // Get user profile with all details
  async getUserProfile(userId) {
    try {
      return await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpiry');
    } catch (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const { username, preferences, profile } = updateData;
      
      // Check if username is being updated and if it's already taken
      if (username) {
        const existingUser = await User.findOne({ 
          username, 
          _id: { $ne: userId } 
        });

        if (existingUser) {
          throw new Error('Username already exists');
        }
      }

      const updateFields = {};
      
      if (username) updateFields.username = username;
      if (preferences) updateFields.preferences = { ...preferences };
      if (profile) updateFields.profile = { ...profile };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      return updatedUser;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  // Get comprehensive user statistics
  async getUserStatistics(userId) {
    try {
      const user = await User.findById(userId).select('stats createdAt');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get additional stats from reports
      const reportStats = await Report.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            confirmedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            falsePositives: {
              $sum: { $cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0] }
            },
            categoriesReported: { $addToSet: '$classification.category' },
            platformsUsed: { $addToSet: '$context.platform' },
            avgConfidence: { $avg: '$classification.confidence' },
            recentActivity: { $max: '$createdAt' }
          }
        }
      ]);

      const stats = reportStats.length > 0 ? reportStats[0] : {
        totalReports: 0,
        confirmedReports: 0,
        pendingReports: 0,
        falsePositives: 0,
        categoriesReported: [],
        platformsUsed: [],
        avgConfidence: 0,
        recentActivity: null
      };

      // Get severity breakdown
      const severityStats = await Report.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: '$content.severity',
            count: { $sum: 1 }
          }
        }
      ]);

      const severityBreakdown = severityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        ...user.stats.toObject(),
        ...stats,
        categoriesCount: stats.categoriesReported.length,
        platformsCount: stats.platformsUsed.length,
        severityBreakdown,
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
        accuracyRate: stats.totalReports > 0 
          ? ((stats.confirmedReports / stats.totalReports) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      throw new Error(`Error getting user statistics: ${error.message}`);
    }
  }

  // Get user's reports with filtering
  async getUserReports(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status, category } = options;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { userId };
      if (status) filter.status = status;
      if (category) filter['classification.category'] = category;

      const [reports, total] = await Promise.all([
        Report.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('adminReview.reviewedBy', 'username')
          .lean(),
        Report.countDocuments(filter)
      ]);

      return { reports, total };
    } catch (error) {
      throw new Error(`Error fetching user reports: ${error.message}`);
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            preferences: {
              ...preferences
            }
          }
        },
        { new: true, runValidators: true }
      ).select('preferences');

      return updatedUser;
    } catch (error) {
      throw new Error(`Error updating user preferences: ${error.message}`);
    }
  }

  // Get user activity over time
  async getUserActivity(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Daily activity
      const dailyActivity = await Report.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            reports: { $sum: 1 },
            categories: { $addToSet: '$classification.category' },
            avgConfidence: { $avg: '$classification.confidence' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Platform activity
      const platformActivity = await Report.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$context.platform',
            count: { $sum: 1 },
            categories: { $addToSet: '$classification.category' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        dailyActivity,
        platformActivity,
        dateRange: {
          start: startDate,
          end: new Date(),
          days
        }
      };
    } catch (error) {
      throw new Error(`Error getting user activity: ${error.message}`);
    }
  }

  // Export all user data (GDPR compliance)
  async exportUserData(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -refreshToken -passwordResetToken -passwordResetExpiry')
        .lean();

      if (!user) {
        throw new Error('User not found');
      }

      const reports = await Report.find({ userId })
        .populate('adminReview.reviewedBy', 'username')
        .lean();

      return {
        user,
        reports,
        exportedAt: new Date().toISOString(),
        totalReports: reports.length
      };
    } catch (error) {
      throw new Error(`Error exporting user data: ${error.message}`);
    }
  }

  // Deactivate user account
  async deactivateAccount(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          deactivatedAt: new Date(),
          refreshToken: undefined // Clear refresh tokens
        },
        { new: true }
      );

      return user;
    } catch (error) {
      throw new Error(`Error deactivating account: ${error.message}`);
    }
  }

  // Get user's browser devices
  async getUserBrowserDevices(userId) {
    try {
      const user = await User.findById(userId).select('browserUUIDs').lean();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Enrich browser data with recent activity
      const devicesWithActivity = await Promise.all(
        user.browserUUIDs.map(async (device) => {
          const recentReports = await Report.countDocuments({
            browserUUID: device.uuid,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          });

          return {
            ...device,
            recentReports,
            deviceInfo: this.parseUserAgent(device.userAgent)
          };
        })
      );

      return devicesWithActivity;
    } catch (error) {
      throw new Error(`Error getting browser devices: ${error.message}`);
    }
  }

  // Remove browser device
  async removeBrowserDevice(userId, deviceId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      user.browserUUIDs = user.browserUUIDs.filter(
        device => device._id.toString() !== deviceId
      );

      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error removing browser device: ${error.message}`);
    }
  }

  // Update security settings
  async updateSecuritySettings(userId, settings) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            'securitySettings': {
              ...settings
            }
          }
        },
        { new: true, runValidators: true }
      ).select('securitySettings');

      return updatedUser;
    } catch (error) {
      throw new Error(`Error updating security settings: ${error.message}`);
    }
  }

  // Get user notifications (placeholder - would integrate with notification system)
  async getUserNotifications(userId, options = {}) {
    try {
      // Placeholder implementation
      // In a real app, this would fetch from a Notifications collection
      const { page = 1, limit = 20, unreadOnly = false } = options;
      
      // For now, return empty results
      return {
        notifications: [],
        total: 0
      };
    } catch (error) {
      throw new Error(`Error getting user notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      // Placeholder implementation
      return true;
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      // Placeholder implementation
      return 0;
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  // Get dashboard summary
  async getDashboardSummary(userId) {
    try {
      const [userStats, recentReports, activityData] = await Promise.all([
        this.getUserStatistics(userId),
        this.getUserReports(userId, { limit: 5 }),
        this.getUserActivity(userId, 7) // Last 7 days
      ]);

      return {
        stats: userStats,
        recentReports: recentReports.reports,
        recentActivity: activityData.dailyActivity,
        summary: {
          totalReports: userStats.totalReports,
          confirmedReports: userStats.confirmedReports,
          pendingReports: userStats.pendingReports,
          accuracyRate: userStats.accuracyRate,
          categoriesCount: userStats.categoriesCount,
          platformsCount: userStats.platformsCount
        }
      };
    } catch (error) {
      throw new Error(`Error getting dashboard summary: ${error.message}`);
    }
  }

  // Update user avatar
  async updateUserAvatar(userId, avatar) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            'profile.avatar': avatar
          }
        },
        { new: true, runValidators: true }
      ).select('profile');

      return updatedUser;
    } catch (error) {
      throw new Error(`Error updating avatar: ${error.message}`);
    }
  }

  // Get contribution statistics
  async getContributionStatistics(userId) {
    try {
      const stats = await Report.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalContributions: { $sum: 1 },
            confirmedContributions: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            helpfulReports: {
              $sum: { $cond: [{ $eq: ['$userFeedback.isHelpful', true] }, 1, 0] }
            },
            platformsHelped: { $addToSet: '$context.platform' },
            categoriesHelped: { $addToSet: '$classification.category' }
          }
        }
      ]);

      const contribution = stats.length > 0 ? stats[0] : {
        totalContributions: 0,
        confirmedContributions: 0,
        helpfulReports: 0,
        platformsHelped: [],
        categoriesHelped: []
      };

      // Calculate contribution score
      const contributionScore = this.calculateContributionScore(contribution);

      return {
        ...contribution,
        contributionScore,
        badge: this.getContributionBadge(contributionScore),
        platformsCount: contribution.platformsHelped.length,
        categoriesCount: contribution.categoriesHelped.length
      };
    } catch (error) {
      throw new Error(`Error getting contribution statistics: ${error.message}`);
    }
  }

  // Helper methods

  // Parse user agent string for device info
  parseUserAgent(userAgent) {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };

    // Simple user agent parsing (in production, use a proper library)
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { browser, os };
  }

  // Calculate contribution score
  calculateContributionScore(contribution) {
    const {
      totalContributions,
      confirmedContributions,
      helpfulReports,
      platformsHelped,
      categoriesHelped
    } = contribution;

    let score = 0;
    score += totalContributions * 1; // 1 point per report
    score += confirmedContributions * 2; // 2 extra points for confirmed reports
    score += helpfulReports * 1; // 1 extra point for helpful reports
    score += platformsHelped.length * 5; // 5 points per platform
    score += categoriesHelped.length * 3; // 3 points per category

    return Math.min(score, 1000); // Cap at 1000 points
  }

  // Get contribution badge based on score
  getContributionBadge(score) {
    if (score >= 500) return { name: 'Expert Contributor', color: 'gold' };
    if (score >= 200) return { name: 'Advanced Contributor', color: 'silver' };
    if (score >= 50) return { name: 'Active Contributor', color: 'bronze' };
    if (score >= 10) return { name: 'Contributor', color: 'blue' };
    return { name: 'New Contributor', color: 'green' };
  }
}

module.exports = new UserService();