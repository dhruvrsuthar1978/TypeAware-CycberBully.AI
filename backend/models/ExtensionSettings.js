// models/ExtensionSettings.js
const mongoose = require('mongoose');

const extensionSettingsSchema = new mongoose.Schema({
  // User identification
  userUuid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Core detection settings
  settings: {
    // Detection configuration
    detection: {
      enabled: { type: Boolean, default: true },
      sensitivityLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        default: 'medium' 
      },
      autoReport: { type: Boolean, default: false },
      requireConfirmation: { type: Boolean, default: true },
      detectOnPlatforms: [{
        platform: { type: String },
        enabled: { type: Boolean, default: true }
      }]
    },

    // Visual appearance
    appearance: {
      theme: { 
        type: String, 
        enum: ['light', 'dark', 'system'], 
        default: 'system' 
      },
      position: { 
        type: String, 
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], 
        default: 'bottom-right' 
      },
      showWarnings: { type: Boolean, default: true },
      warningStyle: { 
        type: String, 
        enum: ['minimal', 'standard', 'detailed'], 
        default: 'standard' 
      },
      animationsEnabled: { type: Boolean, default: true },
      fontSize: { 
        type: String, 
        enum: ['small', 'medium', 'large'], 
        default: 'medium' 
      }
    },

    // Notification preferences
    notifications: {
      enabled: { type: Boolean, default: true },
      types: {
        detectionAlert: { type: Boolean, default: true },
        reportConfirmation: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: false }
      },
      sound: {
        enabled: { type: Boolean, default: false },
        volume: { type: Number, min: 0, max: 1, default: 0.5 },
        tone: { 
          type: String, 
          enum: ['beep', 'chime', 'notification'], 
          default: 'beep' 
        }
      },
      desktop: {
        enabled: { type: Boolean, default: true },
        duration: { type: Number, default: 5000 } // milliseconds
      }
    },

    // Privacy settings
    privacy: {
      anonymousReporting: { type: Boolean, default: true },
      shareStatistics: { type: Boolean, default: true },
      allowDataCollection: { type: Boolean, default: true },
      shareWithResearchers: { type: Boolean, default: false },
      retainReports: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 365 }
    },

    // Behavior settings
    behavior: {
      showOnHover: { type: Boolean, default: true },
      autoHide: { type: Boolean, default: true },
      autoHideDelay: { type: Number, default: 3000 },
      doubleClickToReport: { type: Boolean, default: false },
      keyboardShortcuts: { type: Boolean, default: true },
      contextMenuIntegration: { type: Boolean, default: true }
    },

    // Advanced settings
    advanced: {
      debugMode: { type: Boolean, default: false },
      logLevel: { 
        type: String, 
        enum: ['error', 'warn', 'info', 'debug'], 
        default: 'error' 
      },
      enableBetaFeatures: { type: Boolean, default: false },
      customPatterns: [{
        name: { type: String },
        pattern: { type: String },
        enabled: { type: Boolean, default: true }
      }],
      apiEndpoint: { type: String },
      syncInterval: { type: Number, default: 300000 }, // 5 minutes
      maxOfflineReports: { type: Number, default: 100 }
    },

    // Performance settings
    performance: {
      enableCaching: { type: Boolean, default: true },
      cacheSize: { type: Number, default: 1000 }, // Number of cached items
      processingDelay: { type: Number, default: 500 }, // Delay before processing
      batchSize: { type: Number, default: 10 },
      enablePreprocessing: { type: Boolean, default: true }
    },

    // Platform-specific settings
    platformSettings: {
      twitter: {
        enabled: { type: Boolean, default: true },
        checkReplies: { type: Boolean, default: true },
        checkDMs: { type: Boolean, default: false },
        checkTrends: { type: Boolean, default: false }
      },
      youtube: {
        enabled: { type: Boolean, default: true },
        checkComments: { type: Boolean, default: true },
        checkLiveChat: { type: Boolean, default: true },
        checkDescriptions: { type: Boolean, default: false }
      },
      reddit: {
        enabled: { type: Boolean, default: true },
        checkPosts: { type: Boolean, default: true },
        checkComments: { type: Boolean, default: true },
        checkDMs: { type: Boolean, default: false }
      },
      facebook: {
        enabled: { type: Boolean, default: true },
        checkPosts: { type: Boolean, default: true },
        checkComments: { type: Boolean, default: true },
        checkMessages: { type: Boolean, default: false }
      }
    }
  },

  // Settings metadata
  version: { type: String, default: '1.0' },
  lastSyncedAt: { type: Date },
  syncedFrom: { type: String }, // Device/browser that last synced

  // Backup of previous settings
  previousSettings: { type: mongoose.Schema.Types.Mixed },
  settingsHistory: [{
    settings: { type: mongoose.Schema.Types.Mixed },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String }, // Extension version or admin
    reason: { type: String }
  }]
}, {
  timestamps: true,
  collection: 'extension_settings'
});

