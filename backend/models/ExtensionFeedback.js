// models/ExtensionFeedback.js
const mongoose = require('mongoose');

const extensionFeedbackSchema = new mongoose.Schema({
  // Extension identification
  extensionId: {
    type: String,
    required: true,
    index: true
  },

  // User identification
  userUuid: {
    type: String,
    index: true
  },

  // Version information
  version: {
    type: String,
    required: true,
    index: true
  },

  // Feedback details
  feedbackType: {
    type: String,
    required: true,
    enum: [
      'bug_report',
      'feature_request',
      'improvement_suggestion',
      'usability_feedback',
      'performance_feedback',
      'general_feedback',
      'complaint',
      'compliment',
      'question',
      'installation_feedback',
      'uninstall_feedback'
    ],
    index: true
  },

  message: {
    type: String,
    required: true,
    maxlength: 5000
  },

  // Rating and sentiment
  rating: {
    type: Number,
    min: 1,
    max: 5,
    index: true
  },

  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    index: true
  },

  // Categorization
  category: {
    type: String,
    enum: [
      'detection_accuracy',
      'user_interface',
      'performance',
      'compatibility',
      'installation',
      'configuration',
      'reporting',
      'notifications',
      'privacy',
      'documentation',
      'support',
      'other'
    ],
    index: true
  },

  tags: [{ type: String }],

  // Priority and impact
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  impact: {
    type: String,
    enum: ['none', 'minor', 'moderate', 'major', 'blocking'],
    default: 'minor'
  },

  // Additional context
  context: {
    platform: { type: String },
    url: { type: String },
    feature: { type: String },
    userAction: { type: String },
    errorEncountered: { type: Boolean, default: false }
  },

  // Browser and system information
  browserInfo: {
    name: { type: String },
    version: { type: String },
    userAgent: { type: String },
    os: { type: String },
    language: { type: String }
  },

  // Attachments and additional data
  attachments: [{
    type: { type: String, enum: ['screenshot', 'log', 'video', 'other'] },
    filename: { type: String },
    url: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],

  additionalData: {
    type: mongoose.Schema.Types.Mixed
  },

  // Status and processing
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'pending',
    index: true
  },

  // Response and resolution
  response: {
    message: { type: String },
    respondedBy: { type: String },
    respondedAt: { type: Date }
  },

  resolution: {
    type: String,
    enum: [
      'fixed',
      'implemented',
      'duplicate',
      'not_reproducible',
      'by_design',
      'wont_fix',
      'need_more_info',
      'user_error'
    ]
  },

  resolvedAt: { type: Date },
  resolvedBy: { type: String },

  // Follow-up information
  followUp: {
    required: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    outcome: { type: String }
  },

  // Internal tracking
  assignedTo: { type: String },
  ticketId: { type: String },
  internalNotes: [{ 
    note: { type: String },
    addedBy: { type: String },
    addedAt: { type: Date, default: Date.now }
  }],

  // Analytics and sentiment analysis
  analytics: {
    sentiment: {
      score: { type: Number, min: -1, max: 1 },
      confidence: { type: Number, min: 0, max: 1 },
      keywords: [{ type: String }]
    },
    classification: {
      automatic: { type: Boolean, default: false },
      confidence: { type: Number },
      suggestedCategory: { type: String },
      suggestedPriority: { type: String }
    }
  },

  // Network information
  ip: {
    type: String,
    index: true
  },

  // Timestamps
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // User satisfaction tracking
  userSatisfaction: {
    satisfied: { type: Boolean },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    satisfactionFeedback: { type: String },
    ratedAt: { type: Date }
  },

  // Metadata
  isPublic: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 } // Number of users who found this feedback helpful
}, {
  timestamps: true,
  collection: 'extension_feedback'
});

// Indexes for performance
extensionFeedbackSchema.index({ extensionId: 1, submittedAt: -1 });
extensionFeedbackSchema.index({ userUuid: 1, submittedAt: -1 });
extensionFeedbackSchema.index({ feedbackType: 1, status: 1 });
extensionFeedbackSchema.index({ category: 1, priority: 1 });
extensionFeedbackSchema.index({ rating: 1, submittedAt: -1 });
extensionFeedbackSchema.index({ status: 1, submittedAt: -1 });
extensionFeedbackSchema.index({ submittedAt: -1 });

// Virtual for feedback age
extensionFeedbackSchema.virtual('age').get(function() {
  return Date.now() - this.submittedAt.getTime();
});

