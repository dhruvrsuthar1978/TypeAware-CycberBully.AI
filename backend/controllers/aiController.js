// backend/controllers/aiController.js

const axios = require('axios');
const { createResponse, createErrorResponse } = require('../utils/responseUtils');

class AIController {
  // Get AI predictions for content analysis
  async getPrediction(req, res) {
    try {
      const input = req.body;

      if (!input || !input.content) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Content is required for analysis'
        ));
      }

      // Forward Authorization header from frontend request to AI service
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      // Call AI server - map content to text
      const aiResponse = await axios.post("http://localhost:8000/predict", {
        text: input.content
      }, {
        headers,
        timeout: 10000 // 10 second timeout
      });

      res.json(createResponse(
        'Content analyzed successfully',
        aiResponse.data
      ));

    } catch (err) {
      console.error('AI prediction error:', err.message);

      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json(createErrorResponse(
          'AI Service Unavailable',
          'AI analysis service is currently unavailable'
        ));
      }

      res.status(500).json(createErrorResponse(
        'AI Analysis Failed',
        'Unable to analyze content at this time'
      ));
    }
  }

  // Get rephrasing suggestions
  async getRephrasingSuggestions(req, res) {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Message is required for rephrasing suggestions'
        ));
      }

      // Forward to AI service for rephrasing
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const aiResponse = await axios.post("http://localhost:8000/rephrase", {
        text: message.trim()
      }, {
        headers,
        timeout: 15000 // 15 second timeout for more complex processing
      });

      res.json(createResponse(
        'Rephrasing suggestions generated successfully',
        aiResponse.data
      ));

    } catch (err) {
      console.error('Rephrasing error:', err.message);

      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json(createErrorResponse(
          'AI Service Unavailable',
          'Rephrasing service is currently unavailable'
        ));
      }

      res.status(500).json(createErrorResponse(
        'Rephrasing Failed',
        'Unable to generate rephrasing suggestions'
      ));
    }
  }

  // Get educational content
  async getEducationalContent(req, res) {
    try {
      const { messageType, context } = req.body;

      if (!messageType) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Message type is required for educational content'
        ));
      }

      // Forward to AI service for educational content
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const aiResponse = await axios.post("http://localhost:8000/education", {
        messageType,
        context: context || {}
      }, { headers });

      res.json(createResponse(
        'Educational content retrieved successfully',
        aiResponse.data
      ));

    } catch (err) {
      console.error('Education content error:', err.message);

      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json(createErrorResponse(
          'AI Service Unavailable',
          'Educational content service is currently unavailable'
        ));
      }

      res.status(500).json(createErrorResponse(
        'Education Content Failed',
        'Unable to retrieve educational content'
      ));
    }
  }

  // Get contextual suggestions
  async getContextualSuggestions(req, res) {
    try {
      const { message, emotion, platform, context } = req.body;

      if (!message) {
        return res.status(400).json(createErrorResponse(
          'Validation Error',
          'Message is required for contextual suggestions'
        ));
      }

      // Forward to AI service for contextual suggestions
      const headers = {};
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const aiResponse = await axios.post("http://localhost:8000/suggestions", {
        message: message.trim(),
        emotion,
        platform,
        context: context || {}
      }, {
        headers,
        timeout: 15000
      });

      res.json(createResponse(
        'Contextual suggestions generated successfully',
        aiResponse.data
      ));

    } catch (err) {
      console.error('Contextual suggestions error:', err.message);

      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json(createErrorResponse(
          'AI Service Unavailable',
          'Contextual suggestions service is currently unavailable'
        ));
      }

      res.status(500).json(createErrorResponse(
        'Suggestions Failed',
        'Unable to generate contextual suggestions'
      ));
    }
  }

  // Get AI service health status
  async getServiceHealth(req, res) {
    try {
      // Check if AI service is running
      const healthResponse = await axios.get("http://localhost:8000/health", {
        timeout: 5000
      });

      res.json(createResponse(
        'AI service health check successful',
        {
          status: 'healthy',
          service: 'ai',
          details: healthResponse.data
        }
      ));

    } catch (err) {
      console.error('AI health check error:', err.message);

      res.status(503).json(createResponse(
        'AI service health check',
        {
          status: 'unhealthy',
          service: 'ai',
          error: err.code === 'ECONNREFUSED' ? 'Service not running' : 'Service error'
        }
      ));
    }
  }
}

module.exports = new AIController();
