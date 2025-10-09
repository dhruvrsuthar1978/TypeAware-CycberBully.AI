const Report = require('../models/Report');
const User = require('../models/User');
const crypto = require('crypto');

class ReportService {
    // ----------------------------------------------------------------------
    // CORE METHODS
    // ----------------------------------------------------------------------

    /**
     * Creates a new report by processing raw data, checking for duplicates, and saving.
     */
    async createReport(reportData) {
        try {
            // 1. Process the raw data (ensures contentHash, severity, etc., are set)
            const processedReport = this._processAndValidateReportData(reportData);

            // 2. Check for duplicate content using the newly generated hash
            const existingReport = await this.findDuplicateReport(
                processedReport.contentHash,
                processedReport.browserUUID
            );

            if (existingReport) {
                existingReport.updatedAt = new Date();
                await existingReport.save();
                return existingReport;
            }

            // 3. Save the fully processed and valid report
            const report = new Report(processedReport);
            await report.save();
            return report;

        } catch (error) {
            // Log the actual MongoDB error for debugging (this prevents the generic 500 loop)
            console.error('MongoDB Save Error in createReport:', error);
            // Re-throw the error to trigger the controller's clean 500 response
            throw new Error(`Error creating report: ${error.message}`);
        }
    }

    /**
     * Processes and validates raw report data to prepare it for MongoDB.
     * @private
     */
    _processAndValidateReportData(reportData) {
        const { browserUUID, userId, content, context, classification, metadata } = reportData;

        // Ensure all data points required by the Mongoose schema are present.
        const contentHash = this.generateContentHash(content.original, browserUUID);
        const processedFlaggedTerms = this.processFlaggedTerms(content.flaggedTerms || []);
        const overallSeverity = this.calculateOverallSeverity(content.severity, processedFlaggedTerms);

        return {
            browserUUID,
            userId,
            content: {
                original: content.original,
                cleaned: this.cleanContent(content.original, processedFlaggedTerms),
                flaggedTerms: processedFlaggedTerms,
                wordCount: content.original.split(/\s+/).length,
                severity: overallSeverity
            },
            context: {
                platform: context.platform,
                url: context.url,
                pageTitle: context.pageTitle,
                elementType: context.elementType || 'other'
            },
            classification: {
                category: classification.category,
                confidence: Math.min(Math.max(classification.confidence || 0.8, 0), 1),
                detectionMethod: classification.detectionMethod || 'user_report'
            },
            status: 'pending',
            metadata,
            contentHash // CRITICAL FIELD
        };
    }

    /**
     * Get pending reports for admin review
     */
    async getPendingReports(page = 1, limit = 20, filters = {}) {
        try {
            const skip = (page - 1) * limit;

            const query = { status: 'pending', ...filters };

            const reports = await Report.find(query)
                .populate('userId', 'username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Report.countDocuments(query);

            return {
                reports,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error getting pending reports:', error);
            throw error;
        }
    }

    // ----------------------------------------------------------------------
    // HELPER METHODS IMPLEMENTATIONS
    // ----------------------------------------------------------------------

    generateContentHash(content, browserUUID) {
        return crypto.createHash('sha256')
            .update(content + browserUUID)
            .digest('hex');
    }

    processFlaggedTerms(flaggedTerms) {
        return flaggedTerms.map(term => ({
            term: term.term || term,
            severity: term.severity || 'medium',
            category: term.category || 'general'
        }));
    }

    calculateOverallSeverity(contentSeverity, flaggedTerms) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        let maxSeverity = severityLevels[contentSeverity] || 1;

        flaggedTerms.forEach(term => {
            const termSeverity = severityLevels[term.severity] || 1;
            maxSeverity = Math.max(maxSeverity, termSeverity);
        });

        return Object.keys(severityLevels).find(key => severityLevels[key] === maxSeverity) || 'low';
    }

    cleanContent(content, flaggedTerms) {
        let cleaned = content;
        flaggedTerms.forEach(term => {
            const regex = new RegExp(term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cleaned = cleaned.replace(regex, '[REDACTED]');
        });
        return cleaned;
    }

    async findDuplicateReport(contentHash, browserUUID, timeWindow = 24) {
        const timeThreshold = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
        return await Report.findOne({
            contentHash,
            browserUUID,
            createdAt: { $gte: timeThreshold }
        });
    }

    async getUserBrowserUUIDs(userId) {
        const reports = await Report.find({ userId }, { browserUUID: 1 });
        return [...new Set(reports.map(r => r.browserUUID))];
    }

    async getReportsByUserId(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const reports = await Report.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Report.countDocuments({ userId });
        return { reports, total, page, limit };
    }

    async getReportById(reportId) {
        return await Report.findById(reportId).populate('userId', 'username email');
    }

    async markAsReviewed(reportId, adminId, decision, notes, actionTaken) {
        const report = await Report.findById(reportId);
        if (!report) return null;

        report.status = decision === 'confirmed' ? 'confirmed' :
                       decision === 'false_positive' ? 'dismissed' : 'dismissed';
        report.adminReview = {
            reviewedBy: adminId,
            reviewedAt: new Date(),
            decision,
            notes,
            actionTaken
        };

        await report.save();
        return report;
    }

    async deleteReport(reportId) {
        return await Report.findByIdAndDelete(reportId);
    }

    async getReportStats() {
        try {
            const totalReports = await Report.countDocuments();
            const pendingReports = await Report.countDocuments({ status: 'pending' });
            const confirmedReports = await Report.countDocuments({ status: 'confirmed' });
            const dismissedReports = await Report.countDocuments({ status: 'dismissed' });

            const severityStats = await Report.aggregate([
                {
                    $group: {
                        _id: '$content.severity',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const categoryStats = await Report.aggregate([
                {
                    $group: {
                        _id: '$classification.category',
                        count: { $sum: 1 }
                    }
                }
            ]);

            return {
                total: totalReports,
                pending: pendingReports,
                confirmed: confirmedReports,
                dismissed: dismissedReports,
                severityBreakdown: severityStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                categoryBreakdown: categoryStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Error getting report stats:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