// Virtual for human-readable feedback type
extensionFeedbackSchema.virtual('feedbackTypeLabel').get(function() {
  const labels = {
    'bug_report': 'Bug Report',
    'feature_request': 'Feature Request',
    'improvement_suggestion': 'Improvement Suggestion',
    'usability_feedback': 'Usability Feedback',
    'performance_feedback': 'Performance Feedback',
    'general_feedback': 'General Feedback',
    'complaint': 'Complaint',
    'compliment': 'Compliment',
    'question': 'Question',
    'installation_feedback': 'Installation Feedback',
    'uninstall_feedback': 'Uninstall Feedback'
  };
  
  return labels[this.feedbackType] || this.feedbackType;
});

// Virtual for response time
extensionFeedbackSchema.virtual('responseTime').get(function() {
  if (!this.response?.respondedAt) return null;
  return this.response.respondedAt.getTime() - this.submittedAt.getTime();
});

// Instance methods
extensionFeedbackSchema.methods = {
  // Respond to feedback
  async respond(responseMessage, respondedBy) {
    this.response = {
      message: responseMessage,
      respondedBy,
      respondedAt: new Date()
    };
    this.status = 'resolved';
    return await this.save();
  },

  // Add internal note
  addInternalNote(note, addedBy) {
    this.internalNotes.push({
      note,
      addedBy,
      addedAt: new Date()
    });
    return this.save();
  },

  // Assign feedback to team member
  assign(assignedTo) {
    this.assignedTo = assignedTo;
    this.status = 'reviewing';
    return this.save();
  },

  // Mark as resolved
  markResolved(resolution, resolvedBy) {
    this.resolution = resolution;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.status = 'resolved';
    return this.save();
  },

  // Update user satisfaction
  updateSatisfaction(satisfied, rating, feedback) {
    this.userSatisfaction = {
      satisfied,
      satisfactionRating: rating,
      satisfactionFeedback: feedback,
      ratedAt: new Date()
    };
    return this.save();
  },

  // Get feedback summary
  getSummary() {
    return {
      id: this._id,
      type: this.feedbackTypeLabel,
      message: this.message.substring(0, 200) + (this.message.length > 200 ? '...' : ''),
      rating: this.rating,
      category: this.category,
      status: this.status,
      submittedAt: this.submittedAt,
      responded: !!this.response?.respondedAt
    };
  },

  // Check if feedback is critical
  isCritical() {
    return this.priority === 'critical' || 
           (this.rating && this.rating <= 2) ||
           this.feedbackType === 'complaint';
  }
};

