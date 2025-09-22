// ==========================================
// 📁 src/models/Block.js
// This tracks users blocked by the browser extension
// ==========================================

const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  
  // Who did the blocking (TypeAware user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Information about the blocked user
  blockedUser: {
    // Platform username of blocked user
    username: {
      type: String,
      required: true
    },
    
    // Platform where they were blocked
    platform: {
      type: String,
      required: true // twitter, facebook, youtube, reddit, etc.
    },
    
    // Profile URL if available
    profileUrl: String,
    
    // Display name if different from username
    displayName: String,
    
    // User's profile picture URL
    avatar: String
  },
  
  // Why they were blocked
  blockReason: {
    // Primary reason for block
    reason: {
      type: String,
      enum: ['automatic', 'manual-report', 'multiple-violations', 'severe-content'],
      required: true
    },
    
    // How many violations before block
    violationCount: {
      type: Number,
      default: 1,
      min: 1
    },
    
    // What type of violations
    violationTypes: [{
      type: String,
      enum: ['toxicity', 'profanity', 'hate-speech', 'harassment', 'spam', 'threat']
    }],
    
    // Specific content that triggered block
    triggerContent: {
      type: String,
      maxlength: 500
    }
  },
  
  // Block details
  blockStatus: {
    // Is block currently active?
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Type of block
    blockType: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'temporary'
    },
    
    // When block expires (for temporary blocks)
    expiresAt: Date,
    
    // Block duration in minutes
    duration: {
      type: Number,
      default: 10 // 10 minutes default
    }
  },
  
  // Block actions
  actions: {
    // Hide their content
    hideContent: {
      type: Boolean,
      default: true
    },
    
    // Disable reply/interaction
    disableInteraction: {
      type: Boolean,
      default: true
    },
    
    // Show warning when viewing their profile
    showWarning: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  stats: {
    // How many times this user was blocked
    blockCount: {
      type: Number,
      default: 1
    },
    
    // Last time they posted abusive content
    lastViolation: {
      type: Date,
      default: Date.now
    },
    
    // URLs where violations occurred
    violationUrls: [String]
  },
  
  // Block history
  history: [{
    action: {
      type: String,
      enum: ['blocked', 'unblocked', 'extended', 'reported']
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: String,
    duration: Number // in minutes
  }],
  
  // Extension metadata
  metadata: {
    extensionVersion: String,
    userAgent: String,
    autoBlocked: {
      type: Boolean,
      default: true
    }
  }
  
}, {
  timestamps: true,
  collection: 'blocks'
});

// Indexes for performance
blockSchema.index({ userId: 1, createdAt: -1 });
blockSchema.index({ 'blockedUser.platform': 1, 'blockedUser.username': 1 });
blockSchema.index({ 'blockStatus.isActive': 1 });
blockSchema.index({ 'blockStatus.expiresAt': 1 });
blockSchema.index({ 'blockReason.reason': 1 });

// Check if block has expired
blockSchema.virtual('isExpired').get(function() {
  if (this.blockStatus.blockType === 'permanent') return false;
  if (!this.blockStatus.expiresAt) return false;
  return new Date() > this.blockStatus.expiresAt;
});

// Calculate when block expires
blockSchema.pre('save', function(next) {
  if (this.blockStatus.blockType === 'temporary' && this.blockStatus.duration) {
    this.blockStatus.expiresAt = new Date(Date.now() + (this.blockStatus.duration * 60 * 1000));
  }
  next();
});

// Method to extend block duration
blockSchema.methods.extendBlock = function(additionalMinutes = 10) {
  this.blockStatus.duration += additionalMinutes;
  this.blockStatus.expiresAt = new Date(Date.now() + (this.blockStatus.duration * 60 * 1000));
  
  this.history.push({
    action: 'extended',
    reason: `Extended by ${additionalMinutes} minutes`,
    duration: additionalMinutes
  });
  
  return this.save();
};

// Method to unblock user
blockSchema.methods.unblock = function(reason = 'Manual unblock') {
  this.blockStatus.isActive = false;
  this.blockStatus.expiresAt = new Date();
  
  this.history.push({
    action: 'unblocked',
    reason: reason
  });
  
  return this.save();
};

// Method to add violation
blockSchema.methods.addViolation = function(content, type, url) {
  this.blockReason.violationCount += 1;
  this.blockReason.violationTypes.push(type);
  this.stats.lastViolation = new Date();
  
  if (url && !this.stats.violationUrls.includes(url)) {
    this.stats.violationUrls.push(url);
  }
  
  if (content) {
    this.blockReason.triggerContent = content.substring(0, 500);
  }
  
  return this.save();
};

// Static method to get active blocks for user
blockSchema.statics.getActiveBlocksForUser = async function(userId) {
  return this.find({
    userId: userId,
    'blockStatus.isActive': true,
    $or: [
      { 'blockStatus.blockType': 'permanent' },
      { 'blockStatus.expiresAt': { $gt: new Date() } }
    ]
  });
};

// Static method to clean expired blocks
blockSchema.statics.cleanExpiredBlocks = async function() {
  const result = await this.updateMany(
    {
      'blockStatus.blockType': 'temporary',
      'blockStatus.expiresAt': { $lt: new Date() },
      'blockStatus.isActive': true
    },
    {
      $set: { 'blockStatus.isActive': false }
    }
  );
  
  console.log(`Cleaned ${result.modifiedCount} expired blocks`);
  return result;
};

module.exports = mongoose.model('Block', blockSchema);