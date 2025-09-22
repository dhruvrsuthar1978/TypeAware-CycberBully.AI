// ==========================================
// 📁 server.js - Updated Main server file
// This connects everything together
// ==========================================

// Load environment variables first
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const routes = require('./src/routes'); // Import our API routes

// Create Express app
const app = express();

// Get port from environment or use 5000
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware (these run for every request)
app.use(cors()); // Allow React app to connect
app.use(express.json()); // Parse JSON data from requests

// Basic route to test if server is working
app.get('/', (req, res) => {
  res.json({
    message: '🚀 TypeAware Backend is running!',
    version: '1.0.0',
    level: 'MVP Core',
    status: 'active',
    endpoints: {
      api: '/api',
      docs: '/api/',
      health: '/health'
    }
  });
});

// API Routes - All routes starting with /api will use our routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    service: 'TypeAware Backend'
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/auth/verify'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('🚀==================================🚀');
  console.log(`   TypeAware Server Started!`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('🚀==================================🚀');
  console.log('📋 Available API Endpoints:');
  console.log('   POST /api/auth/register - Create account');
  console.log('   POST /api/auth/login    - Login');
  console.log('   GET  /api/auth/profile  - Get profile');
  console.log('   GET  /api/auth/verify   - Verify token');
  console.log('🚀==================================🚀');
});