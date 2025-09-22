// ==========================================
// 📁 src/models/Report.js
// This stores user reports from the browser extension
// ==========================================

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  
  // Who made the report
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report details
  content: {
    type: String,
    required: true,
    maxlength: 1000 // Limit content length for storage
  },
  
  reason: {
    type: String,
    required: true,
    enum: ['hate-speech', 'harassment', 'spam', 'bullying', 'other']
  },
  
  // Where the content was found
  platform: {
    type: String,
    required: true // e.g., 'twitter', 'facebook', 'youtube', 'reddit'
  },
  
  url: {
    type: String,
    required: true // URL where the content was found
  },
  
  // Target information (who was being abusive)
  targetUser: {
    username: String, // Username of the abusive user (if available)
    profileUrl: String // Link to their profile (if available)
  },
  
  // Detection information
  detectionMethod: {
    type: String,
    enum: ['user-report', 'ai-detection', 'manual-flag'],
    default: 'user-report'
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Report status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Admin review (for Level 3)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  reviewedAt: Date,
  reviewNotes: String,
  
  // Metadata
  metadata: {
    userAgent: String, // Browser info
    extensionVersion: String,
    timestamp: { type: Date, default: Date.now }
  }
  
}, {
  timestamps: true,
  collection: 'reports'
});

// Indexes for better performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ platform: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reason: 1 });
reportSchema.index({ severity: 1 });

// Virtual for formatted date
reportSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to mark as reviewed
reportSchema.methods.markAsReviewed = function(adminId, notes = '') {
  this.status = 'reviewed';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);