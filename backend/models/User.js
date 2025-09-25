const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  browserUUIDs: [{
    uuid: {
      type: String,
      required: true
    },
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    userAgent: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  preferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    emailUpdates: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  stats: {
    totalReports: {
      type: Number,
      default: 0,
      min: 0
    },
    totalScans: {
      type: Number,
      default: 0,
      min: 0
    },
    threatsDetected: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'browserUUIDs.uuid': 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to add browser UUID
userSchema.methods.addBrowserUUID = function(uuid, userAgent = '') {
  const existingUUID = this.browserUUIDs.find(b => b.uuid === uuid);
  
  if (existingUUID) {
    existingUUID.lastSeen = new Date();
    existingUUID.isActive = true;
    if (userAgent) existingUUID.userAgent = userAgent;
  } else {
    this.browserUUIDs.push({
      uuid,
      userAgent,
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Instance method to update stats
userSchema.methods.updateStats = function(statsUpdate) {
  if (statsUpdate.totalReports) this.stats.totalReports += statsUpdate.totalReports;
  if (statsUpdate.totalScans) this.stats.totalScans += statsUpdate.totalScans;
  if (statsUpdate.threatsDetected) this.stats.threatsDetected += statsUpdate.threatsDetected;
  
  this.stats.lastActivity = new Date();
  return this.save();
};

// Static method to find by browser UUID
userSchema.statics.findByBrowserUUID = function(uuid) {
  return this.findOne({ 'browserUUIDs.uuid': uuid });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.username;
});

module.exports = mongoose.model('User', userSchema);