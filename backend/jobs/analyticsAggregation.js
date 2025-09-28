const cron = require('node-cron');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { logger } = require('../middleware/logging');

class AnalyticsAggregationJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.jobSchedules = new Map();
  }

  // Start all analytics jobs
  start() {
    try {
      // Daily aggregation at 2 AM
      this.scheduleJob('dailyAggregation', '0 2 * * *', () => this.runDailyAggregation());
      
      // Hourly aggregation
      this.scheduleJob('hourlyAggregation', '0 * * * *', () => this.runHourlyAggregation());
      
      // Weekly aggregation on Sundays at 3 AM
      this.scheduleJob('weeklyAggregation', '0 3 * * 0', () => this.runWeeklyAggregation());
      
      // Monthly aggregation on 1st day at 4 AM
      this.scheduleJob('monthlyAggregation', '0 4 1 * *', () => this.runMonthlyAggregation());
      
      // Real-time metrics update every 5 minutes
      this.scheduleJob('realTimeMetrics', '*/5 * * * *', () => this.updateRealTimeMetrics());
      
      logger.info('Analytics aggregation jobs started successfully');
    } catch (error) {
      logger.error('Failed to start analytics jobs', error);
    }
  }

  // Stop all jobs
  stop() {
    try {
      this.jobSchedules.forEach((task, name) => {
        if (task) {
          task.stop();
          logger.info(`Stopped analytics job: ${name}`);
        }
      });
      this.jobSchedules.clear();
      logger.info('All analytics aggregation jobs stopped');
    } catch (error) {
      logger.error('Error stopping analytics jobs', error);
    }
  }

  // Schedule a job with error handling
  scheduleJob(name, schedule, jobFunction) {
    try {
      const task = cron.schedule(schedule, async () => {
        if (this.isRunning) {
          logger.warn(`Analytics job ${name} skipped - another job is running`);
          return;
        }

        const startTime = Date.now();
        this.isRunning = true;

        try {
          logger.info(`Starting analytics job: ${name}`);
          await jobFunction();
          const duration = Date.now() - startTime;
          logger.info(`Analytics job ${name} completed in ${duration}ms`);
        } catch (error) {
          logger.error(`Analytics job ${name} failed`, error);
        } finally {
          this.isRunning = false;
          this.lastRun = new Date();
        }
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobSchedules.set(name, task);
      task.start();
      logger.info(`Scheduled analytics job: ${name} with cron: ${schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule analytics job ${name}`, error);
    }
  }

  // Daily aggregation job
  async runDailyAggregation() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const dayEnd = new Date(yesterday);
      dayEnd.setHours(23, 59, 59, 999);

      // Aggregate daily report metrics
      const dailyReportStats = await this.aggregateReportsByTimeframe(yesterday, dayEnd);
      
      // Aggregate daily user metrics
      const dailyUserStats = await this.aggregateUsersByTimeframe(yesterday, dayEnd);
      
      // Aggregate platform metrics
      const platformStats = await this.aggregatePlatformMetrics(yesterday, dayEnd);
      
      // Aggregate category metrics
      const categoryStats = await this.aggregateCategoryMetrics(yesterday, dayEnd);

      // Save daily analytics
      const dailyAnalytics = new Analytics({
        date: yesterday,
        timeframe: 'daily',
        reportStats: dailyReportStats,
        userStats: dailyUserStats,
        platformStats: platformStats,
        categoryStats: categoryStats,
        metadata: {
          processingTime: Date.now(),
          recordCount: dailyReportStats.totalReports,
          dataQuality: await this.assessDataQuality(yesterday, dayEnd)
        }
      });

      await dailyAnalytics.save();
      logger.info(`Daily analytics aggregated for ${yesterday.toDateString()}`);

      // Clean up old detailed data (keep last 90 days)
      await this.cleanupOldAnalytics('daily', 90);

    } catch (error) {
      logger.error('Daily aggregation failed', error);
      throw error;
    }
  }

  // Hourly aggregation job
  async runHourlyAggregation() {
    try {
      const now = new Date();
      const hourStart = new Date(now);
      hourStart.setMinutes(0, 0, 0);
      hourStart.setHours(hourStart.getHours() - 1);

      const hourEnd = new Date(hourStart);
      hourEnd.setMinutes(59, 59, 999);

      const hourlyStats = await this.aggregateReportsByTimeframe(hourStart, hourEnd);

      const hourlyAnalytics = new Analytics({
        date: hourStart,
        timeframe: 'hourly',
        reportStats: hourlyStats,
        metadata: {
          processingTime: Date.now(),
          hour: hourStart.getHours()
        }
      });

      await hourlyAnalytics.save();
      logger.info(`Hourly analytics aggregated for ${hourStart.toISOString()}`);

      // Clean up old hourly data (keep last 7 days)
      await this.cleanupOldAnalytics('hourly', 7);

    } catch (error) {
      logger.error('Hourly aggregation failed', error);
    }
  }

  // Weekly aggregation job
  async runWeeklyAggregation() {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Aggregate weekly trends
      const weeklyTrends = await this.calculateWeeklyTrends(weekStart, weekEnd);
      
      // Calculate weekly user engagement
      const userEngagement = await this.calculateUserEngagement(weekStart, weekEnd);

      const weeklyAnalytics = new Analytics({
        date: weekStart,
        timeframe: 'weekly',
        trends: weeklyTrends,
        userEngagement: userEngagement,
        metadata: {
          processingTime: Date.now(),
          weekNumber: this.getWeekNumber(weekStart)
        }
      });

      await weeklyAnalytics.save();
      logger.info(`Weekly analytics aggregated for week starting ${weekStart.toDateString()}`);

    } catch (error) {
      logger.error('Weekly aggregation failed', error);
    }
  }

  // Monthly aggregation job
  async runMonthlyAggregation() {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

      const monthlyStats = await this.aggregateReportsByTimeframe(monthStart, monthEnd);
      const monthlyUserStats = await this.aggregateUsersByTimeframe(monthStart, monthEnd);
      const monthlyTrends = await this.calculateMonthlyTrends(monthStart, monthEnd);

      const monthlyAnalytics = new Analytics({
        date: monthStart,
        timeframe: 'monthly',
        reportStats: monthlyStats,
        userStats: monthlyUserStats,
        trends: monthlyTrends,
        metadata: {
          processingTime: Date.now(),
          month: monthStart.getMonth() + 1,
          year: monthStart.getFullYear()
        }
      });

      await monthlyAnalytics.save();
      logger.info(`Monthly analytics aggregated for ${monthStart.toDateString()}`);

    } catch (error) {
      logger.error('Monthly aggregation failed', error);
    }
  }

  // Update real-time metrics
  async updateRealTimeMetrics() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get recent activity
      const recentReports = await Report.countDocuments({
        createdAt: { $gte: fiveMinutesAgo }
      });

      const recentUsers = await User.countDocuments({
        'stats.lastActivity': { $gte: fiveMinutesAgo }
      });

      // Update real-time analytics collection
      await Analytics.findOneAndUpdate(
        { 
          timeframe: 'realtime',
          date: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } // Last hour
        },
        {
          $set: {
            date: now,
            timeframe: 'realtime',
            realtimeStats: {
              activeUsers: recentUsers,
              recentReports: recentReports,
              timestamp: now
            }
          }
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      logger.error('Real-time metrics update failed', error);
    }
  }

  // Aggregate reports by timeframe
  async aggregateReportsByTimeframe(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          confirmedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          falsePositives: {
            $sum: { $cond: [{ $eq: ['$status', 'false_positive'] }, 1, 0] }
          },
          dismissedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] }
          },
          avgConfidence: { $avg: '$classification.confidence' },
          severityBreakdown: {
            $push: '$content.severity'
          },
          categoryBreakdown: {
            $push: '$classification.category'
          },
          platformBreakdown: {
            $push: '$context.platform'
          },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ];

    const result = await Report.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalReports: 0,
        confirmedReports: 0,
        pendingReports: 0,
        falsePositives: 0,
        dismissedReports: 0,
        avgConfidence: 0,
        severityBreakdown: {},
        categoryBreakdown: {},
        platformBreakdown: {},
        avgProcessingTime: 0,
        accuracyRate: 0
      };
    }

    const stats = result[0];
    
    // Process breakdowns
    stats.severityBreakdown = this.processBreakdown(stats.severityBreakdown);
    stats.categoryBreakdown = this.processBreakdown(stats.categoryBreakdown);
    stats.platformBreakdown = this.processBreakdown(stats.platformBreakdown);
    
    // Calculate accuracy rate
    stats.accuracyRate = stats.totalReports > 0 
      ? (stats.confirmedReports / stats.totalReports) * 100 
      : 0;

    return stats;
  }

  // Aggregate users by timeframe
  async aggregateUsersByTimeframe(startDate, endDate) {
    const [newUsers, activeUsers, totalUsers] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      User.countDocuments({
        'stats.lastActivity': { $gte: startDate, $lte: endDate }
      }),
      User.countDocuments({ isActive: true })
    ]);

    return {
      newUsers,
      activeUsers,
      totalUsers,
      growthRate: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0
    };
  }

  // Aggregate platform metrics
  async aggregatePlatformMetrics(startDate, endDate) {
    const platformStats = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$context.platform',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' },
          categories: { $addToSet: '$classification.category' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return platformStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgConfidence: Math.round(stat.avgConfidence * 100) / 100,
        categoriesCount: stat.categories.length
      };
      return acc;
    }, {});
  }

  // Aggregate category metrics
  async aggregateCategoryMetrics(startDate, endDate) {
    const categoryStats = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' },
          platforms: { $addToSet: '$context.platform' },
          avgSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$content.severity', 'low'] }, then: 1 },
                  { case: { $eq: ['$content.severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$content.severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$content.severity', 'critical'] }, then: 4 }
                ],
                default: 2
              }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return categoryStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgConfidence: Math.round(stat.avgConfidence * 100) / 100,
        avgSeverity: Math.round(stat.avgSeverity * 10) / 10,
        platformsCount: stat.platforms.length
      };
      return acc;
    }, {});
  }

  // Calculate weekly trends
  async calculateWeeklyTrends(startDate, endDate) {
    // Calculate week-over-week changes
    const currentWeekStats = await this.aggregateReportsByTimeframe(startDate, endDate);
    
    const previousWeekStart = new Date(startDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(endDate);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
    
    const previousWeekStats = await this.aggregateReportsByTimeframe(previousWeekStart, previousWeekEnd);

    return {
      reportsChange: this.calculatePercentageChange(currentWeekStats.totalReports, previousWeekStats.totalReports),
      accuracyChange: this.calculatePercentageChange(currentWeekStats.accuracyRate, previousWeekStats.accuracyRate),
      confidenceChange: this.calculatePercentageChange(currentWeekStats.avgConfidence, previousWeekStats.avgConfidence)
    };
  }

  // Calculate monthly trends
  async calculateMonthlyTrends(startDate, endDate) {
    const currentMonthStats = await this.aggregateReportsByTimeframe(startDate, endDate);
    
    const previousMonthStart = new Date(startDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(endDate);
    previousMonthEnd.setMonth(previousMonthEnd.getMonth() - 1);
    
    const previousMonthStats = await this.aggregateReportsByTimeframe(previousMonthStart, previousMonthEnd);

    return {
      reportsChange: this.calculatePercentageChange(currentMonthStats.totalReports, previousMonthStats.totalReports),
      accuracyChange: this.calculatePercentageChange(currentMonthStats.accuracyRate, previousMonthStats.accuracyRate),
      userGrowth: await this.calculateUserGrowth(startDate, endDate)
    };
  }

  // Calculate user engagement
  async calculateUserEngagement(startDate, endDate) {
    const engagement = await User.aggregate([
      {
        $match: {
          'stats.lastActivity': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgReportsPerUser: { $avg: '$stats.totalReports' },
          activeUsers: { $sum: 1 },
          totalReports: { $sum: '$stats.totalReports' }
        }
      }
    ]);

    return engagement.length > 0 ? engagement[0] : {
      avgReportsPerUser: 0,
      activeUsers: 0,
      totalReports: 0
    };
  }

  // Helper methods
  processBreakdown(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  async calculateUserGrowth(startDate, endDate) {
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalUsers = await User.countDocuments({
      createdAt: { $lte: endDate }
    });

    return {
      newUsers,
      growthRate: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0
    };
  }

  async assessDataQuality(startDate, endDate) {
    const totalReports = await Report.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const reportsWithAllFields = await Report.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      'content.original': { $exists: true, $ne: '' },
      'classification.category': { $exists: true },
      'context.platform': { $exists: true }
    });

    return totalReports > 0 ? (reportsWithAllFields / totalReports) * 100 : 100;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async cleanupOldAnalytics(timeframe, daysToKeep) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await Analytics.deleteMany({
        timeframe,
        date: { $lt: cutoffDate }
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} old ${timeframe} analytics records`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup old ${timeframe} analytics`, error);
    }
  }

  // Manual trigger methods for debugging
  async triggerDailyAggregation() {
    logger.info('Manually triggering daily aggregation');
    await this.runDailyAggregation();
  }

  async triggerHourlyAggregation() {
    logger.info('Manually triggering hourly aggregation');
    await this.runHourlyAggregation();
  }

  // Get job status
  getJobStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      scheduledJobs: Array.from(this.jobSchedules.keys()),
      uptime: process.uptime()
    };
  }

  // Force recalculation for a specific date range
  async recalculateAnalytics(startDate, endDate, timeframe = 'daily') {
    try {
      logger.info(`Recalculating ${timeframe} analytics from ${startDate} to ${endDate}`);
      
      // Delete existing analytics for this period
      await Analytics.deleteMany({
        timeframe,
        date: { $gte: startDate, $lte: endDate }
      });

      // Recalculate day by day
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dailyStats = await this.aggregateReportsByTimeframe(currentDate, dayEnd);
        const userStats = await this.aggregateUsersByTimeframe(currentDate, dayEnd);

        const analytics = new Analytics({
          date: new Date(currentDate),
          timeframe,
          reportStats: dailyStats,
          userStats: userStats,
          metadata: {
            processingTime: Date.now(),
            recalculated: true
          }
        });

        await analytics.save();
        currentDate.setDate(currentDate.getDate() + 1);
      }

      logger.info(`Successfully recalculated analytics for ${startDate} to ${endDate}`);
    } catch (error) {
      logger.error('Failed to recalculate analytics', error);
      throw error;
    }
  }
}

// Create singleton instance
const analyticsAggregationJob = new AnalyticsAggregationJob();

// Export job instance and class
module.exports = {
  job: analyticsAggregationJob,
  AnalyticsAggregationJob
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping analytics jobs...');
  analyticsAggregationJob.stop();
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping analytics jobs...');
  analyticsAggregationJob.stop();
});