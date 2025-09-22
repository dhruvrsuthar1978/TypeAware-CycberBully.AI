// ==========================================
// 📁 src/controllers/authController.js
// This handles user registration and login
// ==========================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create JWT token
const createToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }
    
    // Create new user
    const user = new User({
      email,
      password, // Will be automatically hashed by the User model
      username,
      role: role || 'user'
    });
    
    // Save user to database
    await user.save();
    
    // Create JWT token
    const token = createToken(user.getTokenData());
    
    // Send success response (don't send password back)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          extensionId: user.extensionId,
          createdAt: user.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token
    const token = createToken(user.getTokenData());
    
    // Send success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          extensionId: user.extensionId,
          lastLogin: user.lastLogin,
          stats: user.stats
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // req.user comes from auth middleware (we'll create this next)
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          extensionId: user.extensionId,
          profile: user.profile,
          settings: user.settings,
          stats: user.stats,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  getProfile
};