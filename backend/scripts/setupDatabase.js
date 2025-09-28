// scripts/setupDatabase.js
// Database setup script for TypeAware - Creates collections and indexes

const mongoose = require('mongoose');
require('dotenv').config();

// Import all your models to ensure they're registered
const User = require('../models/User');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Analytics = require('../models/Analytics');
const ExtensionInstallation = require('../models/ExtensionInstallation');
const ExtensionSettings = require('../models/ExtensionSettings');
const ExtensionActivity = require('../models/ExtensionActivity');
const ExtensionError = require('../models/ExtensionError');
const ExtensionFeedback = require('../models/ExtensionFeedback');

async function setupDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/typeaware';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create collections explicitly (if they don't exist)
    const collections = [
      'users',
      'reports', 
      'auditlogs',
      'analytics',
      'extension_installations',
      'extension_settings',
      'extension_activities',
      'extension_errors',
      'extension_feedback'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.createCollection(collectionName);
        console.log(`Collection '${collectionName}' created`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`Collection '${collectionName}' already exists`);
        } else {
          console.error(`Error creating collection '${collectionName}':`, error.message);
        }
      }
    }

    // Create indexes for better performance
    console.log('\nCreating database indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ uuid: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ createdAt: 1 });
    await User.collection.createIndex({ lastActiveAt: -1 });
    console.log('User indexes created');

    // Report indexes
    await Report.collection.createIndex({ reporterUuid: 1 });
    await Report.collection.createIndex({ flaggedUserUuid: 1 });
    await Report.collection.createIndex({ platform: 1 });
    await Report.collection.createIndex({ flagReason: 1 });
    await Report.collection.createIndex({ status: 1 });
    await Report.collection.createIndex({ createdAt: -1 });
    await Report.collection.createIndex({ platform: 1, createdAt: -1 });
    await Report.collection.createIndex({ flagReason: 1, createdAt: -1 });
    console.log('Report indexes created');

    // Analytics indexes
    await Analytics.collection.createIndex({ period: 1, startTime: 1 });
    await Analytics.collection.createIndex({ calculatedAt: -1 });
    console.log('Analytics indexes created');

    // Extension indexes
    await ExtensionInstallation.collection.createIndex({ extensionId: 1, userUuid: 1 }, { unique: true });
    await ExtensionInstallation.collection.createIndex({ status: 1, lastActiveAt: -1 });
    await ExtensionSettings.collection.createIndex({ userUuid: 1 }, { unique: true });
    await ExtensionActivity.collection.createIndex({ extensionId: 1, timestamp: -1 });
    await ExtensionActivity.collection.createIndex({ userUuid: 1, timestamp: -1 });
    await ExtensionError.collection.createIndex({ extensionId: 1, reportedAt: -1 });
    await ExtensionFeedback.collection.createIndex({ extensionId: 1, submittedAt: -1 });
    console.log('Extension indexes created');

    // Audit log indexes
    await AuditLog.collection.createIndex({ userId: 1, createdAt: -1 });
    await AuditLog.collection.createIndex({ action: 1 });
    await AuditLog.collection.createIndex({ createdAt: -1 });
    console.log('Audit log indexes created');

    console.log('\n✅ Database setup completed successfully!');
    
    // Display collection stats
    const stats = await mongoose.connection.db.stats();
    console.log('\nDatabase Statistics:');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;