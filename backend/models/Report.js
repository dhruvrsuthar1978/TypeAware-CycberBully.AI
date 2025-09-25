const mongoose = require('mongoose');

const flaggedTermSchema = new mongoose.Schema({
  term: String,
  positions: [Number], // Character positions where term appears
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
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  content: {
    original: {
      type: String,
      required: [true, 'Original content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters']
    },
    cleaned: {
      type: String,
      default: ''
    },
    flaggedTerms: {
      type: [flaggedTermSchema],
      default: []
    },
    wordCount: {
      type: Number,
      default: 0
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Severity must be low, medium, high, or critical'
      },
      default: 'medium'
    }
  },
  context: {
    platform: {
      type: String,
      enum: {
        values: ['twitter', 'youtube', 'reddit', 'facebook', 'instagram', 'tiktok', 'linkedin', 'other'],
        message: 'Platform must be one of the supported platforms'
      },
      required: [true, 'Platform is required']
    },
    url: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    pageTitle: {
      type: String,
      maxlength: [500, 'Page title cannot exceed 500 characters'],
      default: ''
    },
    elementType: {
      type: String,
      enum: ['comment', 'post', 'reply', 'message', 'bio', 'other'],
      default: 'other'
    }
  },
  classification: {
    category: {
      type: String,
      enum: {
        values: ['harassment', 'hate_speech', 'spam', 'bullying', 'threat', 'sexual_content', 'violence', 'discrimination', 'other'],
        message: 'Category must be one of the predefined types'
      },
      required: [true, 'Classification category is required']
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
      required: [true, 'Confidence score is required']
    },
    detectionMethod: {
      type: String,
      enum: {
        values: ['regex', 'nlp', 'fuzzy_match', 'user_report', 'ml_model'],
        message: 'Detection method must be one of the supported types'
      },
      required: [true, 'Detection method is required']
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'under_review', 'confirmed', 'false_positive', 'dismissed'],
      message: 'Status must be one of the predefined values'
    },
    default: 'pending'
  },
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['confirmed', 'false_positive', 'dismissed'],
      default: null
    },
    notes: {
      type: String,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
      default: ''
    }
  },
  metadata: {
    userAgent: {
      type: String,
      default: ''
    },
    ipHash: {
      type: String,
      default: ''
    }, // Hashed for privacy
    sessionId: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
reportSchema.index({ browserUUID: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ 'context.platform': 1 });
reportSchema.index({ 'classification.category': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

// Pre-save middleware
reportSchema.pre('save', function(next) {
  // Calculate word count safely
  if (typeof this.content?.original === 'string') {
    this.content.wordCount = this.content.original.trim().split(/\s+/).length;
  } else {
    this.content.wordCount = 0;
  }
  next();
});

// Static methods
reportSchema.statics.getRecentReports = function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email role')
    .populate('adminReview.reviewedBy', 'username email');
};

reportSchema.statics.getReportsByUser = function(userId, limit = 100) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

reportSchema.statics.getPendingReports = function(limit = 100) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Instance methods
reportSchema.methods.markAsReviewed = function(adminId, decision, notes = '') {
  this.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    decision,
    notes
  };

  // Update status based on decision
  if (['confirmed', 'false_positive', 'dismissed'].includes(decision)) {
    this.status = decision === 'confirmed' ? 'confirmed' : decision;
  }

  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);
