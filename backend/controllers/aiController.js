const { createResponse, createErrorResponse } = require('../utils/responseUtils');
const Joi = require('joi');
const AIService = require('../services/aiService');

class AIController {
  constructor() {
    this.aiService = new AIService();
  }

  // Helper function for input validation
  validateInput(schema, data) {
    const { error } = schema.validate(data);
    if (error) {
      throw new Error(error.details[0].message);
    }
  }

  // ==============================
  // 🔍 Content Analysis Endpoint
  // ==============================
  analyzeContent = async (req, res) => {
    const schema = Joi.object({
      content: Joi.string().required(),
      context: Joi.object(),
    });

    try {
      // Validate input first
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json(createErrorResponse('Validation Error', error.details[0].message));
      }

      const { content, context = {} } = req.body;

      // Use integrated AI service
      const analysisResult = await this.aiService.analyzeContent(content, context);

      // Transform response to match frontend expectations
      const transformedResult = {
        category: analysisResult.categories?.[0] || 'none',
        severity: analysisResult.risk_level?.toLowerCase() || 'low',
        toxicity_score: analysisResult.risk_score / 100, // Normalize 0-100 to 0-1
        explanation: `Risk level: ${analysisResult.risk_level}. ${analysisResult.detections?.length || 0} detections found.`,
        suggestion: analysisResult.suggestions?.[0] || 'No suggestion available',
        detailed_analysis: analysisResult
      };

      res.json(createResponse('Content analyzed successfully', transformedResult));
    } catch (err) {
      console.error('Analyze content error:', err.message);
      res.status(500).json(createErrorResponse('AI Analysis Failed', err.message));
    }
  }

  // ==============================
  // 🎯 Legacy /predict Endpoint
  // ==============================
  getPrediction = async (req, res) => {
    return this.analyzeContent(req, res);
  }

  // ==============================
  // 💬 Rephrasing Suggestions
  // ==============================
  getRephrasingSuggestions = async (req, res) => {
    console.log('getRephrasingSuggestions called with:', req.body);
    const schema = Joi.object({
      message: Joi.string().required(),
      context: Joi.object(),
    });

    try {
      // Validate input first
      const { error } = schema.validate(req.body);
      if (error) {
        console.log('Validation error:', error.details[0].message);
        return res.status(400).json(createErrorResponse('Validation Error', error.details[0].message));
      }

      const { message, context = {} } = req.body;
      console.log('Generating rephrasing suggestions for:', message);

      // Use integrated AI service
      const suggestionsResult = await this.aiService.getRephrasingSuggestions(message, context);

      console.log('Rephrasing suggestions generated:', suggestionsResult);
      res.json(createResponse('Rephrasing suggestions generated successfully', suggestionsResult));
    } catch (err) {
      console.error('Rephrasing error:', err.message);
      res.status(500).json(createErrorResponse('Rephrasing Failed', err.message));
    }
  }

  // ==============================
  // 📘 Educational Content
  // ==============================
  getEducationalContent = async (req, res) => {
    const schema = Joi.object({
      messageType: Joi.string().required(),
      context: Joi.object(),
    });

    try {
      // Validate input first
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json(createErrorResponse('Validation Error', error.details[0].message));
      }

      const { messageType, context = {} } = req.body;

      // For now, return basic educational content based on message type
      const educationalContent = this._getEducationalContent(messageType, context);

      res.json(createResponse('Educational content retrieved successfully', educationalContent));
    } catch (err) {
      console.error('Educational content error:', err.message);
      res.status(500).json(createErrorResponse('Education Content Failed', err.message));
    }
  }

  // ==============================
  // 🤝 Contextual Suggestions
  // ==============================
  getContextualSuggestions = async (req, res) => {
    const schema = Joi.object({
      message: Joi.string().required(),
      emotion: Joi.string(),
      platform: Joi.string(),
      context: Joi.object(),
    });

    try {
      // Validate input first
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json(createErrorResponse('Validation Error', error.details[0].message));
      }

      const { message, emotion, platform, context = {} } = req.body;

      // Enhance context with emotion and platform
      const enhancedContext = {
        ...context,
        emotion,
        platform
      };

      // Get both analysis and rephrasing suggestions
      const [analysis, suggestions] = await Promise.all([
        this.aiService.analyzeContent(message, enhancedContext),
        this.aiService.getRephrasingSuggestions(message, enhancedContext)
      ]);

      const contextualResult = {
        analysis: analysis,
        suggestions: suggestions,
        emotion_based_advice: this._getEmotionBasedAdvice(emotion, analysis.risk_level)
      };

      res.json(createResponse('Contextual suggestions generated successfully', contextualResult));
    } catch (err) {
      console.error('Contextual suggestions error:', err.message);
      res.status(500).json(createErrorResponse('Suggestions Failed', err.message));
    }
  }

  // ==============================
  // 🩺 AI Service Health Check
  // ==============================
  getServiceHealth = async (req, res) => {
    try {
      // Get service statistics
      const stats = this.aiService.getStats();

      const isHealthy = stats.error_rate < 0.1; // Less than 10% error rate
      const healthData = {
        status: isHealthy ? 'healthy' : 'degraded',
        uptime: 'N/A', // Could be enhanced with actual uptime tracking
        stats: stats
      };

      res.json(createResponse('AI service health check successful', healthData));
    } catch (err) {
      console.error('AI health check error:', err.message);
      res.status(503).json(createErrorResponse('AI Service Unavailable', 'AI service health check failed', { status: 'unhealthy', error: err.message }));
    }
  }

  // ==============================
  // 📊 AI Service Statistics
  // ==============================
  getServiceStats = async (req, res) => {
    try {
      const stats = this.aiService.getStats();
      res.json(createResponse('AI service statistics retrieved successfully', stats));
    } catch (err) {
      console.error('AI stats error:', err.message);
      res.status(500).json(createErrorResponse('Statistics Failed', err.message));
    }
  }

  // ==============================
  // 🔄 Reset AI Service Statistics
  // ==============================
  resetServiceStats = async (req, res) => {
    try {
      this.aiService.resetStats();
      res.json(createResponse('AI service statistics reset successfully'));
    } catch (err) {
      console.error('AI stats reset error:', err.message);
      res.status(500).json(createErrorResponse('Reset Failed', err.message));
    }
  }

  // Helper methods

  _getEducationalContent(messageType, context) {
    const educationalMessages = {
      'insult': {
        title: 'Understanding Insults and Personal Attacks',
        content: 'Insults can hurt deeply and create a hostile environment. Everyone deserves respect, regardless of their opinions or background. Try to express your thoughts without attacking someone\'s character.',
        tips: [
          'Focus on the behavior, not the person',
          'Use "I" statements to express your feelings',
          'Take a moment to cool down before responding',
          'Consider if the issue is worth addressing'
        ]
      },
      'criticism': {
        title: 'Constructive vs Destructive Criticism',
        content: 'Criticism can be helpful when it focuses on specific behaviors and suggests improvements. Destructive criticism attacks character and discourages growth.',
        tips: [
          'Be specific about what you observed',
          'Suggest concrete improvements',
          'Focus on impact rather than intent',
          'Acknowledge what\'s working well too'
        ]
      },
      'disagreement': {
        title: 'Healthy Disagreement',
        content: 'Disagreeing is natural and can lead to better understanding. The goal should be mutual respect and learning, not "winning" the argument.',
        tips: [
          'Listen actively to understand their perspective',
          'Find common ground when possible',
          'Use phrases like "I see it differently"',
          'Ask questions to clarify their position'
        ]
      },
      'frustration': {
        title: 'Managing Frustration',
        content: 'Frustration is normal, but how we express it matters. Taking a moment to breathe can help us communicate more effectively.',
        tips: [
          'Pause before responding',
          'Identify what specifically is frustrating you',
          'Use "I feel" statements',
          'Consider if this is the right time/place to discuss'
        ]
      },
      'threat': {
        title: 'Threatening Language',
        content: 'Threats create fear and are never appropriate. They can have serious legal consequences and damage relationships permanently.',
        tips: [
          'Remove yourself from heated situations',
          'Seek help if you feel threatened',
          'Report threats to appropriate authorities',
          'Focus on finding peaceful resolutions'
        ]
      }
    };

    return educationalMessages[messageType] || {
      title: 'Communication Tips',
      content: 'Effective communication builds positive relationships. Consider how your words might affect others and choose them thoughtfully.',
      tips: [
        'Think before you speak',
        'Consider the other person\'s perspective',
        'Use respectful language',
        'Be open to dialogue'
      ]
    };
  }

  _getEmotionBasedAdvice(emotion, riskLevel) {
    const emotionAdvice = {
      'anger': {
        'HIGH': 'When angry, it\'s often best to take a break before responding. Your words can have lasting impact.',
        'MEDIUM': 'Try expressing your anger constructively. Focus on the issue, not the person.',
        'LOW': 'Good job managing your anger. Consider if this situation needs to be addressed.'
      },
      'frustration': {
        'HIGH': 'Frustration can cloud judgment. Consider stepping away and returning when calmer.',
        'MEDIUM': 'Express your frustration clearly but calmly. Focus on solutions.',
        'LOW': 'You\'re handling frustration well. Clear communication is key.'
      },
      'sadness': {
        'HIGH': 'Sadness might make you more sensitive. Give yourself time to process emotions.',
        'MEDIUM': 'It\'s okay to express sadness, but try to communicate your needs clearly.',
        'LOW': 'You\'re managing your emotions well. Healthy expression is important.'
      },
      'dismissive': {
        'HIGH': 'Dismissive attitudes can damage relationships. Try to engage more thoughtfully.',
        'MEDIUM': 'Everyone\'s thoughts matter. Consider showing more interest in others\' perspectives.',
        'LOW': 'Good engagement! Active listening builds better connections.'
      }
    };

    return emotionAdvice[emotion]?.[riskLevel] || 'Consider how your emotions affect your communication.';
  }
}

module.exports = new AIController();
