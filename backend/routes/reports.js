const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { optionalAuth, validateBrowserUUID } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/reports/submit
// @desc    Submit a new report from browser extension
// @access  Public (but requires browserUUID)
router.post('/submit', validateBrowserUUID, optionalAuth, async (req, res) => {
  try {
    const {
      browserUUID,
      content,
      context,
      classification,
      metadata
    } = req.body;

    // Validate required fields
    if (!content || !content.original) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Content is required'
      });
    }

    if (!context || !context.platform) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Context with platform is required'
      });
    }

    if (!classification || !classification.category) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Classification category is required'
      });
    }

    // Find user by browserUUID if not authenticated
    let userId = req.userId;
    if (!userId) {
      const user = await User.findByBrowserUUID(browserUUID);
      if (user) {
        userId = user._id;
      }
    }

    // Create report
    const report = new Report({
      browserUUID,
      userId,
      content: {
        original: content.original,
        flaggedTerms: content.flaggedTerms || [],
        severity: content.severity || 'medium'
      },
      context: {
        platform: context.platform,
        url: context.url,
        pageTitle: context.pageTitle,
        elementType: context.elementType || 'other'
      },
      classification: {
        category: classification.category,
        confidence: classification.confidence || 0.8,
        detectionMethod: classification.detectionMethod || 'user_report'
      },
      metadata: {
        userAgent: metadata?.userAgent || req.get('User-Agent'),
        ipHash: hashIP(req.ip),
        sessionId: metadata?.sessionId,
        timestamp: new Date()
      }
    });

    await report.save();

    // Update user stats if user is linked
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.totalReports': 1 },
        $set: { 'stats.lastActivity': new Date() }
      });
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report._id,
      status: report.status
    });

  } catch (error) {
    console.error('Submit report error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Submission Failed',
      message: 'Unable to submit report'
    });
  }
});

// @route   GET /api/reports/browser/:browserUUID
// @desc    Get reports for a specific browser UUID
// @access  Public (for browser extension)
router.get('/browser/:browserUUID', async (req, res) => {
  try {
    const { browserUUID } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per request
    const skip = (page - 1) * limit;

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(browserUUID)) {
      return res.status(400).json({
        error: 'Invalid UUID',
        message: 'Browser UUID format is invalid'
      });
    }

    const reports = await Report.find({ browserUUID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('content.severity classification.category status createdAt context.platform');

    const totalReports = await Report.countDocuments({ browserUUID });

    res.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        limit
      }
    });

  } catch (error) {
    console.error('Get browser reports error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Unable to fetch reports'
    });
  }
});

// @route   POST /api/reports/batch
// @desc    Submit multiple reports (for bulk processing)
// @access  Public (but requires browserUUID)
router.post('/batch', validateBrowserUUID, optionalAuth, async (req, res) => {
  try {
    const { browserUUID, reports } = req.body;

    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reports array is required'
      });
    }

    if (reports.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one report is required'
      });
    }

    if (reports.length > 10) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 10 reports allowed per batch'
      });
    }

    // Find user by browserUUID if not authenticated
    let userId = req.userId;
    if (!userId) {
      const user = await User.findByBrowserUUID(browserUUID);
      if (user) {
        userId = user._id;
      }
    }

    const createdReports = [];
    const errors = [];

    // Process each report
    for (let i = 0; i < reports.length; i++) {
      try {
        const reportData = reports[i];

        const report = new Report({
          browserUUID,
          userId,
          content: {
            original: reportData.content?.original,
            flaggedTerms: reportData.content?.flaggedTerms || [],
            severity: reportData.content?.severity || 'medium'
          },
          context: {
            platform: reportData.context?.platform,
            url: reportData.context?.url,
            pageTitle: reportData.context?.pageTitle,
            elementType: reportData.context?.elementType || 'other'
          },
          classification: {
            category: reportData.classification?.category,
            confidence: reportData.classification?.confidence || 0.8,
            detectionMethod: reportData.classification?.detectionMethod || 'user_report'
          },
          metadata: {
            userAgent: req.get('User-Agent'),
            ipHash: hashIP(req.ip),
            timestamp: new Date()
          }
        });

        await report.save();
        createdReports.push({
          index: i,
          reportId: report._id,
          status: report.status
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    // Update user stats if user is linked
    if (userId && createdReports.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.totalReports': createdReports.length },
        $set: { 'stats.lastActivity': new Date() }
      });
    }

    res.status(201).json({
      message: `${createdReports.length} reports submitted successfully`,
      successful: createdReports,
      failed: errors,
      totalProcessed: reports.length
    });

  } catch (error) {
    console.error('Batch submit error:', error);
    res.status(500).json({
      error: 'Batch Submission Failed',
      message: 'Unable to process batch reports'
    });
  }
});

// @route   PUT /api/reports/:reportId/feedback
// @desc    Submit feedback on a report
// @access  Public (for browser extension)
router.put('/:reportId/feedback', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { isHelpful, comment, browserUUID } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'isHelpful must be a boolean value'
      });
    }

    const report = await Report.findOne({
      _id: reportId,
      browserUUID: browserUUID
    });

    if (!report) {
      return res.status(404).json({
        error: 'Report Not Found',
        message: 'Report not found or you do not have access to it'
      });
    }

    report.userFeedback = {
      isHelpful,
      comment: comment || '',
      submittedAt: new Date()
    };

    await report.save();

    res.json({
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      error: 'Feedback Failed',
      message: 'Unable to submit feedback'
    });
  }
});

// Utility function to hash IP addresses for privacy
function hashIP(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').substring(0, 16);
}

module.exports = router;