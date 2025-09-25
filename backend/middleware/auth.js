const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header and verifies it
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Inactive',
        message: 'Your account has been deactivated'
      });
    }
    
    // Attach user info to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token is malformed'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Please login again'
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({
      error: 'Authentication Error',
      message: 'Failed to authenticate token'
    });
  }
};

/**
 * Middleware to require admin role
 * Must be used after authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please authenticate first'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Forbidden',
      message: 'Admin privileges required'
    });
  }
  
  next();
};

/**
 * Middleware to require user role (standard user or admin)
 * Must be used after authenticateToken
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please authenticate first'
    });
  }
  
  if (!['user', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Access Forbidden',
      message: 'User privileges required'
    });
  }
  
  next();
};

/**
 * Middleware to optionally authenticate token
 * If token is provided, validates it, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
};

/**
 * Middleware to validate browser UUID
 * Used for endpoints that accept reports from browser extensions
 */
const validateBrowserUUID = (req, res, next) => {
  const { browserUUID } = req.body;
  
  if (!browserUUID) {
    return res.status(400).json({
      error: 'Missing Browser UUID',
      message: 'browserUUID is required for this operation'
    });
  }
  
  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(browserUUID)) {
    return res.status(400).json({
      error: 'Invalid Browser UUID',
      message: 'browserUUID must be a valid UUID format'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  optionalAuth,
  validateBrowserUUID
};