// utils/validationUtils.js
const { REGEX_PATTERNS, FLAG_REASONS, SUPPORTED_PLATFORMS, USER_ROLES } = require('../config/constants');

class ValidationUtils {
  
  // Validate email format
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return REGEX_PATTERNS.EMAIL.test(email.trim().toLowerCase());
  }

  // Validate password strength
  static validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin123', 'letmein', 'welcome', 'monkey', 'dragon'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character diversity
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;
    if (/[^A-Za-z0-9@$!%*?&]/.test(password)) score += 1;

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Sequential patterns

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const level = Math.max(0, Math.min(levels.length - 1, Math.floor(score)));
    
    return {
      score: Math.max(0, score),
      level: levels[level],
      percentage: Math.min(100, Math.max(0, (score / 8) * 100))
    };
  }

  // Validate username
  static validateUsername(username) {
    const errors = [];
    
    if (!username || typeof username !== 'string') {
      errors.push('Username is required');
      return { isValid: false, errors };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (trimmed.length > 30) {
      errors.push('Username must not exceed 30 characters');
    }

    if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Check for reserved usernames
    const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'info', 'test', 'demo'];
    if (reserved.includes(trimmed.toLowerCase())) {
      errors.push('Username is reserved and cannot be used');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate UUID format
  static isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    return REGEX_PATTERNS.UUID.test(uuid);
  }

  // Validate URL format
  static isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    return REGEX_PATTERNS.URL.test(url);
  }

  // Validate report content
  static validateReportContent(content) {
    const errors = [];

    if (!content || typeof content !== 'string') {
      errors.push('Report content is required');
      return { isValid: false, errors };
    }

    const trimmed = content.trim();

    if (trimmed.length < 5) {
      errors.push('Report content must be at least 5 characters long');
    }

    if (trimmed.length > 5000) {
      errors.push('Report content must not exceed 5000 characters');
    }

    // Check for potentially malicious content
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        errors.push('Report content contains potentially malicious code');
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate flag reason
  static isValidFlagReason(reason) {
    if (!reason || typeof reason !== 'string') return false;
    return Object.values(FLAG_REASONS).some(fr => fr.code === reason);
  }

  // Validate platform
  static isValidPlatform(platform) {
    if (!platform || typeof platform !== 'string') return false;
    return Object.values(SUPPORTED_PLATFORMS).includes(platform);
  }

  // Validate user role
  static isValidUserRole(role) {
    if (!role || typeof role !== 'string') return false;
    return Object.values(USER_ROLES).includes(role);
  }

  // Validate pagination parameters
  static validatePagination(page, limit) {
    const errors = [];
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive number');
    }

    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive number');
    }

    if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
      page: Math.max(1, pageNum || 1),
      limit: Math.min(100, Math.max(1, limitNum || 20))
    };
  }

  // Validate date range
  static validateDateRange(startDate, endDate) {
    const errors = [];

    let start, end;

    try {
      start = startDate ? new Date(startDate) : null;
      end = endDate ? new Date(endDate) : null;
    } catch (error) {
      errors.push('Invalid date format');
      return { isValid: false, errors };
    }

    if (start && isNaN(start.getTime())) {
      errors.push('Invalid start date');
    }

    if (end && isNaN(end.getTime())) {
      errors.push('Invalid end date');
    }

    if (start && end && start >= end) {
      errors.push('Start date must be before end date');
    }

    // Check for reasonable date range (not more than 1 year)
    if (start && end) {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    }

    return { isValid: errors.length === 0, errors, startDate: start, endDate: end };
  }

  // Validate phone number (basic)
  static validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Validate file upload
  static validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    const errors = [];

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push(`File size cannot exceed ${this.formatFileSize(maxSize)}`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file name
    if (file.originalname && file.originalname.length > 255) {
      errors.push('File name is too long');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Format file size for display
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Sanitize HTML content
  static sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    
    // Basic HTML sanitization - remove dangerous tags and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  // Validate JSON structure
  static isValidJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Validate array of IDs
  static validateIdArray(ids, maxLength = 100) {
    const errors = [];

    if (!Array.isArray(ids)) {
      errors.push('IDs must be provided as an array');
      return { isValid: false, errors };
    }

    if (ids.length === 0) {
      errors.push('At least one ID is required');
    }

    if (ids.length > maxLength) {
      errors.push(`Cannot process more than ${maxLength} IDs at once`);
    }

    const invalidIds = ids.filter(id => !this.isValidObjectId(id));
    if (invalidIds.length > 0) {
      errors.push(`Invalid ID format: ${invalidIds.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate MongoDB ObjectId
  static isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Validate search query
  static validateSearchQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'string') {
      errors.push('Search query is required');
      return { isValid: false, errors };
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      errors.push('Search query must be at least 2 characters long');
    }

    if (trimmed.length > 100) {
      errors.push('Search query must not exceed 100 characters');
    }

    // Check for potentially malicious search patterns
    const maliciousPatterns = [
      /[\$\{\}]/g, // MongoDB injection patterns
      /<script/gi, // XSS patterns
      /union\s+select/gi // SQL injection patterns
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(query)) {
        errors.push('Search query contains invalid characters');
        break;
      }
    }

    return { isValid: errors.length === 0, errors, sanitized: trimmed };
  }

  // Validate timeframe parameter
  static validateTimeframe(timeframe) {
    if (!timeframe || typeof timeframe !== 'string') return false;
    
    const validFormats = [
      /^([1-9]\d*)(h|d|w|m|y)$/, // 1h, 7d, 2w, 3m, 1y
      /^(today|yesterday|week|month|year)$/ // Predefined periods
    ];

    return validFormats.some(format => format.test(timeframe));
  }

  // Comprehensive validation for user registration
  static validateUserRegistration(userData) {
    const errors = [];
    const { email, password, username, firstName, lastName } = userData;

    // Email validation
    if (!this.isValidEmail(email)) {
      errors.push('Valid email address is required');
    }

    // Password validation
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Username validation
    const usernameValidation = this.validateUsername(username);
    if (!usernameValidation.isValid) {
      errors.push(...usernameValidation.errors);
    }

    // Name validations
    if (!firstName || firstName.trim().length < 1) {
      errors.push('First name is required');
    } else if (firstName.trim().length > 50) {
      errors.push('First name must not exceed 50 characters');
    }

    if (!lastName || lastName.trim().length < 1) {
      errors.push('Last name is required');
    } else if (lastName.trim().length > 50) {
      errors.push('Last name must not exceed 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        email: email?.trim().toLowerCase(),
        username: username?.trim(),
        firstName: firstName?.trim(),
        lastName: lastName?.trim()
      }
    };
  }

  // Validate report creation data
  static validateReportCreation(reportData) {
    const errors = [];
    const { content, flagReason, platform, context, flaggedUserUuid } = reportData;

    // Content validation
    const contentValidation = this.validateReportContent(content);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
    }

    // Flag reason validation
    if (!this.isValidFlagReason(flagReason)) {
      errors.push('Valid flag reason is required');
    }

    // Platform validation
    if (!this.isValidPlatform(platform)) {
      errors.push('Valid platform is required');
    }

    // Optional UUID validation
    if (flaggedUserUuid && !this.isValidUUID(flaggedUserUuid)) {
      errors.push('Invalid flagged user UUID format');
    }

    // Context validation (optional)
    if (context && (typeof context !== 'string' || context.length > 1000)) {
      errors.push('Context must be a string and not exceed 1000 characters');
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = ValidationUtils;