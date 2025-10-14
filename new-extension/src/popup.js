// Import storage utilities
import { StorageUtils } from './utils/storageSchema.js';

// Ensure DOM is loaded before accessing elements
function initPopup() {
  console.log('Popup script loaded');

  // Load stats on popup open
  loadStats();

  // Setup event listeners
  setupEventListeners();

  // Listen for stats updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'statsUpdated') {
      updateStatsDisplay(message.stats);
    }
  });

  // Refresh stats every 2 seconds
  setInterval(loadStats, 2000);
}

// Load and display stats from storage
async function loadStats() {
  try {
    const stats = await StorageUtils.get('stats');
    const detections = await StorageUtils.get('detections');
    const enabled = await StorageUtils.get('enabled');

    updateStatsDisplay(stats);
    updateStatusDisplay(enabled);
    updateDetectionsDisplay(detections);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Update stats display
function updateStatsDisplay(stats) {
  const scannedEl = document.getElementById('scanned');
  const threatsEl = document.getElementById('threats');

  if (scannedEl) scannedEl.textContent = stats.totalScanned || 0;
  if (threatsEl) threatsEl.textContent = stats.threatsDetected || 0;
}

// Update status display
function updateStatusDisplay(enabled) {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = enabled ? 'ON' : 'OFF';
    statusEl.style.background = enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    statusEl.style.borderColor = enabled ? '#10b981' : '#ef4444';
    statusEl.style.color = enabled ? '#10b981' : '#ef4444';
  }
}

// Update detections display
function updateDetectionsDisplay(detections) {
  const detectionsDiv = document.getElementById('detections');

  if (detectionsDiv) {
    if (!detections || detections.length === 0) {
      detectionsDiv.innerHTML = '<div class="no-detections">No recent detections</div>';
    } else {
      detectionsDiv.innerHTML = detections.slice(0, 5).map(d => `
        <div class="detection-item">
          <strong>${d.types ? d.types[0] : 'Unknown'}</strong> - ${d.platform || 'web'}<br>
          <small>${new Date(d.timestamp).toLocaleString()}</small>
        </div>
      `).join('');
    }
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Status toggle
  const statusBtn = document.getElementById('status');
  if (statusBtn) {
    statusBtn.addEventListener('click', toggleExtension);
  }

  // Dashboard button
  const dashboardBtn = document.getElementById('dashboardBtn');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', openDashboard);
  }

  // Clear data button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearData);
  }
}

// Toggle extension on/off
async function toggleExtension() {
  try {
    const currentEnabled = await StorageUtils.get('enabled');
    const newEnabled = !currentEnabled;
    await StorageUtils.set('enabled', newEnabled);
    updateStatusDisplay(newEnabled);
    console.log('Extension toggled to:', newEnabled ? 'ON' : 'OFF');
  } catch (error) {
    console.error('Error toggling status:', error);
  }
}

// Open dashboard in new tab
function openDashboard() {
  try {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  } catch (error) {
    console.error('Error opening dashboard:', error);
  }
}

// Clear all detection data
async function clearData() {
  if (confirm('Clear all detection data?')) {
    try {
      await StorageUtils.set('detections', []);
      await StorageUtils.set('stats', { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 });
      loadStats();
      console.log('Data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
