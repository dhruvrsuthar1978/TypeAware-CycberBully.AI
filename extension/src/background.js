// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("TypeAware extension installed");

  // Get existing data
  const data = await chrome.storage.local.get(["uuid", "stats", "enabled"]);

  // Generate UUID if not exists
  if (!data.uuid) {
    const uuid = generateUUID();
    await chrome.storage.local.set({ uuid });
  }

  // Initialize stats if not exists
  if (!data.stats) {
    await chrome.storage.local.set({
      stats: {
        totalScanned: 0,
        threatsDetected: 0,
        reportsSubmitted: 0
      }
    });
  }

  // Initialize enabled state
  if (data.enabled === undefined) {
    await chrome.storage.local.set({ enabled: true });
  }

  // Set up cleanup alarm (runs every 60 minutes)
  chrome.alarms.create("cleanup", { periodInMinutes: 60 });

  console.log("TypeAware extension initialized");
});

// Generate UUID v4
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 3 | 8);
    return v.toString(16);
  });
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "updateStats":
      updateStats(request.data);
      sendResponse({ success: true });
      break;

    case "reportContent":
      reportContent(request.data);
      sendResponse({ success: true });
      break;

    case "getStats":
      getStats().then(stats => sendResponse({ stats }));
      return true; // Keep channel open for async response

    case "getUUID":
      getUUID().then(uuid => sendResponse({ uuid }));
      return true;

    default:
      sendResponse({ error: "Unknown action" });
  }
});

// Get current stats
async function getStats() {
  const data = await chrome.storage.local.get(["stats"]);
  return data.stats || {
    totalScanned: 0,
    threatsDetected: 0,
    reportsSubmitted: 0
  };
}

// Update stats atomically
async function updateStats(updates) {
  const data = await chrome.storage.local.get(["stats"]);
  const currentStats = data.stats || {
    totalScanned: 0,
    threatsDetected: 0,
    reportsSubmitted: 0
  };

  // Merge updates
  const newStats = {
    totalScanned: currentStats.totalScanned + (updates.totalScanned || 0),
    threatsDetected: currentStats.threatsDetected + (updates.threatsDetected || 0),
    reportsSubmitted: currentStats.reportsSubmitted + (updates.reportsSubmitted || 0)
  };

  await chrome.storage.local.set({ stats: newStats });
  console.log("Stats updated:", newStats);

  // Notify popup of update
  notifyPopupOfUpdate(newStats);
}

// Get UUID
async function getUUID() {
  const data = await chrome.storage.local.get(["uuid"]);
  return data.uuid || null;
}

// Report content to backend (or local storage)
async function reportContent(data) {
  try {
    const uuid = await getUUID();

    const report = {
      ...data,
      userUUID: uuid,
      timestamp: new Date().toISOString(),
      extensionVersion: chrome.runtime.getManifest().version
    };

    // Store report locally
    const storedData = await chrome.storage.local.get(["reports"]);
    const reports = storedData.reports || [];

    reports.push(report);

    // Keep only last 100 reports
    if (reports.length > 100) {
      reports.splice(0, reports.length - 100);
    }

    await chrome.storage.local.set({ reports });

    console.log("Content reported:", report);

    // Update report stats
    await updateStats({ reportsSubmitted: 1 });

  } catch (error) {
    console.error("Error reporting content:", error);
  }
}

// Notify popup when stats change
function notifyPopupOfUpdate(stats) {
  chrome.runtime.sendMessage({
    action: "statsUpdated",
    stats: stats
  }).catch(() => {
    // Popup not open, that's fine
  });
}

// Clean up old data periodically
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    cleanupOldData();
  }
});

async function cleanupOldData() {
  try {
    const data = await chrome.storage.local.get(["detections", "reports"]);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Clean detections older than 7 days
    if (data.detections) {
      const recentDetections = data.detections.filter(
        detection => new Date(detection.timestamp) > sevenDaysAgo
      );
      await chrome.storage.local.set({ detections: recentDetections });
    }

    // Clean reports older than 7 days
    if (data.reports) {
      const recentReports = data.reports.filter(
        report => new Date(report.timestamp) > sevenDaysAgo
      );
      await chrome.storage.local.set({ reports: recentReports });
    }

    console.log("Cleanup completed");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}