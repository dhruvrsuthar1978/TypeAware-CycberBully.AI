// ==========================================
// 📁 src/models/Analytics.js
// This stores pre-calculated analytics data for fast admin dashboard
// ==========================================

const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  
  // Time period for this analytics snapshot
  period: {
    type: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  },
  
  // Detection analytics
  detections: {
    total: { type: Number, default: 0 },
    
    // By type
    byType: {
      toxicity: { type: Number, default: 0 },
      profanity: { type: Number, default: 0 },
      harassment: { type: Number, default: 0 },
      hateSpeak: { type: Number, default: 0 },
      spam: { type: Number, default: 0 },
      threat: { type: Number, default: 0 }
    },
    
    // By platform
    byPlatform: {
      twitter: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      youtube: { type: Number, default: 0 },
      reddit: { type: Number, default: 0 },
      instagram: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // By detection method
    byMethod: {
      regex: { type: Number, default: 0 },
      fuzzyMatching: { type: Number, default: 0 },
      nlp: { type: Number, default: 0 },
      userPattern: { type: Number, default: 0 }
    },
    
    // Accuracy metrics
    accuracy: {
      totalFeedback: { type: Number, default: 0 },
      falsePositives: { type: Number, default: 0 },
      truePositives: { type: Number, default: 0 },
      accuracyRate: { type: Number, default: 0 }
    },
    
    // Confidence distribution
    confidence: {
      high: { type: Number, default: 0 }, // > 0.8
      medium: { type: Number, default: 0 }, // 0.5 - 0.8
      low: { type: Number, default: 0 } // < 0.5
    }
  },
  
  // Report analytics
  reports: {
    total: { type: Number, default: 0 },
    
    // By reason
    byReason: {
      hateSpeech: { type: Number, default: 0 },
      harassment: { type: Number, default: 0 },
      spam: { type: Number, default: 0 },
      bullying: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // By status
    byStatus: {
      pending: { type: Number, default: 0 },
      reviewed: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
      dismissed: { type: Number, default: 0 }
    },
    
    // By severity
    bySeverity: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 }
    },
    
    // Response times (in hours)
    responseTimes: {
      average: { type: Number, default: 0 },
      median: { type: Number, default: 0 },
      under24h: { type: Number, default: 0 },
      over24h: { type: Number, default: 0 }
    }
  },
  
  // Block analytics
  blocks: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    expired: { type: Number, default: 0 },
    
    // By type
    byType: {
      automatic: { type: Number, default: 0 },
      manual: { type: Number, default: 0 },
      temporary: { type: Number, default: 0 },
      permanent: { type: Number, default: 0 }
    },
    
    // By platform
    byPlatform: {
      twitter: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      youtube: { type: Number, default: 0 },
      reddit: { type: Number, default: 0 },
      instagram: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // Effectiveness
    effectiveness: {
      repeatOffenders: { type: Number, default: 0 },
      blocksLifted: { type: Number, default: 0 },
      appealedBlocks: { type: Number, default: 0 }
    }
  },
  
  // User analytics
  users: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 }, // Users with activity this period
    new: { type: Number, default: 0 }, // New registrations this period
    
    // User behavior
    behavior: {
      reporters: { type: Number, default: 0 }, // Users who made reports
      reportedUsers: { type: Number, default: 0 }, // Users who were reported
      blockedUsers: { type: Number, default: 0 }, // Users who are blocked
      cleanUsers: { type: Number, default: 0 } // Users with no violations
    },
    
    // Extension usage
    extension: {
      usersWithExtension: { type: Number, default: 0 },
      activeExtensions: { type: Number, default: 0 },
      extensionVersion: {
        v1: { type: Number, default: 0 },
        v2: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      }
    }
  },
  
  // System performance
  system: {
    responseTime: {
      average: { type: Number, default: 0 }, // Average API response time
      p95: { type: Number, default: 0 }, // 95th percentile
      p99: { type: Number, default: 0 } // 99th percentile
    },
    
    errors: {
      total: { type: Number, default: 0 },
      server5xx: { type: Number, default: 0 },
      client4xx: { type: Number, default: 0 },
      database: { type: Number, default: 0 }
    },
    
    usage: {
      apiCalls: { type: Number, default: 0 },
      extensionCalls: { type: Number, default: 0 },
      webAppCalls: { type: Number, default: 0 }
    }
  },
  
  // Top problematic content/users (for admin attention)
  insights: {
    topReportedUsers: [{
      username: String,
      platform: String,
      reportCount: Number,
      violationTypes: [String]
    }],
    
    commonPatterns: [{
      pattern: String,
      frequency: Number,
      platforms: [String]
    }],
    
    emergingThreats: [{
      type: String,
      description: String,
      frequency: Number,
      trend: String // 'rising', 'stable', 'declining'
    }]
  }
  
}, {
  timestamps: true,
  collection: 'analytics'
});

// Indexes for fast queries
analyticsSchema.index({ 'period.type': 1, 'period.date': -1 });
analyticsSchema.index({ 'period.date': -1 });
analyticsSchema.index({ createdAt: -1 });

// Virtual for period identifier
analyticsSchema.virtual('periodId').get(function() {
  const date = this.period.date;
  switch(this.period.type) {
    case 'hourly':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    case 'daily':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    case 'weekly':
      const week = Math.ceil(date.getDate() / 7);
      return `${date.getFullYear()}-${date.getMonth()}-W${week}`;
    case 'monthly':
      return `${date.getFullYear()}-${date.getMonth()}`;
    default:
      return date.toISOString();
  }
});

// Static method to get analytics for date range
analyticsSchema.statics.getAnalyticsRange = async function(startDate, endDate, periodType = 'daily') {
  return this.find({
    'period.type': periodType,
    'period.date': {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ 'period.date': 1 });
};

// Static method to get latest analytics
analyticsSchema.statics.getLatest = async function(periodType = 'daily', limit = 30) {
  return this.find({ 'period.type': periodType })
    .sort({ 'period.date': -1 })
    .limit(limit);
};

// Method to calculate trends
analyticsSchema.methods.calculateTrends = function(previousPeriod) {
  const trends = {};
  
  // Calculate percentage change for key metrics
  const metrics = [
    'detections.total',
    'reports.total', 
    'blocks.total',
    'users.active'
  ];
  
  metrics.forEach(metric => {
    const current = this.get(metric) || 0;
    const previous = previousPeriod ? previousPeriod.get(metric) || 0 : 0;
    
    if (previous === 0) {
      trends[metric] = current > 0 ? 100 : 0;
    } else {
      trends[metric] = Math.round(((current - previous) / previous) * 100);
    }
  });
  
  return trends;
};

module.exports = mongoose.model('Analytics', analyticsSchema);