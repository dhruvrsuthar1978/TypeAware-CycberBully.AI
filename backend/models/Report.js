const mongoose = require('mongoose');

// This is a sub-schema, which doesn't get its own _id by default.
const flaggedTermSchema = new mongoose.Schema({
  term: String,
  positions: [Number], // Character positions where the term appears
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  browserUUID: {
    type: String,
    required: [true, 'Browser UUID is required'],
    // index: true <-- REMOVED this to prevent duplicate index warning
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
    // index: true <-- REMOVED this to prevent duplicate index warning
  },
  content: {
    original: {
      type: String,
      required: [true, 'Original content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters']
    },
    flaggedTerms: {
      type: [flaggedTermSchema],
      default: []
    },
    wordCount: { type: Number, default: 0 },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  context: {
    platform: {
      type: String,
      enum: ['twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other'],
      required: [true, 'Platform is required']
    },
    url: { type: String, default: '' },
    elementType: {
      type: String,
      enum: ['comment', 'post', 'reply', 'message', 'bio', 'other'],
      default: 'other'
    }
  },
  classification: {
    category: {
      type: String,
      enum: ['harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other'],
      required: [true, 'Classification category is required']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: [true, 'Confidence score is required']
    },
    detectionMethod: {
      type: String,
      enum: ['regex', 'nlp', 'fuzzy_match', 'user_report', 'ml_model'],
      required: [true, 'Detection method is required']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'confirmed', 'false_positive', 'dismissed'],
    default: 'pending'
  },
  adminReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: Date,
    decision: { type: String, enum: ['confirmed', 'false_positive', 'dismissed', null], default: null },
    notes: { type: String, maxlength: 1000, default: '' }
  },
  metadata: {
    userAgent: { type: String, default: '' },
    // This is the custom timestamp field from the error log
    timestamp: { type: Date, default: Date.now }
  }
}, {
  // This option automatically adds createdAt and updatedAt fields and indexes them.
  timestamps: true
});

// --- INDEXES ---
// All indexes are now managed here for clarity and to prevent conflicts.
reportSchema.index({ browserUUID: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ 'context.platform': 1 });
reportSchema.index({ 'classification.category': 1 });
reportSchema.index({ status: 1, createdAt: -1 }); // Compound index for querying pending reports
reportSchema.index({ 'metadata.timestamp': -1 }); // Added to address the "timestamp" warning

// --- MIDDLEWARE ---
// A pre-save hook to automatically calculate the word count.
reportSchema.pre('save', function(next) {
  if (this.isModified('content.original') && typeof this.content.original === 'string') {
    this.content.wordCount = this.content.original.trim().split(/\s+/).length;
  }
  next();
});

// --- STATIC METHODS ---
// Methods available on the Report model itself.

/**
 * Gets the most recent reports, populated with user details.
 * @param {number} limit The maximum number of reports to return.
 * @returns {Promise<Array>} A promise that resolves to an array of reports.
 */
reportSchema.statics.getRecentReports = function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email role')
    .populate('adminReview.reviewedBy', 'username');
};

/**
 * Gets all reports that are currently pending review.
 * @param {number} limit The maximum number of reports to return.
 * @returns {Promise<Array>} A promise that resolves to an array of pending reports.
 */
reportSchema.statics.getPendingReports = function(limit = 100) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};


// --- INSTANCE METHODS ---
// Methods available on individual report documents.

/**
 * Marks a report as reviewed by an administrator.
 * @param {string} adminId The MongoDB ObjectId of the admin user.
 * @param {string} decision The review decision ('confirmed', 'false_positive', 'dismissed').
 * @param {string} notes Optional notes from the administrator.
 * @returns {Promise<Report>} The updated report document.
 */
reportSchema.methods.markAsReviewed = function(adminId, decision, notes = '') {
  this.status = decision;
  this.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    decision,

    notes
  };
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);
