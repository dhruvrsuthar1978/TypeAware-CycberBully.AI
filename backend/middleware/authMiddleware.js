// middleware/authMiddleware.js
const jwtConfig = require('../config/jwt'); // your singleton JWTConfig instance
const User = require('../models/User');

// This middleware verifies JWTs using the jwtConfig helper
async function protect(req, res, next) {
  console.log('--- CUSTOM PROTECT MIDDLEWARE INITIATED ---');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Middleware Error: No "Bearer" token found in Authorization header.');
    return res.status(401).json({
      error: 'Not Authorized: Missing Token',
      message: 'No token was provided in the Authorization header or it was malformed.'
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('Middleware Info: Extracted Token:', token?.substring(0, 40) + '...');

  // Use jwtConfig to verify the access token (ensures consistent secret/options)
  try {
    const verification = jwtConfig.verifyAccessToken(token);

    if (!verification.valid) {
      console.error('Middleware Error: Token verification failed:', verification.error);
      return res.status(401).json({
        error: 'Not Authorized: Token Invalid',
        message: `Token verification failed: ${verification.error || 'invalid token'}`
      });
    }

    const decoded = verification.decoded || {};

    // Attach decoded payload and normalized identifiers
    req.user = decoded;
    req.userId = decoded.userId || decoded.id || decoded._id;

    // Hydrate user role/email if not present in token
    if (!req.user?.role || !req.user?.email) {
      try {
        if (req.userId) {
          const dbUser = await User.findById(req.userId).select('role email username');
          if (dbUser) {
            req.user = {
              ...decoded,
              role: dbUser.role,
              email: dbUser.email,
              username: dbUser.username,
            };
          }
        }
      } catch (hydrateErr) {
        console.warn('Auth hydrate warning:', hydrateErr.message);
      }
    }

    console.log('Middleware Success: Token verified for user:', req.userId);
    return next();
  } catch (err) {
    console.error('--- CUSTOM PROTECT MIDDLEWARE FAILED ---', err);
    return res.status(401).json({
      error: 'Not Authorized: Token Invalid',
      message: `CUSTOM AUTH MIDDLEWARE FAILED: ${err.name || 'Error'} - ${err.message || err}`
    });
  }
}

module.exports = protect;
  