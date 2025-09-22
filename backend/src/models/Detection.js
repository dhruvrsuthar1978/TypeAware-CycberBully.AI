// ==========================================
// 📁 src/models/Detection.js
// This stores what the browser extension detected automatically
// ==========================================

const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  
  // Which user's extension detected this
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // What was detected
  originalContent: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  cleanedContent: {
    type: String, // Content after removing obfuscation (l33t speak, symbols)
    maxlength: 2000
  },
  
  // Detection results
  detection: {
    // What type of abuse was detected
    type: {
      type: String,
      enum: ['toxicity', 'profanity', 'hate-speech', 'harassment', 'spam', 'threat'],
      required: true
    },
    
    // How confident the detection was (0.0 to 1.0)
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    
    // Which detection method found it
    method: {
      type: String,
      enum: ['regex', 'fuzzy-matching', 'nlp', 'user-pattern'],
      required: true
    },
    
    // Specific pattern or rule that matched
    matchedPattern: String,
    
    // Was the content obfuscated? (like f@ck, f u c k)
    obfuscated: {
      type: Boolean,
      default: false
    },
    
    obfuscationType: {
      type: String,
      enum: ['leetspeak', 'spacing', 'symbols', 'mixed'],
      default: null
    }
  },
  
  // Where it was detected
  context: {
    platform: {
      type: String,
      required: true // twitter, facebook, youtube, reddit, etc.
    },
    
    url: String, // Page URL where detected
    
    elementType: {
      type: String,
      enum: ['comment', 'post', 'reply', 'message', 'bio'],
      default: 'comment'
    }
  },
  
  // User action taken
  userAction: {
    type: String,
    enum: ['ignored', 'warned', 'reported', 'blocked'],
    default: 'warned'
  },
  
  // Was this a false positive?
  feedback: {
    falsePositive: {
      type: Boolean,
      default: false
    },
    userFeedback: String, // User can explain why it was wrong
    feedbackDate: Date
  },
  
  // Extension metadata
  extensionData: {
    version: String,
    userAgent: String,
    language: { type: String, default: 'en' },
    timezone: String
  }
  
}, {
  timestamps: true,
  collection: 'detections'
});

// Indexes for analytics and performance
detectionSchema.index({ userId: 1, createdAt: -1 });
detectionSchema.index({ 'detection.type': 1 });
detectionSchema.index({ 'detection.confidence': -1 });
detectionSchema.index({ 'context.platform': 1 });
detectionSchema.index({ userAction: 1 });
detectionSchema.index({ 'feedback.falsePositive': 1 });

// Virtual for detection accuracy
detectionSchema.virtual('isAccurate').get(function() {
  return !this.feedback.falsePositive;
});

// Method to mark as false positive
detectionSchema.methods.markFalsePositive = function(userFeedback = '') {
  this.feedback.falsePositive = true;
  this.feedback.userFeedback = userFeedback;
  this.feedback.feedbackDate = new Date();
  return this.save();
};

// Static method to get detection stats for a user
detectionSchema.statics.getStatsForUser = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalDetections: { $sum: 1 },
        averageConfidence: { $avg: '$detection.confidence' },
        detectionTypes: { $push: '$detection.type' },
        platforms: { $push: '$context.platform' },
        falsePositives: {
          $sum: {
            $cond: ['$feedback.falsePositive', 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDetections: 0,
    averageConfidence: 0,
    detectionTypes: [],
    platforms: [],
    falsePositives: 0
  };
};

module.exports = mongoose.model('Detection', detectionSchema);