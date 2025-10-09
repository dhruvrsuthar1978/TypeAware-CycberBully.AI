const express = require('express');
const User = require('../models/User');
const adminMiddleware = require('../middleware/adminMiddleware');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/admin/create-user
// @desc    Create admin user programmatically (for testing)
// @access  Public (only for testing purposes)
router.post('/create-user', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, firstName, and lastName are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'User Already Exists',
        message: 'User with this email already exists'
      });
    }

    // Create admin user (password will be hashed by User model pre-save middleware)
    const username = `${firstName.trim()}_${lastName.trim()}`.toLowerCase();
    const adminUser = new User({
      username: username,
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin',
      moderation: { status: 'active' },
      emailVerified: true,
      isActive: true
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({
      error: 'Creation Failed',
      message: 'Unable to create admin user'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/users', protect, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Unable to fetch users'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin)
router.get('/stats', protect, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ status: 'active' });

    res.json({
      stats: {
        totalUsers,
        adminUsers,
        activeUsers,
        regularUsers: totalUsers - adminUsers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Stats Failed',
      message: 'Unable to fetch statistics'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reports (admin only)
// @access  Private (Admin)
router.get('/reports', protect, adminMiddleware, async (req, res) => {
  try {
    const Report = require('../models/Report');
    const reports = await Report.find().populate('userId', 'email firstName lastName').sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Unable to fetch reports'
    });
  }
});

module.exports = router;
