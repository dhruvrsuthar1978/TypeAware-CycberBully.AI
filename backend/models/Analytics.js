// models/Analytics.js
const mongoose = require('mongoose');

// Schema for storing aggregated analytics data
const analyticsSchema = new mongoose.Schema({
  // Time period this analytics record covers
  period: {
    type: String,
    required: true,
    enum: ['hour', 'day', 'week', 'month'],
    index: true
  },
  
  // Start and end time for this period
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  
  // Overall statistics
  totals: {
    reports: { type: Number, default: 0 },
    uniqueReporters: { type: Number, default: 0 },
    uniqueFlaggedUsers: { type: Number, default: 0 },
    platforms: { type: Number, default: 0 }
  },
  
  // Platform-wise breakdown
  platformStats: [{
    platform: { type: String, required: true },
    reportCount: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],
  
  // Flag reason breakdown
  flagReasonStats: [{
    reason: { type: String, required: true },
    count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  
  // Top flagged users (anonymous UUIDs)
  topFlaggedUsers: [{
    uuid: { type: String, required: true },
    reportCount: { type: Number, required: true },
    riskScore: { type: Number, default: 0 },
    platforms: [{ type: String }],
    lastReported: { type: Date }
  }],
  
  // Active reporters
  topReporters: [{
    uuid: { type: String, required: true },
    reportCount: { type: Number, required: true },
    accuracy: { type: Number, default: 0 }, // If we implement verification
    platforms: [{ type: String }],
    lastActive: { type: Date }
  }],
  
  // Trend data
  trends: {
    hourlyDistribution: [{
      hour: { type: Number, min: 0, max: 23 },
      count: { type: Number, default: 0 }
    }],
    
    dailyGrowth: { type: Number, default: 0 }, // Percentage change from previous period
    weeklyGrowth: { type: Number, default: 0 },
    monthlyGrowth: { type: Number, default: 0 }
  },
  
  // Quality metrics
  quality: {
    averageContentLength: { type: Number, default: 0 },
    duplicateReports: { type: Number, default: 0 },
    falsePositiveRate: { type: Number, default: 0 }, // If we implement verification
    responseTime: { type: Number, default: 0 } // Average time to report
  },
  
  // System performance
  performance: {
    detectionAccuracy: { type: Number, default: 0 },
    processingTime: { type: Number, default: 0 }, // Average processing time
    systemLoad: { type: Number, default: 0 }
  },
  
  // Metadata
  version: { type: String, default: '1.0' },
  calculatedAt: { type: Date, default: Date.now },
  isComplete: { type: Boolean, default: true }, // Whether this period's data is complete
  
  // Indexes for efficient querying
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'analytics'
});

// Indexes for performance
analyticsSchema.index({ period: 1, startTime: 1 });
analyticsSchema.index({ period: 1, endTime: 1 });
analyticsSchema.index({ startTime: 1, endTime: 1 });
analyticsSchema.index({ calculatedAt: -1 });

// Static methods for common analytics queries
analyticsSchema.statics = {
  
  // Get analytics for a specific time range
  async getByTimeRange(startTime, endTime, period = 'day') {
    return await this.find({
      period,
      startTime: { $gte: startTime },
      endTime: { $lte: endTime }
    }).sort({ startTime: 1 });
  },
  
  // Get latest analytics for a period
  async getLatest(period = 'day', limit = 10) {
    return await this.find({ period })
      .sort({ startTime: -1 })
      .limit(limit);
  },
  
  // Get analytics summary for dashboard
  async getSummary(days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return await this.aggregate([
      {
        $match: {
          period: 'day',
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: '$totals.reports' },
          avgDailyReports: { $avg: '$totals.reports' },
          totalPlatforms: { $max: '$totals.platforms' },
          peakDay: { $max: '$totals.reports' }
        }
      }
    ]);
  },
  
  // Create analytics record for a time period
  async createPeriodAnalytics(period, startTime, endTime, data) {
    const analytics = new this({
      period,
      startTime,
      endTime,
      ...data,
      calculatedAt: new Date(),
      isComplete: true
    });
    
    return await analytics.save();
  }
};

// Instance methods
analyticsSchema.methods = {
  
  // Calculate growth rate compared to previous period
  async calculateGrowthRate() {
    const previousPeriod = await this.constructor.findOne({
      period: this.period,
      endTime: { $lt: this.startTime }
    }).sort({ endTime: -1 });
    
    if (!previousPeriod) return null;
    
    const currentReports = this.totals.reports;
    const previousReports = previousPeriod.totals.reports;
    
    if (previousReports === 0) return currentReports > 0 ? 100 : 0;
    
    return ((currentReports - previousReports) / previousReports) * 100;
  },
  
  // Get top platform for this period
  getTopPlatform() {
    if (!this.platformStats || this.platformStats.length === 0) return null;
    
    return this.platformStats.reduce((top, current) => 
      current.reportCount > top.reportCount ? current : top
    );
  },
  
  // Get most common flag reason
  getTopFlagReason() {
    if (!this.flagReasonStats || this.flagReasonStats.length === 0) return null;
    
    return this.flagReasonStats.reduce((top, current) => 
      current.count > top.count ? current : top
    );
  }
};

// Pre-save middleware
analyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for period duration in hours
analyticsSchema.virtual('durationHours').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60);
});

// Virtual for reports per hour rate
analyticsSchema.virtual('reportsPerHour').get(function() {
  const hours = this.durationHours;
  return hours > 0 ? (this.totals.reports / hours).toFixed(2) : 0;
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;