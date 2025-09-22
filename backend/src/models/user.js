// ==========================================
// 📁 src/models/User.js
// This defines how user data is stored in database
// ==========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Define what user data looks like
const userSchema = new mongoose.Schema({
  
  // Basic login info
  email: {
    type: String,
    required: true,
    unique: true, // No duplicate emails
    lowercase: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  username: {
    type: String,
    required: true,
    unique: true // No duplicate usernames
  },
  
  // User role (regular user or admin)
  role: {
    type: String,
    enum: ['user', 'admin'], // Only these two options allowed
    default: 'user'
  },
  
  // Unique ID for browser extension
  extensionId: {
    type: String,
    unique: true,
    default: () => uuidv4() // Generates random unique ID
  },
  
  // User profile information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  
  // User preferences
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: { type: Boolean, default: true },
      extension: { type: Boolean, default: true }
    }
  },
  
  // Account status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  // Basic stats for dashboard
  stats: {
    reportsCount: { type: Number, default: 0 },
    detectionsCount: { type: Number, default: 0 }
  }
  
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash if password is new or changed
  if (!this.isModified('password')) return next();
  
  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check if entered password matches stored password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to get user data for JWT token
userSchema.methods.getTokenData = function() {
  return {
    userId: this._id,
    role: this.role,
    extensionId: this.extensionId
  };
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;