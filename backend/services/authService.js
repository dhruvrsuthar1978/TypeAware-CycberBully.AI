const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthService {
  // Find user by email
  async findUserByEmail(email) {
    try {
      return await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('+password');
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by ID
  async findUserById(userId) {
    try {
      return await User.findById(userId).select('-password');
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Find user by email or username
  async findUserByEmailOrUsername(email, username) {
    try {
      return await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username }
        ]
      });
    } catch (error) {
      throw new Error(`Error finding user by email or username: ${error.message}`);
    }
  }

  // Find user by browser UUID
  async findUserByBrowserUUID(browserUUID) {
    try {
      return await User.findOne({
        'browserUUIDs.uuid': browserUUID,
        'browserUUIDs.isActive': true
      });
    } catch (error) {
      throw new Error(`Error finding user by browser UUID: ${error.message}`);
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Update user's last activity
  async updateLastActivity(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { 
          'stats.lastActivity': new Date(),
          $inc: { 'stats.totalScans': 1 }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating last activity: ${error.message}`);
    }
  }

  // Update refresh token
  async updateRefreshToken(userId, refreshToken) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { refreshToken: refreshToken },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating refresh token: ${error.message}`);
    }
  }

  // Clear refresh token
  async clearRefreshToken(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: 1 } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error clearing refresh token: ${error.message}`);
    }
  }

  // Update password
  async updatePassword(userId, newPassword) {
    try {
      const user = await User.findById(userId);
      user.password = newPassword; // Will be hashed by pre-save hook
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  // Link browser UUID to user
  async linkBrowserToUser(userId, browserUUID, userAgent = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.addBrowserUUID(browserUUID, userAgent);
      return user;
    } catch (error) {
      throw new Error(`Error linking browser to user: ${error.message}`);
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(userId) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await User.findByIdAndUpdate(userId, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry
      });

      return resetToken;
    } catch (error) {
      throw new Error(`Error generating reset token: ${error.message}`);
    }
  }

  // Find user by reset token
  async findUserByResetToken(resetToken) {
    try {
      return await User.findOne({
        passwordResetToken: resetToken,
        passwordResetExpiry: { $gt: Date.now() },
        isActive: true
      });
    } catch (error) {
      throw new Error(`Error finding user by reset token: ${error.message}`);
    }
  }

  // Reset password with token
  async resetPasswordWithToken(userId, newPassword) {
    try {
      const user = await User.findById(userId);
      user.password = newPassword; // Will be hashed by pre-save hook
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      user.refreshToken = undefined; // Clear refresh tokens
      
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error resetting password: ${error.message}`);
    }
  }

  // Update user stats
  async updateUserStats(userId, statsUpdate) {
    try {
      const updateQuery = {};
      
      if (statsUpdate.totalReports) {
        updateQuery['$inc'] = updateQuery['$inc'] || {};
        updateQuery['$inc']['stats.totalReports'] = statsUpdate.totalReports;
      }
      
      if (statsUpdate.totalScans) {
        updateQuery['$inc'] = updateQuery['$inc'] || {};
        updateQuery['$inc']['stats.totalScans'] = statsUpdate.totalScans;
      }
      
      if (statsUpdate.threatsDetected) {
        updateQuery['$inc'] = updateQuery['$inc'] || {};
        updateQuery['$inc']['stats.threatsDetected'] = statsUpdate.threatsDetected;
      }

      updateQuery['$set'] = { 'stats.lastActivity': new Date() };

      return await User.findByIdAndUpdate(userId, updateQuery, { new: true });
    } catch (error) {
      throw new Error(`Error updating user stats: ${error.message}`);
    }
  }

  // Get user statistics
  async getUserStatistics(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get additional stats from reports if needed
      // This could be extended to calculate real-time stats from Report collection
      
      return {
        totalReports: user.stats.totalReports || 0,
        totalScans: user.stats.totalScans || 0,
        threatsDetected: user.stats.threatsDetected || 0,
        lastActivity: user.stats.lastActivity,
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
        linkedBrowsers: user.browserUUIDs?.length || 0
      };
    } catch (error) {
      throw new Error(`Error getting user statistics: ${error.message}`);
    }
  }

  // Validate user access
  async validateUserAccess(userId, requiredRole = null) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      if (requiredRole && user.role !== requiredRole) {
        throw new Error(`User does not have required role: ${requiredRole}`);
      }

      return user;
    } catch (error) {
      throw new Error(`Access validation failed: ${error.message}`);
    }
  }

  // Deactivate user account
  async deactivateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          refreshToken: undefined // Clear refresh tokens
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  // Activate user account
  async activateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isActive: true },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error activating user: ${error.message}`);
    }
  }

  // Get active users count
  async getActiveUsersCount(timeframe = 24) {
    try {
      const startTime = new Date(Date.now() - (timeframe * 60 * 60 * 1000));
      
      return await User.countDocuments({
        'stats.lastActivity': { $gte: startTime },
        isActive: true
      });
    } catch (error) {
      throw new Error(`Error getting active users count: ${error.message}`);
    }
  }

  // Get user registration stats
  async getRegistrationStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await User.aggregate([
        {
          $match: {
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
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Error getting registration stats: ${error.message}`);
    }
  }
}

module.exports = new AuthService();