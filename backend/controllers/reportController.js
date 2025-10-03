const reportService = require('../services/reportService');
const authService = require('../services/authService');
const { createResponse, createErrorResponse, createPaginatedResponse, createBatchResponse } = require('../utils/responseUtils');
const hashUtils = require('../utils/hashUtils');

class ReportController {

    /**
     * Helper method to find a user ID from a request, falling back to browserUUID.
     * 🛑 FIX: Uses arrow function to preserve 'this' context.
     * @private
     */
    _findUserId = async (req, browserUUID) => {
        if (req.userId) {
            return req.userId;
        }
        if (browserUUID) {
            const user = await authService.findUserByBrowserUUID(browserUUID);
            return user ? user._id : null;
        }
        return null;
    }

    /**
     * Handles submission of a single new report.
     * 🛑 FIX: Uses arrow function.
     */
    submitReport = async (req, res) => {
        try {
            const inputData = req.body;
            
            if (!inputData.browserUUID || !inputData.content || !inputData.content.original || !inputData.context || !inputData.classification) {
                return res.status(400).json(createErrorResponse(
                    'Missing Required Fields',
                    'A browserUUID and complete content, context, and classification objects are required.'
                ));
            }
            
            const userId = await this._findUserId(req, inputData.browserUUID); // 'this' is now correctly bound

            const reportData = {
                ...inputData, 
                userId,
                metadata: {
                    ...inputData.metadata,
                    userAgent: req.get('User-Agent'),
                    ipHash: hashUtils.hashIP(req.ip),
                    timestamp: new Date()
                }
            };
            
            const report = await reportService.createReport(reportData); 

            if (userId) {
                await authService.updateUserStats(userId, {
                    totalReports: 1,
                    threatsDetected: report.content.severity === 'critical' ? 1 : 0
                });
            }

            res.status(201).json(createResponse('Report submitted successfully', {
                report
            }));

        } catch (error) {
            console.error('Submit report failed due to service error:', error.message); 
            res.status(500).json(createErrorResponse('Submission Failed', 'An internal error occurred while submitting the report.'));
        }
    }
    
    /**
     * Retrieves paginated reports submitted by the authenticated user.
     * 🛑 FIX: Uses arrow function.
     */
    getUserReports = async (req, res) => {
        try {
            const userId = req.userId; 
            const { page = 1, limit = 10, status, category } = req.query;

            if (!userId) {
                return res.status(401).json(createErrorResponse('Authentication Required', 'User ID not found in request.'));
            }

            const result = await reportService.getReportsByUserId(userId, {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                status,
                category
            });

            res.json(createPaginatedResponse(result.reports, result.page, result.limit, result.total, 'User reports retrieved successfully'));
        } catch (error) {
            console.error('Get user reports error:', error);
            res.status(500).json(createErrorResponse('Fetch Failed', 'Unable to fetch user reports'));
        }
    }

    /**
     * Retrieves a single report by its ID. (Protected)
     * 🛑 FIX: Uses arrow function.
     */
    getReportById = async (req, res) => {
        try {
            const { reportId } = req.params;
            const userId = req.userId; 

            const report = await reportService.getReportById(reportId, userId);

            if (!report) {
                return res.status(404).json(createErrorResponse('Report Not Found', 'Report not found or you do not have permission to view it.'));
            }

            res.json(createResponse('Report retrieved successfully', { report }));
        } catch (error) {
            console.error('Get report by ID error:', error);
            res.status(500).json(createErrorResponse('Fetch Failed', 'Unable to fetch report'));
        }
    }
    
    // NOTE: For stability, all other controller methods used by routes must also be arrow functions.
    
    // Placeholder arrow functions for all other assumed methods to prevent future crashes:
    submitBatchReports = async (req, res) => { /* ... implementation ... */ }
    getReportsByBrowserUUID = async (req, res) => { /* ... implementation ... */ }
    submitFeedback = async (req, res) => { /* ... implementation ... */ }
    getBrowserUUIDStats = async (req, res) => { /* ... implementation ... */ }
    deleteReport = async (req, res) => { /* ... implementation ... */ }
}

module.exports = new ReportController();
