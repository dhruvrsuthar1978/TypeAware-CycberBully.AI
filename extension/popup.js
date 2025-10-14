// Initialize popup
document.addEventListener('DOMContentLoaded', init);

let isEnabled = true;

function init() {
  loadData();
  attachEventListeners();
  setInterval(loadData, 1000); // Refresh every second
}

function attachEventListeners() {
  document.getElementById('toggleBtn').addEventListener('click', toggleExtension);
  document.getElementById('dashboardBtn').addEventListener('click', openDashboard);
  document.getElementById('clearBtn').addEventListener('click', clearData);
}

async function loadData() {
  const result = await chrome.storage.local.get(['stats', 'detections', 'enabled']);

  const stats = result.stats || { totalScanned: 0, threatsDetected: 0 };
  const detections = result.detections || [];
  isEnabled = result.enabled !== false;

  // Update stats
  document.getElementById('scanned').textContent = stats.totalScanned;
  document.getElementById('threats').textContent = stats.threatsDetected;

  // Update toggle button
  const toggleBtn = document.getElementById('toggleBtn');
  toggleBtn.textContent = isEnabled ? 'ON' : 'OFF';
  toggleBtn.className = isEnabled ? 'toggle-btn active' : 'toggle-btn inactive';

  // Update detections list
  updateDetectionsList(detections);
}

function updateDetectionsList(detections) {
  const box = document.getElementById('detectionsBox');

  if (detections.length === 0) {
    box.innerHTML = '<div class="no-detections">No detections yet</div>';
    return;
  }

  box.innerHTML = detections.slice(0, 5).map(d => `
    <div class="detection-item">
      <span class="detection-type">${d.type || 'Unknown'}</span> - ${d.platform || 'web'}
      <div class="detection-time">${new Date(d.timestamp).toLocaleTimeString()}</div>
    </div>
  `).join('');
}

async function toggleExtension() {
  isEnabled = !isEnabled;
  await chrome.storage.local.set({ enabled: isEnabled });
  loadData();

  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension', enabled: isEnabled }).catch(() => {});
    });
  });
}

function openDashboard() {
  chrome.tabs.create({ url: 'http://localhost:8081/dashboard' });
}

async function clearData() {
  if (!confirm('Clear all detection data?')) return;

  await chrome.storage.local.set({
    stats: { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 },
    detections: []
  });
  loadData();
}
