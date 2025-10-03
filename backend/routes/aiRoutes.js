// backend/routes/aiRoutes.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import the AI controller
const aiController = require('../controllers/aiController');

// Enhanced AI routes using the new controller

// @route POST /api/ai/analyze (Maps to getPrediction)
router.post('/analyze', aiController.getPrediction);

// @route POST /api/ai/rephrase (Maps to getRephrasingSuggestions)
router.post('/rephrase', aiController.getRephrasingSuggestions);

// @route POST /api/ai/education (Maps to getEducationalContent)
router.post('/education', aiController.getEducationalContent);

// @route POST /api/ai/suggestions (Maps to getContextualSuggestions)
router.post('/suggestions', aiController.getContextualSuggestions);

// @route GET /api/ai/health (Maps to getServiceHealth)
router.get('/health', aiController.getServiceHealth);

// Legacy route - kept for backward compatibility
router.post("/predict", async (req, res) => {
  try {
    const input = req.body;

    // Forward Authorization header from frontend request to AI service
    const headers = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Call AI server
    const aiResponse = await axios.post("http://localhost:8000/predict", input, { headers });

    res.json(aiResponse.data); // send AI response back to frontend
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "AI service failed" });
  }
});

module.exports = router;
