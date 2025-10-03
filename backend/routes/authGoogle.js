// routes/authGoogle.js - Google OAuth Implementation
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/google
// @desc    Google OAuth login/registration
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        error: 'OAuth Error',
        message: 'Email not provided by Google'
      });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { 'oauth.google.id': googleId }
      ]
    });

    if (user) {
      // Update existing user's Google info if needed
      if (!user.oauth?.google?.id) {
        user.oauth = {
          ...user.oauth,
          google: {
            id: googleId,
            email: email,
            name: name,
            picture: picture
          }
        };
        await user.save();
      }

      // Update last activity
      user.stats.lastActivity = new Date();
      await user.save();
    } else {
      // Create new user with Google OAuth
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + 
                      Math.floor(Math.random() * 1000);

      user = new User({
        email,
        username,
        password: 'oauth_' + Math.random().toString(36), // Random password (won't be used)
        role: 'user',
        oauth: {
          google: {
            id: googleId,
            email: email,
            name: name,
            picture: picture
          }
        },
        profile: {
          firstName: name?.split(' ')[0] || '',
          lastName: name?.split(' ').slice(1).join(' ') || '',
          avatar: picture
        }
      });

      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Google OAuth successful',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences,
        profile: user.profile,
        isNewUser: !user.oauth?.google?.id
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    
    if (error.message.includes('Invalid token')) {
      return res.status(401).json({
        error: 'OAuth Error',
        message: 'Invalid Google token'
      });
    }

    res.status(500).json({
      error: 'OAuth Failed',
      message: 'Unable to authenticate with Google'
    });
  }
});

// @route   POST /api/auth/google/link
// @desc    Link Google account to existing user
// @access  Private
router.post('/google/link', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.userId; // From auth middleware

    if (!token) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if Google account is already linked to another user
    const existingUser = await User.findOne({ 'oauth.google.id': googleId });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({
        error: 'Account Conflict',
        message: 'This Google account is already linked to another user'
      });
    }

    // Update current user with Google info
    const user = await User.findById(userId);
    user.oauth = {
      ...user.oauth,
      google: {
        id: googleId,
        email: email,
        name: name,
        picture: picture
      }
    };

    // Update profile if not set
    if (!user.profile.avatar) {
      user.profile.avatar = picture;
    }

    await user.save();

    res.json({
      message: 'Google account linked successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        oauth: user.oauth
      }
    });

  } catch (error) {
    console.error('Google link error:', error);
    res.status(500).json({
      error: 'Link Failed',
      message: 'Unable to link Google account'
    });
  }
});

// @route   DELETE /api/auth/google/unlink
// @desc    Unlink Google account from user
// @access  Private
router.delete('/google/unlink', async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user.oauth?.google?.id) {
      return res.status(400).json({
        error: 'Not Linked',
        message: 'No Google account linked to this user'
      });
    }

    // Remove Google OAuth info
    user.oauth.google = undefined;
    await user.save();

    res.json({
      message: 'Google account unlinked successfully'
    });

  } catch (error) {
    console.error('Google unlink error:', error);
    res.status(500).json({
      error: 'Unlink Failed',
      message: 'Unable to unlink Google account'
    });
  }
});

module.exports = router;