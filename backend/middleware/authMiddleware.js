// middleware/authMiddleware.js
const jwtConfig = require('../config/jwt'); // your singleton JWTConfig instance

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

    // Attach decoded payload to req.user for downstream handlers
    req.user = verification.decoded;
    console.log('Middleware Success: Token verified for user:', verification.decoded.userId || verification.decoded.id);
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
  