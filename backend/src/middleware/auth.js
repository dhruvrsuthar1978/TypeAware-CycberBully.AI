// ==========================================
// 📁 src/middleware/auth.js
// This checks if user is logged in (has valid token)
// ==========================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if user has valid login token
const auth = async (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.header('Authorization');
    
    // Check if token exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Extract token (remove 'Bearer ' part)
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user account deactivated.'
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      extensionId: decoded.extensionId
    };
    
    // Continue to next middleware/controller
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle different types of token errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Check if user is admin (runs after auth middleware)
const adminAuth = async (req, res, next) => {
  try {
    // Check if user role is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Continue to next middleware/controller
    next();
    
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed.'
    });
  }
};

// Export both middlewares
module.exports = { auth, adminAuth };