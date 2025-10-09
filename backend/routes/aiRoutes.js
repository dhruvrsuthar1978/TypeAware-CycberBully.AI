// backend/routes/aiRoutes.js

const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const aiController = AIController;


// -------------------------
// AI Analysis Routes
// -------------------------

// POST /api/ai/analyze - Analyze content using Ollama
router.post('/analyze', aiController.analyzeContent);

// POST /api/ai/predict - Legacy predict endpoint (redirects to analyze)
router.post('/predict', aiController.getPrediction);

// POST /api/ai/rephrase - Get rephrasing suggestions
router.post('/rephrase', aiController.getRephrasingSuggestions);

// POST /api/ai/education - Get educational content
router.post('/education', aiController.getEducationalContent);

// POST /api/ai/suggestions - Get contextual suggestions
router.post('/suggestions', aiController.getContextualSuggestions);

// GET /api/ai/health - AI service health check
router.get('/health', aiController.getServiceHealth);

module.exports = router;
