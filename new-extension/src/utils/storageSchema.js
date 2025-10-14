// Unified storage schema for TypeAware extension
// This ensures consistent data structure across background and popup scripts

const STORAGE_SCHEMA = {
  // User identification
  uuid: null, // string - unique user identifier

  // Extension state
  enabled: true, // boolean - whether extension is enabled

  // Statistics
  stats: {
    totalScanned: 0, // number - total messages scanned
    threatsDetected: 0, // number - total threats detected
    reportsSubmitted: 0 // number - total reports submitted
  },

  // Detection history (recent detections for popup display)
  detections: [], // array of detection objects with structure:
  // {
  //   types: ["harassment"], // array of detection types
  //   content: "detected text", // string - truncated content
  //   platform: "twitter", // string - platform name
  //   timestamp: 1234567890 // number - unix timestamp
  // }

  // Reports (user-submitted reports)
  reports: [] // array of report objects with structure:
  // {
  //   content: "reported content", // string
  //   category: "harassment", // string
  //   platform: "twitter", // string
  //   url: "https://...", // string
  //   timestamp: "2024-01-01T00:00:00.000Z", // ISO string
  //   userUUID: "uuid-string", // string
  //   extensionVersion: "1.0.0" // string
  // }
};

// Validation functions
const validateStats = (stats) => {
  return (
    typeof stats === 'object' &&
    typeof stats.totalScanned === 'number' &&
    typeof stats.threatsDetected === 'number' &&
    typeof stats.reportsSubmitted === 'number' &&
    stats.totalScanned >= 0 &&
    stats.threatsDetected >= 0 &&
    stats.reportsSubmitted >= 0
  );
};

const validateDetection = (detection) => {
  return (
    typeof detection === 'object' &&
    Array.isArray(detection.types) &&
    typeof detection.content === 'string' &&
    typeof detection.platform === 'string' &&
    typeof detection.timestamp === 'number'
  );
};

const validateReport = (report) => {
  return (
    typeof report === 'object' &&
    typeof report.content === 'string' &&
    typeof report.category === 'string' &&
    typeof report.platform === 'string' &&
    typeof report.url === 'string' &&
    typeof report.timestamp === 'string' &&
    typeof report.userUUID === 'string' &&
    typeof report.extensionVersion === 'string'
  );
};

// Storage utilities
const StorageUtils = {
  // Get data with schema validation
  async get(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || STORAGE_SCHEMA[key];
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return STORAGE_SCHEMA[key];
    }
  },

  // Set data with validation
  async set(key, value) {
    try {
      // Validate data based on key
      if (key === 'stats' && !validateStats(value)) {
        throw new Error('Invalid stats structure');
      }
      if (key === 'detections' && !Array.isArray(value)) {
        throw new Error('Detections must be an array');
      }
      if (key === 'reports' && !Array.isArray(value)) {
        throw new Error('Reports must be an array');
      }

      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  // Update stats atomically
  async updateStats(updates) {
    try {
      const currentStats = await this.get('stats');
      const newStats = {
        totalScanned: currentStats.totalScanned + (updates.totalScanned || 0),
        threatsDetected: currentStats.threatsDetected + (updates.threatsDetected || 0),
        reportsSubmitted: currentStats.reportsSubmitted + (updates.reportsSubmitted || 0)
      };

      return await this.set('stats', newStats);
    } catch (error) {
      console.error('Error updating stats:', error);
      return false;
    }
  },

  // Add detection to history
  async addDetection(detection) {
    if (!validateDetection(detection)) {
      console.error('Invalid detection structure:', detection);
      return false;
    }

    try {
      const detections = await this.get('detections');
      detections.unshift(detection); // Add to beginning

      // Keep only last 50 detections
      if (detections.length > 50) {
        detections.splice(50);
      }

      return await this.set('detections', detections);
    } catch (error) {
      console.error('Error adding detection:', error);
      return false;
    }
  },

  // Add report
  async addReport(report) {
    if (!validateReport(report)) {
      console.error('Invalid report structure:', report);
      return false;
    }

    try {
      const reports = await this.get('reports');
      reports.push(report);

      // Keep only last 100 reports
      if (reports.length > 100) {
        reports.splice(0, reports.length - 100);
      }

      return await this.set('reports', reports);
    } catch (error) {
      console.error('Error adding report:', error);
      return false;
    }
  },

  // Clear all data
  async clear() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

export { STORAGE_SCHEMA, StorageUtils, validateStats, validateDetection, validateReport };
