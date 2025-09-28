// config/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTConfig {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    this.issuer = process.env.JWT_ISSUER || 'typeaware-api';
    this.audience = process.env.JWT_AUDIENCE || 'typeaware-users';
  }

  // Generate a cryptographically secure secret
  generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Get JWT configuration options
  getAccessTokenOptions() {
    return {
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: this.accessTokenExpiry,
      algorithm: 'HS256'
    };
  }

  getRefreshTokenOptions() {
    return {
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: this.refreshTokenExpiry,
      algorithm: 'HS256'
    };
  }

  // Generate access token
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, this.getAccessTokenOptions());
    } catch (error) {
      console.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, this.getRefreshTokenOptions());
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  // Generate both access and refresh tokens
  generateTokenPair(payload) {
    const sanitizedPayload = this.sanitizePayload(payload);
    
    return {
      accessToken: this.generateAccessToken(sanitizedPayload),
      refreshToken: this.generateRefreshToken(sanitizedPayload),
      expiresIn: this.parseExpiry(this.accessTokenExpiry),
      tokenType: 'Bearer'
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      return {
        valid: false,
        decoded: null,
        expired: error.name === 'TokenExpiredError',
        error: error.message
      };
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      return {
        valid: false,
        decoded: null,
        expired: error.name === 'TokenExpiredError',
        error: error.message
      };
    }
  }

  // Decode token without verification (for expired tokens)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  // Refresh access token using refresh token
  refreshAccessToken(refreshToken) {
    try {
      const verification = this.verifyRefreshToken(refreshToken);
      
      if (!verification.valid) {
        throw new Error('Invalid refresh token');
      }

      const { decoded } = verification;
      
      // Create new payload without JWT-specific fields
      const newPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        uuid: decoded.uuid
      };

      return this.generateAccessToken(newPayload);
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Sanitize payload to remove sensitive information
  sanitizePayload(payload) {
    const sanitized = { ...payload };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.__v;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    
    // Ensure required fields exist
    if (!sanitized.userId && sanitized._id) {
      sanitized.userId = sanitized._id.toString();
      delete sanitized._id;
    }

    return sanitized;
  }

  // Parse expiry string to seconds
  parseExpiry(expiry) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 60);
  }

  // Generate API key for extension
  generateApiKey(payload) {
    try {
      const apiKeyPayload = {
        ...payload,
        type: 'api_key',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(apiKeyPayload, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: 'typeaware-extension',
        expiresIn: '1y', // API keys last longer
        algorithm: 'HS256'
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  // Verify API key
  verifyApiKey(apiKey) {
    try {
      const decoded = jwt.verify(apiKey, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: 'typeaware-extension',
        algorithms: ['HS256']
      });

      if (decoded.type !== 'api_key') {
        throw new Error('Invalid API key type');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      return {
        valid: false,
        decoded: null,
        expired: error.name === 'TokenExpiredError',
        error: error.message
      };
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
  }

  // Get token expiration time
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.payload && decoded.payload.exp) {
        return new Date(decoded.payload.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Check if token will expire soon
  isTokenExpiringSoon(token, bufferMinutes = 5) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    const bufferTime = bufferMinutes * 60 * 1000;
    return (expiration.getTime() - Date.now()) < bufferTime;
  }

  // Blacklist token (in production, store in Redis or database)
  blacklistToken(token) {
    // For now, just decode to get expiry
    const decoded = this.decodeToken(token);
    if (!decoded) return false;

    // In production implementation:
    // - Store token ID in Redis with TTL
    // - Or store in database blacklist table
    console.log(`Token blacklisted: ${decoded.payload.jti || 'no-jti'}`);
    return true;
  }

  // Generate secure random token ID
  generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Validate JWT configuration
  validateConfiguration() {
    const issues = [];

    if (!this.accessTokenSecret || this.accessTokenSecret.length < 32) {
      issues.push('Access token secret is too short (minimum 32 characters)');
    }

    if (!this.refreshTokenSecret || this.refreshTokenSecret.length < 32) {
      issues.push('Refresh token secret is too short (minimum 32 characters)');
    }

    if (this.accessTokenSecret === this.refreshTokenSecret) {
      issues.push('Access and refresh token secrets should be different');
    }

    const accessExpiry = this.parseExpiry(this.accessTokenExpiry);
    const refreshExpiry = this.parseExpiry(this.refreshTokenExpiry);

    if (accessExpiry >= refreshExpiry) {
      issues.push('Refresh token expiry should be longer than access token expiry');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
module.exports = new JWTConfig();