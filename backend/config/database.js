const mongoose = require('mongoose');

/**
 * Database configuration and connection setup
 */
const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/typeaware';
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error closing mongoose connection:', error);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Database health check function
 */
const checkDatabaseHealth = async () => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Perform a simple query to test the connection
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      readyState: mongoose.connection.readyState,
      timestamp: new Date()
    };
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      objects: stats.objects,
      indexes: stats.indexes,
      fileSize: stats.fileSize || 0,
      fsTotalSize: stats.fsTotalSize || 0,
      fsUsedSize: stats.fsUsedSize || 0
    };
    
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Report = require('../models/Report');

    console.log('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { sparse: true });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });

    // Report indexes
    await Report.collection.createIndex({ browserUUID: 1 });
    await Report.collection.createIndex({ userId: 1 });
    await Report.collection.createIndex({ timestamp: -1 });
    await Report.collection.createIndex({ status: 1 });
    await Report.collection.createIndex({ detectedType: 1 });
    await Report.collection.createIndex({ platform: 1 });
    await Report.collection.createIndex({ confidence: 1 });
    
    // Compound indexes for common query patterns
    await Report.collection.createIndex({ browserUUID: 1, timestamp: -1 });
    await Report.collection.createIndex({ status: 1, timestamp: -1 });
    await Report.collection.createIndex({ detectedType: 1, timestamp: -1 });
    await Report.collection.createIndex({ platform: 1, timestamp: -1 });

    console.log('Database indexes created successfully');

  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't exit process, indexes are not critical for startup
  }
};

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    const User = require('../models/User');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Create default admin user
      const defaultAdmin = new User({
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@typeaware.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        username: 'admin',
        role: 'admin',
        status: 'active'
      });

      await defaultAdmin.save();
      console.log('Default admin user created');
      console.log('Email:', defaultAdmin.email);
      console.log('Please change the default password immediately!');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

/**
 * Cleanup old data (can be run as a scheduled job)
 */
const cleanupOldData = async (days = 90) => {
  try {
    const Report = require('../models/Report');
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Delete old dismissed reports
    const result = await Report.deleteMany({
      status: 'dismissed',
      timestamp: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} old dismissed reports`);
    return result.deletedCount;

  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return 0;
  }
};

module.exports = {
  connectDB,
  checkDatabaseHealth,
  getDatabaseStats,
  createIndexes,
  initializeDatabase,
  cleanupOldData
};