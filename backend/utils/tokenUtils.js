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
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'typeaware-api',
      audience: 'typeaware-client'
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
    process.env.REFRESH_TOKEN_SECRET,
    { 
      expiresIn: '30d', // Refresh tokens last longer
      issuer: 'typeaware-api',
      audience: 'typeaware-client'
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
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'typeaware-api',
      audience: 'typeaware-client'
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
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
      issuer: 'typeaware-api',
      audience: 'typeaware-client'
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
    process.env.JWT_SECRET,
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
 * @returns {object} Decoded token payload
 */
const verifyApiKey = (apiKey) => {
  try {
    return jwt.verify(apiKey, process.env.JWT_SECRET, {
      issuer: 'typeaware-api',
      audience: 'typeaware-external'
    });
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
  verifyApiKey
};
