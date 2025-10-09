const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const { generateToken, generateRefreshToken } = require('../utils/tokenUtils');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
const { createResponse, createErrorResponse } = require('../utils/responseUtils');

class AuthController {

  // ✅ Register new user (Fixed)
  async register(req, res) {
    try {
      const { email, password, username } = req.body;

      // Basic validation
      if (!email || !password || !username) {
        return res.status(400).json(createErrorResponse(
          'Missing Fields',
          'Email, username, and password are required'
        ));
      }

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
        email: email.trim().toLowerCase(),
        password,
        username: username.trim(),
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

      // Duplicate key (MongoDB)
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json(createErrorResponse(
          'Duplicate Field',
          `${field} already exists`
        ));
      }

      // Validation issues
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

  // ✅ Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json(createErrorResponse(
          'Missing Fields',
          'Email and password are required'
        ));
      }

      const user = await authService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json(createErrorResponse(
          'Invalid Credentials',
          'Invalid email or password'
        ));
      }

      if (!user.isActive) {
        return res.status(401).json(createErrorResponse(
          'Account Inactive',
          'Your account has been deactivated'
        ));
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json(createErrorResponse(
          'Invalid Credentials',
          'Invalid email or password'
        ));
      }

      await authService.updateLastActivity(user._id);

      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
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
      res.status(500).json(createErrorResponse('Login Failed', 'Unable to login'));
    }
  }

  // ✅ Get current user profile
  async getProfile(req, res) {
    try {
      const user = await authService.findUserById(req.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse(
          'User Not Found',
          'User profile not found'
        ));
      }

      res.json(createResponse('Profile retrieved successfully', {
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
      }));
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(createErrorResponse('Profile Error', 'Unable to fetch profile'));
    }
  }

  // ✅ Refresh JWT token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json(createErrorResponse(
          'Token Required',
          'Refresh token is required'
        ));
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await authService.findUserById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json(createErrorResponse(
          'Invalid Token',
          'Refresh token is invalid'
        ));
      }

      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      await authService.updateRefreshToken(user._id, newRefreshToken);

      res.json(createResponse('Tokens refreshed successfully', {
        token: newToken,
        refreshToken: newRefreshToken
      }));

    } catch (error) {
      console.error('Refresh token error:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json(createErrorResponse(
          'Invalid Token',
          'Refresh token is invalid or expired'
        ));
      }

      res.status(500).json(createErrorResponse('Token Refresh Failed', 'Unable to refresh tokens'));
    }
  }

  // ✅ Logout user
  async logout(req, res) {
    try {
      await authService.clearRefreshToken(req.userId);
      res.json(createResponse('Logged out successfully', null));
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(createErrorResponse('Logout Failed', 'Unable to logout'));
    }
  }

  // ✅ Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await authService.findUserById(req.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User Not Found', 'User not found'));
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json(createErrorResponse('Invalid Password', 'Current password is incorrect'));
      }

      await authService.updatePassword(user._id, newPassword);
      await authService.clearRefreshToken(user._id);

      res.json(createResponse('Password changed successfully', {
        message: 'Please login again with your new password'
      }));

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json(createErrorResponse('Password Change Failed', 'Unable to change password'));
    }
  }

  // ✅ Link browser UUID
  async linkBrowser(req, res) {
    try {
      const { browserUUID, userAgent } = req.body;
      await authService.linkBrowserToUser(req.userId, browserUUID, userAgent);
      res.json(createResponse('Browser linked successfully', null));
    } catch (error) {
      console.error('Link browser error:', error);
      res.status(500).json(createErrorResponse('Link Browser Failed', 'Unable to link browser'));
    }
  }

  // ✅ Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json(createErrorResponse('Missing Field', 'Email is required'));
      }

      const user = await authService.findUserByEmail(email);
      if (!user) {
        return res.json(createResponse(
          'Reset email sent',
          'If an account with that email exists, a reset link has been sent'
        ));
      }

      const resetToken = await authService.generatePasswordResetToken(user._id);

      res.json(createResponse('Reset token generated', {
        message: 'Password reset token generated',
        resetToken
      }));

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json(createErrorResponse('Reset Failed', 'Unable to process password reset request'));
    }
  }

  // ✅ Reset password
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      const user = await authService.findUserByResetToken(resetToken);

      if (!user) {
        return res.status(400).json(createErrorResponse('Invalid Token', 'Password reset token is invalid or expired'));
      }

      await authService.resetPasswordWithToken(user._id, newPassword);
      res.json(createResponse('Password reset successful', 'Your password has been updated'));

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json(createErrorResponse('Reset Failed', 'Unable to reset password'));
    }
  }
}

module.exports = new AuthController();