// Indexes
extensionSettingsSchema.index({ userUuid: 1 }, { unique: true });
extensionSettingsSchema.index({ updatedAt: -1 });
extensionSettingsSchema.index({ 'settings.privacy.shareStatistics': 1 });

// Virtual for settings summary
extensionSettingsSchema.virtual('summary').get(function() {
  return {
    detectionEnabled: this.settings?.detection?.enabled || false,
    sensitivityLevel: this.settings?.detection?.sensitivityLevel || 'medium',
    theme: this.settings?.appearance?.theme || 'system',
    notificationsEnabled: this.settings?.notifications?.enabled || true,
    privacyLevel: this.settings?.privacy?.anonymousReporting ? 'anonymous' : 'identified',
    platformsEnabled: this.getEnabledPlatformsCount()
  };
});

// Instance methods
extensionSettingsSchema.methods = {
  // Update specific setting
  updateSetting(path, value) {
    // Store previous settings before update
    this.previousSettings = JSON.parse(JSON.stringify(this.settings));
    
    // Update the setting
    this.set(`settings.${path}`, value);
    this.lastSyncedAt = new Date();
    
    // Add to history
    this.settingsHistory.push({
      settings: { [path]: value },
      changedAt: new Date(),
      reason: 'user_update'
    });
    
    return this.save();
  },

  // Reset to default settings
  resetToDefaults() {
    this.previousSettings = JSON.parse(JSON.stringify(this.settings));
    
    this.settings = {
      detection: {
        enabled: true,
        sensitivityLevel: 'medium',
        autoReport: false,
        requireConfirmation: true
      },
      appearance: {
        theme: 'system',
        position: 'bottom-right',
        showWarnings: true,
        warningStyle: 'standard'
      },
      notifications: {
        enabled: true,
        types: {
          detectionAlert: true,
          reportConfirmation: true,
          systemUpdates: true
        }
      },
      privacy: {
        anonymousReporting: true,
        shareStatistics: true,
        allowDataCollection: true
      }
    };

    this.settingsHistory.push({
      settings: this.settings,
      changedAt: new Date(),
      reason: 'reset_to_defaults'
    });

    return this.save();
  },

  // Get enabled platforms count
  getEnabledPlatformsCount() {
    const platformSettings = this.settings?.platformSettings || {};
    return Object.values(platformSettings).filter(platform => platform.enabled).length;
  },

  // Validate settings
  validateSettings() {
    const errors = [];
    
    // Check sensitivity level
    const validSensitivity = ['low', 'medium', 'high'];
    if (!validSensitivity.includes(this.settings?.detection?.sensitivityLevel)) {
      errors.push('Invalid sensitivity level');
    }
    
    // Check theme
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(this.settings?.appearance?.theme)) {
      errors.push('Invalid theme');
    }
    
    // Check notification sound volume
    const volume = this.settings?.notifications?.sound?.volume;
    if (volume !== undefined && (volume < 0 || volume > 1)) {
      errors.push('Sound volume must be between 0 and 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Export settings for backup
  exportSettings() {
    return {
      userUuid: this.userUuid,
      settings: this.settings,
      version: this.version,
      exportedAt: new Date(),
      settingsHash: this.generateSettingsHash()
    };
  },

  // Generate hash of current settings
  generateSettingsHash() {
    const crypto = require('crypto');
    const settingsString = JSON.stringify(this.settings);
    return crypto.createHash('md5').update(settingsString).digest('hex');
  },

  // Merge settings from another source
  mergeSettings(newSettings, source = 'unknown') {
    this.previousSettings = JSON.parse(JSON.stringify(this.settings));
    
    // Deep merge the settings
    this.settings = this.deepMerge(this.settings, newSettings);
    this.lastSyncedAt = new Date();
    this.syncedFrom = source;
    
    this.settingsHistory.push({
      settings: newSettings,
      changedAt: new Date(),
      changedBy: source,
      reason: 'settings_merge'
    });
    
    return this.save();
  },

  // Deep merge utility
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  },

  // Check if value is an object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
};

// Static methods
extensionSettingsSchema.statics = {
  // Get default settings
  getDefaultSettings() {
    return {
      detection: {
        enabled: true,
        sensitivityLevel: 'medium',
        autoReport: false,
        requireConfirmation: true,
        detectOnPlatforms: []
      },
      appearance: {
        theme: 'system',
        position: 'bottom-right',
        showWarnings: true,
        warningStyle: 'standard',
        animationsEnabled: true,
        fontSize: 'medium'
      },
      notifications: {
        enabled: true,
        types: {
          detectionAlert: true,
          reportConfirmation: true,
          systemUpdates: true,
          weeklyDigest: false
        },
        sound: {
          enabled: false,
          volume: 0.5,
          tone: 'beep'
        },
        desktop: {
          enabled: true,
          duration: 5000
        }
      },
      privacy: {
        anonymousReporting: true,
        shareStatistics: true,
        allowDataCollection: true,
        shareWithResearchers: false,
        retainReports: true,
        dataRetentionDays: 365
      },
      behavior: {
        showOnHover: true,
        autoHide: true,
        autoHideDelay: 3000,
        doubleClickToReport: false,
        keyboardShortcuts: true,
        contextMenuIntegration: true
      },
      advanced: {
        debugMode: false,
        logLevel: 'error',
        enableBetaFeatures: false,
        customPatterns: [],
        syncInterval: 300000,
        maxOfflineReports: 100
      },
      performance: {
        enableCaching: true,
        cacheSize: 1000,
        processingDelay: 500,
        batchSize: 10,
        enablePreprocessing: true
      },
      platformSettings: {
        twitter: { enabled: true, checkReplies: true, checkDMs: false },
        youtube: { enabled: true, checkComments: true, checkLiveChat: true },
        reddit: { enabled: true, checkPosts: true, checkComments: true },
        facebook: { enabled: true, checkPosts: true, checkComments: true }
      }
    };
  },

  // Find or create settings for user
  async findOrCreateForUser(userUuid) {
    let settings = await this.findOne({ userUuid });
    
    if (!settings) {
      settings = new this({
        userUuid,
        settings: this.getDefaultSettings(),
        version: '1.0'
      });
      await settings.save();
    }
    
    return settings;
  },

  // Get settings statistics
  async getSettingsStats() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          detectionEnabled: {
            $sum: { $cond: ['$settings.detection.enabled', 1, 0] }
          },
          anonymousReporting: {
            $sum: { $cond: ['$settings.privacy.anonymousReporting', 1, 0] }
          },
          shareStatistics: {
            $sum: { $cond: ['$settings.privacy.shareStatistics', 1, 0] }
          },
          themeDistribution: {
            $push: '$settings.appearance.theme'
          },
          sensitivityDistribution: {
            $push: '$settings.detection.sensitivityLevel'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalUsers: 0,
        detectionEnabled: 0,
        anonymousReporting: 0,
        shareStatistics: 0,
        themeDistribution: {},
        sensitivityDistribution: {}
      };
    }

    const result = stats[0];
    
    // Process distributions
    result.themeDistribution = this.createDistribution(result.themeDistribution);
    result.sensitivityDistribution = this.createDistribution(result.sensitivityDistribution);

    return result;
  },

  // Helper to create distribution object
  createDistribution(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }
};

// Pre-save middleware
extensionSettingsSchema.pre('save', function(next) {
  // Validate settings before saving
  const validation = this.validateSettings();
  if (!validation.isValid) {
    return next(new Error(`Invalid settings: ${validation.errors.join(', ')}`));
  }
  
  // Limit history size
  if (this.settingsHistory.length > 50) {
    this.settingsHistory = this.settingsHistory.slice(-50);
  }
  
  next();
});

// Post-save middleware
extensionSettingsSchema.post('save', function(doc) {
  if (doc.isNew) {
    console.log(`⚙️ New extension settings created for user ${doc.userUuid}`);
  }
});

const ExtensionSettings = mongoose.model('ExtensionSettings', extensionSettingsSchema);

module.exports = ExtensionSettings;