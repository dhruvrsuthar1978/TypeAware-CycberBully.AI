// middleware/adminMiddleware.js
const jwtConfig = require('../config/jwt');

// Middleware to check if user has admin privileges
function requireAdmin(req, res, next) {
  console.log('--- ADMIN MIDDLEWARE INITIATED ---');

  // Check if user is authenticated and has admin role
  if (!req.user) {
    console.error('Admin Middleware Error: No user found in request. Authentication middleware must be applied first.');
    return res.status(401).json({
      error: 'Not Authorized: Authentication Required',
      message: 'You must be authenticated to access admin routes.'
    });
  }

  // Check if user has admin role
  if (!req.user.role || req.user.role !== 'admin') {
    console.error('Admin Middleware Error: User does not have admin privileges:', req.user.userId || req.user.id);
    return res.status(403).json({
      error: 'Forbidden: Admin Access Required',
      message: 'You do not have permission to access admin resources.'
    });
  }

  console.log('Admin Middleware Success: Admin access granted for user:', req.user.userId || req.user.id);
  return next();
}

module.exports = requireAdmin;