// Static methods
extensionFeedbackSchema.statics = {
  // Analyze feedback sentiment
  async analyzeSentiment(message) {
    // Simple keyword-based sentiment analysis
    // In production, use a proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'useless', 'broken', 'annoying'];
    
    const words = message.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    let sentiment = 'neutral';
    let score = 0;
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      score = Math.min(1, (positiveScore - negativeScore) / words.length);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      score = Math.max(-1, (negativeScore - positiveScore) / words.length * -1);
    }
    
    return {
      sentiment,
      score,
      confidence: Math.abs(score),
      keywords: [...positiveWords.filter(w => words.includes(w)), 
                 ...negativeWords.filter(w => words.includes(w))]
    };
  },

  // Auto-classify feedback
  async autoClassify(feedback) {
    const message = feedback.message.toLowerCase();
    let suggestedCategory = 'other';
    let suggestedPriority = 'medium';
    let confidence = 0.5;

    // Category classification based on keywords
    const categoryKeywords = {
      'detection_accuracy': ['detection', 'false positive', 'missed', 'accuracy', 'detect'],
      'user_interface': ['ui', 'interface', 'design', 'layout', 'button', 'menu'],
      'performance': ['slow', 'fast', 'performance', 'speed', 'lag', 'memory'],
      'compatibility': ['compatible', 'browser', 'website', 'platform', 'conflict'],
      'installation': ['install', 'setup', 'download', 'permission'],
      'configuration': ['setting', 'config', 'option', 'preference'],
      'reporting': ['report', 'submit', 'flag', 'send'],
      'notifications': ['notification', 'alert', 'popup', 'message'],
      'privacy': ['privacy', 'data', 'tracking', 'anonymous'],
      'documentation': ['help', 'guide', 'documentation', 'manual', 'instruction']
    };

    let maxMatches = 0;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => message.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        suggestedCategory = category;
        confidence = Math.min(0.9, matches / keywords.length);
      }
    }

    // Priority classification
    const highPriorityWords = ['critical', 'urgent', 'broken', 'crash', 'error', 'bug'];
    const lowPriorityWords = ['suggestion', 'nice', 'would be good', 'maybe'];

    if (highPriorityWords.some(word => message.includes(word))) {
      suggestedPriority = 'high';
      confidence += 0.2;
    } else if (lowPriorityWords.some(word => message.includes(word))) {
      suggestedPriority = 'low';
    }

    // Rating-based priority adjustment
    if (feedback.rating && feedback.rating <= 2) {
      suggestedPriority = 'high';
    } else if (feedback.rating && feedback.rating >= 4) {
      suggestedPriority = 'low';
    }

    return {
      automatic: true,
      confidence: Math.min(0.9, confidence),
      suggestedCategory,
      suggestedPriority
    };
  },

  // Get feedback statistics
  async getFeedbackStats(startDate, endDate, filters = {}) {
    const matchStage = {
      submittedAt: { $gte: startDate, $lte: endDate }
    };

    // Apply filters
    if (filters.extensionId) matchStage.extensionId = filters.extensionId;
    if (filters.version) matchStage.version = filters.version;
    if (filters.feedbackType) matchStage.feedbackType = filters.feedbackType;
    if (filters.category) matchStage.category = filters.category;

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: { $push: '$rating' },
          feedbackTypes: { $push: '$feedbackType' },
          categories: { $push: '$category' },
          sentiments: { $push: '$sentiment' },
          resolvedFeedback: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          criticalFeedback: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                '$response.respondedAt',
                { $subtract: ['$response.respondedAt', '$submittedAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          totalFeedback: 1,
          averageRating: { $round: ['$averageRating', 2] },
          ratingDistribution: 1,
          feedbackTypes: 1,
          categories: 1,
          sentiments: 1,
          resolvedFeedback: 1,
          criticalFeedback: 1,
          resolutionRate: {
            $cond: [
              { $eq: ['$totalFeedback', 0] },
              0,
              { $divide: ['$resolvedFeedback', '$totalFeedback'] }
            ]
          },
          avgResponseTime: { $divide: ['$avgResponseTime', 86400000] } // Convert to days
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        feedbackTypeDistribution: {},
        categoryDistribution: {},
        sentimentDistribution: {},
        resolutionRate: 0,
        avgResponseTime: 0
      };
    }

    const result = stats[0];
    result.ratingDistribution = this.createDistribution(result.ratingDistribution);
    result.feedbackTypeDistribution = this.createDistribution(result.feedbackTypes);
    result.categoryDistribution = this.createDistribution(result.categories);
    result.sentimentDistribution = this.createDistribution(result.sentiments);
    
    // Clean up
    delete result.feedbackTypes;
    delete result.categories;
    delete result.sentiments;

    return result;
  },

  // Get recent feedback
  async getRecentFeedback(limit = 20, filters = {}) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.feedbackType) query.feedbackType = filters.feedbackType;

    return await this.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .select('feedbackType message rating category status submittedAt response.respondedAt')
      .lean();
  },

  // Get feedback trends
  async getFeedbackTrends(startDate, endDate, groupBy = 'day') {
    const groupFormat = this.getDateGroupFormat(groupBy);
    
    return await this.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$submittedAt'
            }
          },
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          positiveFeedback: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] }
          },
          negativeFeedback: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] }
          },
          resolvedFeedback: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          totalFeedback: 1,
          averageRating: { $round: ['$averageRating', 2] },
          positiveFeedback: 1,
          negativeFeedback: 1,
          resolvedFeedback: 1,
          sentimentRatio: {
            $cond: [
              { $eq: ['$totalFeedback', 0] },
              0,
              { 
                $divide: [
                  { $subtract: ['$positiveFeedback', '$negativeFeedback'] },
                  '$totalFeedback'
                ]
              }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);
  },

  // Get top feature requests
  async getTopFeatureRequests(limit = 10) {
    return await this.aggregate([
      {
        $match: {
          feedbackType: 'feature_request',
          status: { $in: ['pending', 'reviewing'] }
        }
      },
      {
        $group: {
          _id: '$message',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          latestSubmission: { $max: '$submittedAt' },
          examples: { $push: { id: '$_id', userUuid: '$userUuid' } }
        }
      },
      {
        $project: {
          message: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 2] },
          latestSubmission: 1,
          popularity: { $multiply: ['$count', '$averageRating'] },
          examples: { $slice: ['$examples', 3] }
        }
      },
      { $sort: { popularity: -1 } },
      { $limit: limit }
    ]);
  },

  // Get user satisfaction metrics
  async getSatisfactionMetrics(filters = {}) {
    const matchStage = {};
    
    if (filters.startDate && filters.endDate) {
      matchStage.submittedAt = { $gte: filters.startDate, $lte: filters.endDate };
    }
    if (filters.extensionId) matchStage.extensionId = filters.extensionId;

    return await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalWithRating: { $sum: { $cond: ['$rating', 1, 0] } },
          averageRating: { $avg: '$rating' },
          satisfactionCount: {
            $sum: { $cond: ['$userSatisfaction.satisfied', 1, 0] }
          },
          satisfactionTotal: {
            $sum: { $cond: [{ $ne: ['$userSatisfaction.satisfied', null] }, 1, 0] }
          },
          nps: {
            $push: {
              $cond: [
                '$rating',
                {
                  $cond: [
                    { $gte: ['$rating', 4] },
                    'promoter',
                    { $cond: [{ $gte: ['$rating', 3] }, 'passive', 'detractor'] }
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          totalWithRating: 1,
          averageRating: { $round: ['$averageRating', 2] },
          satisfactionRate: {
            $cond: [
              { $eq: ['$satisfactionTotal', 0] },
              0,
              { $divide: ['$satisfactionCount', '$satisfactionTotal'] }
            ]
          },
          npsCategories: '$nps'
        }
      }
    ]);
  },

  // Create distribution object
  createDistribution(array) {
    return array.reduce((acc, item) => {
      if (item !== null && item !== undefined) {
        acc[item] = (acc[item] || 0) + 1;
      }
      return acc;
    }, {});
  },

  // Get date group format
  getDateGroupFormat(groupBy) {
    const formats = {
      'hour': '%Y-%m-%d-%H',
      'day': '%Y-%m-%d',
      'week': '%Y-%U',
      'month': '%Y-%m'
    };
    return formats[groupBy] || formats.day;
  },

  // Process feedback with AI/ML (placeholder)
  async processFeedbackWithAI(feedback) {
    // Analyze sentiment
    const sentimentAnalysis = await this.analyzeSentiment(feedback.message);
    
    // Auto-classify
    const classification = await this.autoClassify(feedback);
    
    // Update feedback with AI analysis
    feedback.sentiment = sentimentAnalysis.sentiment;
    feedback.analytics = {
      sentiment: sentimentAnalysis,
      classification
    };
    
    // Auto-assign category if confidence is high
    if (classification.confidence > 0.7) {
      feedback.category = classification.suggestedCategory;
      feedback.priority = classification.suggestedPriority;
    }
    
    return feedback;
  },

  // Bulk update feedback status
  async bulkUpdateStatus(feedbackIds, newStatus, updatedBy) {
    const result = await this.updateMany(
      { _id: { $in: feedbackIds } },
      { 
        status: newStatus,
        updatedAt: new Date()
      }
    );

    // Log the bulk update
    console.log(`📝 Bulk updated ${result.modifiedCount} feedback items to status: ${newStatus}`);
    
    return result;
  },

  // Generate feedback report
  async generateReport(startDate, endDate, format = 'summary') {
    const stats = await this.getFeedbackStats(startDate, endDate);
    const trends = await this.getFeedbackTrends(startDate, endDate);
    const topRequests = await this.getTopFeatureRequests();
    const satisfaction = await this.getSatisfactionMetrics({ startDate, endDate });

    const report = {
      period: {
        start: startDate,
        end: endDate,
        generatedAt: new Date()
      },
      summary: stats,
      trends,
      topFeatureRequests: topRequests,
      satisfaction: satisfaction[0] || {},
      recommendations: this.generateRecommendations(stats, trends)
    };

    if (format === 'detailed') {
      const recentFeedback = await this.getRecentFeedback(50);
      report.recentFeedback = recentFeedback;
    }

    return report;
  },

  // Generate recommendations based on feedback analysis
  generateRecommendations(stats, trends) {
    const recommendations = [];

    // Low rating alert
    if (stats.averageRating < 3.5) {
      recommendations.push({
        type: 'alert',
        priority: 'high',
        message: 'Average rating is below 3.5. Immediate attention required.',
        action: 'Review negative feedback and address common issues'
      });
    }

    // High negative sentiment
    const negativeRatio = stats.sentimentDistribution?.negative || 0;
    const total = stats.totalFeedback;
    if (total > 0 && (negativeRatio / total) > 0.4) {
      recommendations.push({
        type: 'concern',
        priority: 'medium',
        message: 'High proportion of negative feedback detected.',
        action: 'Analyze negative feedback patterns and implement improvements'
      });
    }

    // Low response rate
    if (stats.resolutionRate < 0.7) {
      recommendations.push({
        type: 'process',
        priority: 'medium',
        message: 'Feedback resolution rate is below 70%.',
        action: 'Improve feedback response workflow and assign more resources'
      });
    }

    return recommendations;
  }
};

// Pre-save middleware
extensionFeedbackSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Process with AI/ML for new feedback
    await this.constructor.processFeedbackWithAI(this);
  }
  
  next();
});

// Post-save middleware
extensionFeedbackSchema.post('save', function(doc) {
  if (doc.isNew && doc.isCritical()) {
    console.log(`🔔 Critical feedback received: ${doc.feedbackType} - Rating: ${doc.rating}`);
    // In production, trigger alerts/notifications
  }
});

const ExtensionFeedback = mongoose.model('ExtensionFeedback', extensionFeedbackSchema);

module.exports = ExtensionFeedback;