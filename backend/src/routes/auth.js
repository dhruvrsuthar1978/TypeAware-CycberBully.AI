// ==========================================
// 📁 src/routes/auth.js
// These are the API endpoints for authentication
// ==========================================

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (anyone can access)
router.post('/register', async (req, res) => {
  // Basic validation
  const { email, password, username } = req.body;
  
  // Check if all required fields are provided
  if (!email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, and username'
    });
  }
  
  // Check password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  // Call the register controller
  await register(req, res);
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public (anyone can access)
router.post('/login', async (req, res) => {
  // Basic validation
  const { email, password } = req.body;
  
  // Check if all required fields are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }
  
  // Call the login controller
  await login(req, res);
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private (need to be logged in)
router.get('/profile', auth, async (req, res) => {
  await getProfile(req, res);
});

// @route   GET /api/auth/verify
// @desc    Verify if token is still valid
// @access  Private (need to be logged in)
router.get('/verify', auth, (req, res) => {
  // If we reach here, the auth middleware passed
  // So token is valid
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user.userId,
      role: req.user.role,
      extensionId: req.user.extensionId
    }
  });
});

module.exports = router;