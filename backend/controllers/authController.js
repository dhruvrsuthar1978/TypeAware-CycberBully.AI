const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const { generateToken, generateRefreshToken } = require('../utils/tokenUtils');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
const { createResponse, createErrorResponse } = require('../utils/responseUtils');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, username } = req.body;

      // Check if user already exists
      const existingUser = await authService.findUserByEmailOrUsername(email, username);
      if (existingUser) {
        return res.status(400).json(createErrorResponse(
          'User Already Exists',
          existingUser.email === email ? 'Email already registered' : 'Username already taken'
        ));
      }

      // Create new user
      const userData = {
        email,
        password, // Will be hashed by the model pre-save hook
        username,
        role: 'user'
      };

      const user = await authService.createUser(userData);

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update user with refresh token
      await authService.updateRefreshToken(user._id, refreshToken);

      res.status(201).json(createResponse(
        'User registered successfully',
        {
          token,
          refreshToken,
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            stats: user.stats,
            preferences: user.preferences
          }
        }
      ));

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          messages.join(', ')
        ));
      }

      res.status(500).json(createErrorResponse(
        'Registration Failed',
        'Unable to create account'
      ));
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await authService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json(createErrorResponse(
          'Invalid Credentials',
          'Invalid email or password'
        ));
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json(createErrorResponse(
          'Account Inactive',
          'Your account has been deactivated'
        ));
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json(createErrorResponse(
          'Invalid Credentials',
          'Invalid email or password'
        ));
      }

      // Update last activity and login stats
      await authService.updateLastActivity(user._id);

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Update user with refresh token
      await authService.updateRefreshToken(user._id, refreshToken);

      res.json(createResponse(
        'Login successful',
        {
          token,
          refreshToken,
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            stats: user.stats,
            preferences: user.preferences,
            profile: user.profile
          }
        }
      ));

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(createErrorResponse(
        'Login Failed',
        'Unable to login'
      ));
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await authService.findUserById(req.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User profile not found'
        ));
      }

      res.json(createResponse(
        'Profile retrieved successfully',
        {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            stats: user.stats,
            preferences: user.preferences,
            profile: user.profile,
            oauth: user.oauth,
            browserUUIDs: user.browserUUIDs,
            createdAt: user.createdAt
          }
        }
      ));

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(createErrorResponse(
        'Profile Error',
        'Unable to fetch profile'
      ));
    }
  }

  // Refresh JWT token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json(createErrorResponse(
          'Token Required',
          'Refresh token is required'
        ));
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user and validate refresh token
      const user = await authService.findUserById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json(createErrorResponse(
          'Invalid Token',
          'Refresh token is invalid'
        ));
      }

      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      // Update user with new refresh token
      await authService.updateRefreshToken(user._id, newRefreshToken);

      res.json(createResponse(
        'Tokens refreshed successfully',
        {
          token: newToken,
          refreshToken: newRefreshToken
        }
      ));

    } catch (error) {
      console.error('Refresh token error:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json(createErrorResponse(
          'Invalid Token',
          'Refresh token is invalid or expired'
        ));
      }

      res.status(500).json(createErrorResponse(
        'Token Refresh Failed',
        'Unable to refresh tokens'
      ));
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      // Clear refresh token from database
      await authService.clearRefreshToken(req.userId);

      res.json(createResponse('Logged out successfully', null));
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(createErrorResponse(
        'Logout Failed',
        'Unable to logout'
      ));
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await authService.findUserById(req.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User not found'
        ));
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json(createErrorResponse(
          'Invalid Password',
          'Current password is incorrect'
        ));
      }

      // Update password
      await authService.updatePassword(user._id, newPassword);

      // Clear all refresh tokens (force re-login on all devices)
      await authService.clearRefreshToken(user._id);

      res.json(createResponse(
        'Password changed successfully',
        { message: 'Please login again with your new password' }
      ));

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json(createErrorResponse(
        'Password Change Failed',
        'Unable to change password'
      ));
    }
  }

  // Link browser UUID to user account
  async linkBrowser(req, res) {
    try {
      const { browserUUID, userAgent } = req.body;

      await authService.linkBrowserToUser(req.userId, browserUUID, userAgent);

      res.json(createResponse('Browser linked successfully', null));

    } catch (error) {
      console.error('Link browser error:', error);
      res.status(500).json(createErrorResponse(
        'Link Browser Failed',
        'Unable to link browser'
      ));
    }
  }

  // Forgot password - request reset
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await authService.findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json(createResponse(
          'Reset email sent',
          'If an account with that email exists, a reset link has been sent'
        ));
      }

      // Generate reset token
      const resetToken = await authService.generatePasswordResetToken(user._id);

      // In a real app, send email here
      // For demo purposes, we'll just return the token
      res.json(createResponse(
        'Reset token generated',
        { 
          message: 'Password reset token generated',
          resetToken: resetToken // Remove this in production!
        }
      ));

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json(createErrorResponse(
        'Reset Failed',
        'Unable to process password reset request'
      ));
    }
  }

  // Reset password with token
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;

      const user = await authService.findUserByResetToken(resetToken);
      if (!user) {
        return res.status(400).json(createErrorResponse(
          'Invalid Token',
          'Password reset token is invalid or expired'
        ));
      }

      // Update password and clear reset token
      await authService.resetPasswordWithToken(user._id, newPassword);

      res.json(createResponse(
        'Password reset successful',
        'Your password has been updated'
      ));

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json(createErrorResponse(
        'Reset Failed',
        'Unable to reset password'
      ));
    }
  }
}

module.exports = new AuthController();