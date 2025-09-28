// config/database.js
const mongoose = require('mongoose');

class DatabaseConfig {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  // Get MongoDB connection URI
  getConnectionURI() {
    const {
      MONGODB_URI,
      MONGODB_HOST = 'localhost',
      MONGODB_PORT = '27017',
      MONGODB_DATABASE = 'typeaware',
      MONGODB_USERNAME,
      MONGODB_PASSWORD
    } = process.env;

    // Use MONGODB_URI if provided (for production/cloud)
    if (MONGODB_URI) {
      return MONGODB_URI;
    }

    // Build URI from individual components
    let uri = 'mongodb://';
    
    if (MONGODB_USERNAME && MONGODB_PASSWORD) {
      uri += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
    }
    
    uri += `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
    
    return uri;
  }

  // Get connection options
  getConnectionOptions() {
    return {
      // Connection options
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      family: 4, // Use IPv4, skip trying IPv6
      
      // Buffering options
      bufferMaxEntries: 0,
      bufferCommands: false,
      
      // Write concern
      w: 'majority',
      wtimeoutMS: 5000,
      
      // Read concern
      readConcern: { level: 'majority' },
      
      // Additional options
      retryWrites: true,
      retryReads: true,
      compressors: ['snappy', 'zlib']
    };
  }

  // Connect to MongoDB
  async connect() {
    if (this.isConnected) {
      console.log('📊 Database already connected');
      return this.connection;
    }

    try {
      const uri = this.getConnectionURI();
      const options = this.getConnectionOptions();

      console.log('📊 Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(uri, options);
      this.isConnected = true;

      console.log(`📊 MongoDB connected successfully to: ${mongoose.connection.name}`);
      
      // Set up event listeners
      this.setupEventListeners();
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  // Setup event listeners for connection monitoring
  setupEventListeners() {
    const db = mongoose.connection;

    db.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      console.log('📊 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  // Disconnect from MongoDB
  async disconnect() {
    if (!this.isConnected) {
      console.log('📊 Database already disconnected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📊 MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  // Check connection health
  async checkHealth() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database is not connected'
        };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        message: 'Database connection is healthy',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Get database statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const stats = await mongoose.connection.db.stats();
      
      return {
        database: mongoose.connection.name,
        collections: stats.collections,
        dataSize: this.formatBytes(stats.dataSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexes: stats.indexes,
        indexSize: this.formatBytes(stats.indexSize),
        objects: stats.objects
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Create database indexes for better performance
  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');

      // User indexes
      await mongoose.connection.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { uuid: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { createdAt: 1 } },
        { key: { lastActiveAt: 1 } }
      ]);

      // Report indexes
      await mongoose.connection.collection('reports').createIndexes([
        { key: { reporterUuid: 1 } },
        { key: { flaggedUserUuid: 1 } },
        { key: { platform: 1 } },
        { key: { flagReason: 1 } },
        { key: { createdAt: -1 } },
        { key: { platform: 1, createdAt: -1 } },
        { key: { flagReason: 1, createdAt: -1 } }
      ]);

      // Analytics indexes
      await mongoose.connection.collection('analytics').createIndexes([
        { key: { period: 1, startTime: 1 } },
        { key: { period: 1, endTime: 1 } },
        { key: { startTime: 1, endTime: 1 } },
        { key: { calculatedAt: -1 } }
      ]);

      // Audit log indexes
      await mongoose.connection.collection('auditlogs').createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        { key: { action: 1 } },
        { key: { createdAt: -1 } }
      ]);

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  // Utility method to format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get connection state as string
  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return states[mongoose.connection.readyState] || 'unknown';
  }

  // Backup database (basic implementation)
  async createBackup(backupName) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      console.log(`📊 Creating database backup: ${backupName}`);
      
      // This is a basic implementation
      // In production, you'd use mongodump or a proper backup service
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backup = {
        timestamp: new Date(),
        database: mongoose.connection.name,
        collections: collections.length,
        name: backupName
      };

      // Store backup info (in a real implementation, you'd export actual data)
      console.log('✅ Backup completed:', backup);
      return backup;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseConfig();