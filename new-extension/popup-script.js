// Load stats
async function loadStats() {
  try {
    const data = await chrome.storage.local.get(['stats', 'detections', 'enabled']);

    const stats = data.stats || { totalScanned: 0, threatsDetected: 0 };
    document.getElementById('scanned').textContent = stats.totalScanned || 0;
    document.getElementById('threats').textContent = stats.threatsDetected || 0;

    const enabled = data.enabled !== false;
    document.getElementById('status').textContent = enabled ? 'ON' : 'OFF';
    document.getElementById('status').style.background = enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    document.getElementById('status').style.borderColor = enabled ? '#10b981' : '#ef4444';
    document.getElementById('status').style.color = enabled ? '#10b981' : '#ef4444';

    const detections = data.detections || [];
    const detectionsDiv = document.getElementById('detections');

    if (detections.length === 0) {
      detectionsDiv.innerHTML = '<div class="no-detections">No recent detections</div>';
    } else {
      detectionsDiv.innerHTML = detections.slice(0, 5).map(d => `
        <div class="detection-item">
          <strong>${d.types ? d.types[0] : 'Unknown'}</strong> - ${d.platform || 'web'}<br>
          <small>${new Date(d.timestamp).toLocaleString()}</small>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Status toggle
document.getElementById('status').addEventListener('click', async () => {
  try {
    const data = await chrome.storage.local.get(['enabled']);
    const newEnabled = !(data.enabled !== false);
    await chrome.storage.local.set({ enabled: newEnabled });
    loadStats();
    console.log('Extension toggled to:', newEnabled ? 'ON' : 'OFF');
  } catch (error) {
    console.error('Error toggling status:', error);
  }
});

// Scan messages button
document.getElementById('scanBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Send message to content script to scan messages
      chrome.tabs.sendMessage(tab.id, { action: 'scanMessages' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not loaded on this page');
        } else {
          console.log('Scanning messages on:', tab.url);
        }
      });
    }
  } catch (error) {
    console.error('Error scanning messages:', error);
  }
});

// Check threats button
document.getElementById('threatBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Send message to content script to check threats
      chrome.tabs.sendMessage(tab.id, { action: 'checkThreats' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not loaded on this page');
        } else {
          console.log('Checking threats on:', tab.url);
        }
      });
    }
  } catch (error) {
    console.error('Error checking threats:', error);
  }
});

// Dashboard button
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:8080/dashboard' });
});

// Clear data button
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (confirm('Clear all detection data?')) {
    try {
      await chrome.storage.local.set({
        detections: [],
        stats: { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 }
      });
      loadStats();
      console.log('Data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
});

// Load on open
loadStats();

// Refresh every 2 seconds
setInterval(loadStats, 2000);