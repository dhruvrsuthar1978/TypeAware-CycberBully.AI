
// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('TypeAware extension installed');
  
  // Initialize storage with default values
  const result = await chrome.storage.local.get(['uuid', 'stats', 'enabled']);
  
  if (!result.uuid) {
    const uuid = generateUUID();
    await chrome.storage.local.set({ uuid });
  }
  
  if (!result.stats) {
    await chrome.storage.local.set({
      stats: {
        totalScanned: 0,
        threatsDetected: 0,
        reportsSubmitted: 0
      }
    });
  }
  
  if (result.enabled === undefined) {
    await chrome.storage.local.set({ enabled: true });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'updateStats':
      updateStats(request.data);
      break;
      
    case 'reportContent':
      reportContent(request.data);
      break;
      
    case 'getUUID':
      getUUID().then(uuid => sendResponse({ uuid }));
      return true;
      
    default:
      break;
  }
});

// Generate a unique UUID for the browser
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get stored UUID
async function getUUID() {
  const result = await chrome.storage.local.get(['uuid']);
  return result.uuid;
}

// Update extension statistics
async function updateStats(data) {
  const result = await chrome.storage.local.get(['stats']);
  const currentStats = result.stats || {
    totalScanned: 0,
    threatsDetected: 0,
    reportsSubmitted: 0
  };
  
  const updatedStats = {
    ...currentStats,
    ...data
  };
  
  await chrome.storage.local.set({ stats: updatedStats });
}

// Report content to TypeAware system
async function reportContent(data) {
  try {
    const uuid = await getUUID();
    
    const reportData = {
      ...data,
      userUUID: uuid,
      timestamp: new Date().toISOString(),
      extensionVersion: chrome.runtime.getManifest().version
    };
    
    // Store report locally
    const result = await chrome.storage.local.get(['reports']);
    const reports = result.reports || [];
    reports.push(reportData);
    
    // Keep only last 100 reports
    if (reports.length > 100) {
      reports.splice(0, reports.length - 100);
    }
    
    await chrome.storage.local.set({ reports });
    
    // In a real implementation, this would send to TypeAware API
    console.log('Content reported:', reportData);
    
    // Update stats
    await updateStats({ reportsSubmitted: (await chrome.storage.local.get(['stats'])).stats.reportsSubmitted + 1 });
    
  } catch (error) {
    console.error('Error reporting content:', error);
  }
}

// Clean up old data periodically
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

async function cleanupOldData() {
  const result = await chrome.storage.local.get(['detections', 'reports']);
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Clean old detections
  if (result.detections) {
    const filteredDetections = result.detections.filter(
      detection => new Date(detection.timestamp) > oneWeekAgo
    );
    await chrome.storage.local.set({ detections: filteredDetections });
  }
  
  // Clean old reports
  if (result.reports) {
    const filteredReports = result.reports.filter(
      report => new Date(report.timestamp) > oneWeekAgo
    );
    await chrome.storage.local.set({ reports: filteredReports });
  }
}
