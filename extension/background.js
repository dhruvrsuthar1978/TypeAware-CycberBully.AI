// Backend API configuration
const BACKEND_URL = 'http://localhost:5000'; // Change this to your production URL

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize default storage
  const data = await chrome.storage.local.get(['stats', 'enabled', 'userUuid', 'apiKey']);

  if (!data.stats) {
    await chrome.storage.local.set({
      stats: {
        totalScanned: 0,
        threatsDetected: 0,
        reportsSubmitted: 0
      }
    });
  }

  if (data.enabled === undefined) {
    await chrome.storage.local.set({ enabled: true });
  }

  // Initialize detections array if needed
  const detData = await chrome.storage.local.get(['detections']);
  if (!detData.detections) {
    await chrome.storage.local.set({ detections: [] });
  }

  // Generate user UUID if not exists
  if (!data.userUuid) {
    const userUuid = generateUserUuid();
    await chrome.storage.local.set({ userUuid });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    updateStats(request.data).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'addDetection') {
    addDetection(request.detection).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getStats') {
    chrome.storage.local.get(['stats'], (result) => {
      sendResponse({ stats: result.stats });
    });
    return true;
  }

  if (request.action === 'analyzeContent') {
    analyzeContentWithAI(request.content, request.context).then((result) => {
      sendResponse({ result });
    });
    return true;
  }

  if (request.action === 'submitReport') {
    submitReportToBackend(request.reportData).then((result) => {
      sendResponse({ result });
    });
    return true;
  }
});

// Update stats
async function updateStats(updates) {
  const result = await chrome.storage.local.get(['stats']);
  const stats = result.stats || { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 };

  stats.totalScanned += updates.totalScanned || 0;
  stats.threatsDetected += updates.threatsDetected || 0;
  stats.reportsSubmitted += updates.reportsSubmitted || 0;

  await chrome.storage.local.set({ stats });
}

// Add detection to history
async function addDetection(detection) {
  const result = await chrome.storage.local.get(['detections']);
  let detections = result.detections || [];

  detections.unshift(detection);

  // Keep only last 100 detections
  if (detections.length > 100) {
    detections = detections.slice(0, 100);
  }

  await chrome.storage.local.set({ detections });
}

// Generate unique user UUID
function generateUserUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API communication functions
async function analyzeContentWithAI(content, context = {}) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        context: {
          ...context,
          source: 'extension',
          platform: getPlatformFromUrl(context.url)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

async function submitReportToBackend(reportData) {
  try {
    const { userUuid } = await chrome.storage.local.get(['userUuid']);

    const response = await fetch(`${BACKEND_URL}/api/extension/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-id': chrome.runtime.id,
        'x-extension-version': chrome.runtime.getManifest().version,
        'x-user-uuid': userUuid
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      throw new Error(`Report submission failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Report submission error:', error);
    return null;
  }
}

async function pingBackend() {
  try {
    const { userUuid } = await chrome.storage.local.get(['userUuid']);

    const response = await fetch(`${BACKEND_URL}/api/extension/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-id': chrome.runtime.id,
        'x-extension-version': chrome.runtime.getManifest().version,
        'x-user-uuid': userUuid
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Backend ping error:', error);
    return false;
  }
}

function getPlatformFromUrl(url) {
  if (!url) return 'web';
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('reddit')) return 'reddit';
  if (hostname.includes('youtube')) return 'youtube';
  if (hostname.includes('facebook')) return 'facebook';
  if (hostname.includes('instagram')) return 'instagram';
  if (hostname.includes('tiktok')) return 'tiktok';
  return 'web';
}
