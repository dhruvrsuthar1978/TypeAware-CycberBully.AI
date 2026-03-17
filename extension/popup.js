// TypeAware Popup v2.1

const SENS_LABELS = { 1: 'Low', 2: 'Medium', 3: 'High' };
const SENS_HINTS = {
  1: 'Detects only high-severity content: harassment, hate speech and threats.',
  2: 'Detects harassment, hate speech, threats and profanity.',
  3: 'Detects all content including spam and mild language.',
};

let state = {
  enabled: true,
  detections: [],
  stats: { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 },
  settings: {
    sensitivity: 2,
    showHighlights: true,
    aiAnalysis: true,
    autoReport: false,
    notifications: false,
    blockHighSeverity: true,
  },
  activeFilter: 'all',
  backendOk: false,
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  renderAll();
  bindAll();

  setInterval(loadAll, 2000);
  setInterval(checkBackendStatus, 8000);
  await checkBackendStatus();
});

async function loadAll() {
  const data = await chrome.storage.local.get(['stats', 'detections', 'enabled', 'version', 'settings']);
  state.stats = data.stats || { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 };
  state.detections = data.detections || [];
  state.enabled = data.enabled !== false;

  if (data.settings) {
    Object.assign(state.settings, data.settings);
  }

  if (data.version) {
    document.getElementById('versionEl').textContent = `v${data.version}`;
  }

  renderAll();
}

function renderAll() {
  renderToggle();
  renderStats();
  renderDetectionBadge();
  renderDetections();
  renderSettings();
  renderBackendStatus();
}

function bindAll() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    });
  });

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderDetections();
    });
  });

  document.getElementById('toggleBtn').addEventListener('click', toggleExtension);

  document.getElementById('dashBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:8080/dashboard' });
  });

  document.getElementById('analyseBtn').addEventListener('click', async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) {
      showToast('No active tab');
      return;
    }
    const url = activeTab.url || '';
    const isPdfViewer =
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.includes('.pdf');
    if (isPdfViewer) {
      showToast('Chrome PDF viewer is not scannable');
      return;
    }
    const response = await safeSendToTab(activeTab.id, { action: 'forceScan' });
    if (response === null) {
      showToast('Scan unavailable on this page');
      return;
    }
    showToast('Page scan triggered');
  });

  document.getElementById('clearBtn').addEventListener('click', clearData);

  document.getElementById('reportIssueBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:8080/contact' });
  });

  document.getElementById('sensRange').addEventListener('input', onSensChange);

  ['swHighlights', 'swAI', 'swAutoReport', 'swNotify', 'swBlockHigh'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', saveSettings);
  });
}

function renderToggle() {
  const btn = document.getElementById('toggleBtn');
  const label = document.getElementById('toggleLabel');
  btn.className = `toggle-pill ${state.enabled ? 'active' : 'inactive'}`;
  label.textContent = state.enabled ? 'Active' : 'Paused';
}

function renderStats() {
  const { totalScanned, threatsDetected } = state.stats;

  animateNum('statScanned', totalScanned);
  animateNum('statThreats', threatsDetected);

  const pct = totalScanned > 0 ? Math.max(60, 100 - Math.round((threatsDetected / totalScanned) * 100)) : 100;

  document.getElementById('protValue').textContent = `${pct}%`;
  document.getElementById('protFill').style.width = `${pct}%`;

  const statusEl = document.getElementById('protStatus');
  const fill = document.getElementById('protFill');

  if (pct >= 90) {
    statusEl.className = 'prot-status safe';
    statusEl.textContent = 'All systems nominal';
    fill.style.background = 'linear-gradient(90deg,#14B87A,#34D399)';
  } else if (pct >= 70) {
    statusEl.className = 'prot-status warn';
    statusEl.textContent = 'Some threats detected';
    fill.style.background = 'linear-gradient(90deg,#D97706,#FBBF24)';
  } else {
    statusEl.className = 'prot-status danger';
    statusEl.textContent = 'High threat activity';
    fill.style.background = 'linear-gradient(90deg,#DC2626,#F87171)';
  }
}

function renderDetectionBadge() {
  const badge = document.getElementById('tabBadge');
  const count = state.detections.length;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('hidden', count === 0);
}

