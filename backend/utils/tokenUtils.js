const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT access token
 * @param {string} userId - User ID to encode in token
 * @param {object} additionalPayload - Additional data to include in token
 * @returns {string} JWT token
 */
const generateToken = (userId, additionalPayload = {}) => {
  const payload = {
    userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    ...additionalPayload
  };

  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '7d',
      issuer: process.env.JWT_ISSUER || 'typeaware-api',
      audience: process.env.JWT_AUDIENCE || 'typeaware-users'
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID to encode in token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID() // Unique token ID
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '30d', // Refresh tokens last longer
      issuer: 'typeaware-api',
      audience: 'typeaware-users'
    }
  );
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: process.env.JWT_ISSUER || 'typeaware-api',
      audience: process.env.JWT_AUDIENCE || 'typeaware-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - Refresh token to verify
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: process.env.JWT_ISSUER || 'typeaware-api',
      audience: process.env.JWT_AUDIENCE || 'typeaware-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Generate API key for external integrations
 * @param {string} userId - User ID
 * @param {string} scope - API key scope/permissions
 * @returns {string} API key
 */
const generateApiKey = (userId, scope = 'read') => {
  const payload = {
    userId,
    type: 'api_key',
    scope,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { 
      expiresIn: '1y', // API keys last 1 year
      issuer: 'typeaware-api',
      audience: 'typeaware-external'
    }
  );
};

/**
 * Verify API key
 * @param {string} apiKey - API key to verify
 * @returns {object} Decoded API key payload
 */
const verifyApiKey = (apiKey) => {
  try {
    const decoded = jwt.verify(apiKey, process.env.JWT_ACCESS_SECRET, {
      issuer: 'typeaware-api',
      audience: 'typeaware-external'
    });

    if (decoded.type !== 'api_key') {
      throw new Error('Invalid API key type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('API key has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid API key');
    } else {
      throw new Error('API key verification failed');
    }
  }
};

/**
 * Generate temporary token for password reset, email verification, etc.
 * @param {string} userId - User ID
 * @param {string} purpose - Token purpose ('password_reset', 'email_verify', etc.)
 * @param {string} expiresIn - Token expiration time
 * @returns {string} Temporary token
 */
const generateTemporaryToken = (userId, purpose, expiresIn = '1h') => {
  const payload = {
    userId,
    type: 'temporary',
    purpose,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID()
  };

  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { 
      expiresIn,
      issuer: 'typeaware-api',
      audience: 'typeaware-temp'
    }
  );
};

/**
 * Verify temporary token
 * @param {string} token - Temporary token to verify
 * @param {string} expectedPurpose - Expected token purpose
 * @returns {object} Decoded token payload
 */
const verifyTemporaryToken = (token, expectedPurpose) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'typeaware-api',
      audience: 'typeaware-temp'
    });

    if (decoded.type !== 'temporary') {
      throw new Error('Invalid token type');
    }

    if (decoded.purpose !== expectedPurpose) {
      throw new Error('Token purpose mismatch');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Generate secure random token (non-JWT)
 * @param {number} length - Token length in bytes
 * @returns {string} Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token for storage (one-way)
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Get time until token expires
 * @param {string} token - JWT token
 * @returns {number|null} Seconds until expiration, null if expired or invalid
 */
const getTimeUntilExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    
    return timeLeft > 0 ? timeLeft : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token needs refresh (expires within threshold)
 * @param {string} token - JWT token to check
 * @param {number} thresholdHours - Hours before expiration to consider refresh needed
 * @returns {boolean} True if token should be refreshed
 */
const needsRefresh = (token, thresholdHours = 24) => {
  const timeLeft = getTimeUntilExpiration(token);
  if (!timeLeft) {
    return true; // Already expired or invalid
  }

  const thresholdSeconds = thresholdHours * 60 * 60;
  return timeLeft < thresholdSeconds;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  generateApiKey,
  verifyApiKey,
  generateTemporaryToken,
  verifyTemporaryToken,
  generateSecureToken,
  hashToken,
  getTimeUntilExpiration,
  needsRefresh
};