const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

const router = express.Router();

// @route   POST /api/admin/login
// @desc    Login admin user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Find user by email and role admin
    const user = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Admin login successful',
      token,
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
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: 'Unable to login'
    });
  }
});

module.exports = router;