function renderDetections() {
  const list = document.getElementById('detList');
  let filtered = state.detections;

  if (state.activeFilter !== 'all') {
    filtered = filtered.filter((d) => getSeverity(d) === state.activeFilter);
  }

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#14B87A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <p>${state.activeFilter === 'all' ? 'All clear - no threats detected' : `No ${state.activeFilter}-severity detections`}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered
    .slice(0, 20)
    .map((d) => {
      const sev = getSeverity(d);
      const type = (d.type || 'Unknown').replace(/_/g, ' ');
      const platform = d.platform || 'Web';
      const time = d.timestamp ? relativeTime(d.timestamp) : '';

      return `
      <div class="det-item" data-sev="${sev}">
        <div class="det-dot dot-${sev}"></div>
        <div class="det-info">
          <div class="det-type">${escapeHtml(type)}</div>
          <div class="det-meta">
            <span>${escapeHtml(platform)}</span>
            ${time ? `<span class="det-meta-sep"></span><span>${escapeHtml(time)}</span>` : ''}
          </div>
        </div>
        <span class="det-sev sev-${sev}">${escapeHtml(sev)}</span>
      </div>`;
    })
    .join('');
}

function renderSettings() {
  const s = state.settings;
  document.getElementById('sensRange').value = s.sensitivity;
  document.getElementById('sensLabel').textContent = SENS_LABELS[s.sensitivity];
  document.getElementById('sensHint').textContent = SENS_HINTS[s.sensitivity];
  document.getElementById('swHighlights').checked = s.showHighlights;
  document.getElementById('swAI').checked = s.aiAnalysis;
  document.getElementById('swAutoReport').checked = s.autoReport;
  document.getElementById('swNotify').checked = s.notifications;
  const blockEl = document.getElementById('swBlockHigh');
  if (blockEl) blockEl.checked = s.blockHighSeverity !== false;
}

function renderBackendStatus() {
  const el = document.getElementById('backendEl');
  if (!el) return;
  el.textContent = state.backendOk ? 'Backend: connected' : 'Backend: offline';
  el.style.color = state.backendOk ? '#14B87A' : '#EF4444';
}

async function checkBackendStatus() {
  try {
    const res = await chrome.runtime.sendMessage({ action: 'pingBackend' });
    state.backendOk = Boolean(res?.ok);
  } catch {
    state.backendOk = false;
  }
  renderBackendStatus();
}

async function toggleExtension() {
  state.enabled = !state.enabled;
  await chrome.storage.local.set({ enabled: state.enabled });
  renderToggle();

  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => safeSendToTab(tab.id, { action: 'toggleExtension', enabled: state.enabled })));
}

async function clearData() {
  if (!confirm('Clear all detection data? This cannot be undone.')) return;

  const reset = { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 };
  await chrome.storage.local.set({ stats: reset, detections: [] });

  state.stats = reset;
  state.detections = [];
  renderAll();
  showToast('Data cleared');
}

function onSensChange(e) {
  const val = Number(e.target.value);
  state.settings.sensitivity = val;
  document.getElementById('sensLabel').textContent = SENS_LABELS[val];
  document.getElementById('sensHint').textContent = SENS_HINTS[val];
  saveSettings();
}

async function saveSettings() {
  const s = state.settings;
  s.showHighlights = document.getElementById('swHighlights').checked;
  s.aiAnalysis = document.getElementById('swAI').checked;
  s.autoReport = document.getElementById('swAutoReport').checked;
  s.notifications = document.getElementById('swNotify').checked;
  const blockEl = document.getElementById('swBlockHigh');
  s.blockHighSeverity = blockEl ? blockEl.checked : true;

  await chrome.storage.local.set({ settings: s });

  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => safeSendToTab(tab.id, { action: 'settingsUpdated', settings: s })));
}

function getSeverity(d) {
  if (d.severity) return d.severity;
  const high = ['HARASSMENT', 'HATE SPEECH', 'THREATS', 'HATE_SPEECH'];
  const medium = ['PROFANITY'];
  const t = (d.type || '').toUpperCase();
  if (high.some((h) => t.includes(h))) return 'high';
  if (medium.some((m) => t.includes(m))) return 'medium';
  return 'low';
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  const cur = Number(el.textContent) || 0;
  if (cur === target) return;

  const diff = target - cur;
  const step = diff > 0 ? Math.ceil(diff / 6) : Math.floor(diff / 6);
  const next = cur + step;
  el.textContent = Math.abs(next - target) < Math.abs(step) ? String(target) : String(next);

  if (next !== target) {
    requestAnimationFrame(() => animateNum(id, target));
  }
}

async function safeSendToTab(tabId, message) {
  if (!tabId) return null;
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response ?? { ok: true };
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimeout;
function showToast(msg) {
  let t = document.getElementById('__ta_toast__');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: '__ta_toast__' });
    Object.assign(t.style, {
      position: 'fixed',
      bottom: '52px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0D1526',
      color: '#E8F0F8',
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 14px',
      borderRadius: '20px',
      border: '1px solid #1E2D47',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      zIndex: '99999',
      transition: 'opacity 0.25s',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    });
    document.body.appendChild(t);
  }

  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    t.style.opacity = '0';
  }, 2000);
}
