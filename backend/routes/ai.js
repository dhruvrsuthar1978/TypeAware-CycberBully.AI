const express = require("express");
const axios = require("axios"); // lets backend talk to AI
const router = express.Router();

// Example route
router.post("/ai/predict", async (req, res) => {
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
