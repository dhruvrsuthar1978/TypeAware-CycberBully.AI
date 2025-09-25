const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes are protected by authenticateToken middleware
// Applied in server.js: app.use('/api/user', authenticateToken, userRoutes);

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences,
        browserUUIDs: user.browserUUIDs,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile Error',
      message: 'Unable to fetch profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { username, preferences } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Update username if provided
    if (username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'Username Taken',
          message: 'Username is already taken'
        });
      }

      user.username = username;
    }

    // Update preferences if provided
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Update Failed',
      message: 'Unable to update profile'
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Get additional stats from reports
    const reportStats = await Report.aggregate([
      { $match: { userId: req.userId } },
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
          categoriesReported: { $addToSet: '$classification.category' }
        }
      }
    ]);

    const stats = reportStats.length > 0 ? reportStats[0] : {
      totalReports: 0,
      confirmedReports: 0,
      pendingReports: 0,
      categoriesReported: []
    };

    res.json({
      stats: {
        ...user.stats,
        ...stats,
        categoriesCount: stats.categoriesReported.length
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Stats Error',
      message: 'Unable to fetch statistics'
    });
  }
});

// @route   GET /api/user/reports
// @desc    Get user's report history
// @access  Private
router.get('/reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminReview.reviewedBy', 'username');

    const totalReports = await Report.countDocuments({ userId: req.userId });
    const totalPages = Math.ceil(totalReports / limit);

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages,
        totalReports,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Reports Error',
      message: 'Unable to fetch reports'
    });
  }
});

// @route   GET /api/user/reports/:reportId
// @desc    Get specific report details
// @access  Private
router.get('/reports/:reportId', async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.reportId,
      userId: req.userId
    }).populate('adminReview.reviewedBy', 'username email');

    if (!report) {
      return res.status(404).json({
        error: 'Report Not Found',
        message: 'Report not found or you do not have access to it'
      });
    }

    res.json({ report });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Report Error',
      message: 'Unable to fetch report'
    });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', async (req, res) => {
  try {
    const { darkMode, notifications, emailUpdates, language } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Update only provided preferences
    const updates = {};
    if (typeof darkMode === 'boolean') updates.darkMode = darkMode;
    if (typeof notifications === 'boolean') updates.notifications = notifications;
    if (typeof emailUpdates === 'boolean') updates.emailUpdates = emailUpdates;
    if (language) updates.language = language;

    user.preferences = {
      ...user.preferences,
      ...updates
    };

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'Unable to update preferences'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account (deactivate)
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid Password',
        message: 'Password is incorrect'
      });
    }

    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save();

    res.json({
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Delete Failed',
      message: 'Unable to delete account'
    });
  }
});

module.exports = router;