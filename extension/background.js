// TypeAware Background Service Worker v2.1

const BACKEND_URL = 'http://localhost:8010';

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    'stats',
    'enabled',
    'userUuid',
    'detections',
    'settings',
    'version',
  ]);

  if (!data.stats) {
    await chrome.storage.local.set({
      stats: { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 },
    });
  }

  if (data.enabled === undefined) {
    await chrome.storage.local.set({ enabled: true });
  }

  if (!data.detections) {
    await chrome.storage.local.set({ detections: [] });
  }

  if (!data.userUuid) {
    await chrome.storage.local.set({ userUuid: generateUuid() });
  }

  if (!data.settings) {
    await chrome.storage.local.set({
      settings: {
        sensitivity: 2,
        showHighlights: true,
        aiAnalysis: true,
        autoReport: false,
        notifications: false,
        blockHighSeverity: true,
      },
    });
  }

  await chrome.storage.local.set({ version: chrome.runtime.getManifest().version });
});

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  (async () => {
    switch (req.action) {
      case 'updateStats':
        await updateStats(req.data || {});
        return { success: true };

      case 'addDetection':
        await addDetection(req.detection || {});
        return { success: true };

      case 'getStats': {
        const r = await chrome.storage.local.get(['stats']);
        return { stats: r.stats };
      }

      case 'getSettings': {
        const r = await chrome.storage.local.get(['settings']);
        return { settings: r.settings };
      }

      case 'pingBackend': {
        const ok = await pingBackend();
        return { ok };
      }

      case 'analyzeContent': {
        const result = await analyzeContentWithAI(req.content, req.context || {});
        return { result };
      }

      case 'rephraseContent': {
        const result = await getRephraseSuggestions(req.content);
        return { result };
      }

      case 'screenMessage': {
        const result = await screenMessage(req.content, req.context || {});
        return { result };
      }

      case 'submitReport': {
        const result = await submitReportToBackend(req.reportData || {});
        return { result };
      }

      case 'notify':
        showNotification(req.message);
        return { success: true };

      default:
        return { success: false, error: 'Unknown action.' };
    }
  })()
    .then((result) => sendResponse(result))
    .catch((err) => {
      console.warn('[TypeAware] background error:', err?.message || err);
      sendResponse({ success: false, error: err?.message || 'Unknown background error.' });
    });

  return true;
});

async function updateStats(updates) {
  const { stats = { totalScanned: 0, threatsDetected: 0, reportsSubmitted: 0 } } =
    await chrome.storage.local.get(['stats']);

  stats.totalScanned += Number(updates.totalScanned || 0);
  stats.threatsDetected += Number(updates.threatsDetected || 0);
  stats.reportsSubmitted += Number(updates.reportsSubmitted || 0);

  await chrome.storage.local.set({ stats });
}

async function addDetection(detection) {
  let { detections = [] } = await chrome.storage.local.get(['detections']);
  detections.unshift(detection);
  if (detections.length > 100) detections = detections.slice(0, 100);
  await chrome.storage.local.set({ detections });
}

function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'TypeAware Alert',
    message: message || 'Harmful content detected on this page.',
    priority: 2,
  });
}

async function pingBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

async function analyzeContentWithAI(content, context = {}) {
  if (!content || !String(content).trim()) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        context: {
          ...context,
          source: 'extension',
          platform: getPlatformFromUrl(context.url),
        },
      }),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('[TypeAware] AI analysis error:', err?.message || err);
    return null;
  }
}

async function getRephraseSuggestions(content) {
  if (!content || !String(content).trim()) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/rephrase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    const suggestions = json?.data?.suggestions || [];
    return suggestions.map((s) => s.suggested_text).filter(Boolean);
  } catch (err) {
    console.warn('[TypeAware] rephrase error:', err?.message || err);
    return [];
  }
}

async function screenMessage(content, context = {}) {
  if (!content || !String(content).trim()) {
    return {
      accepted: true,
      moderation: { flagged: false, severity: 'none', message: 'No content' },
      user_state: null,
      suggestion: '',
      rephrases: [],
    };
  }

  try {
    const { userUuid } = await chrome.storage.local.get(['userUuid']);
    const res = await fetch(`${BACKEND_URL}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id: userUuid, text: content }),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();

    const rephrases = json?.moderation?.flagged
      ? await getRephraseSuggestions(content)
      : [];

    return {
      ...json,
      rephrases,
      context,
    };
  } catch (err) {
    console.warn('[TypeAware] message screening error:', err?.message || err);
    return {
      accepted: true,
      moderation: { flagged: false, severity: 'none', message: 'Screening unavailable' },
      user_state: null,
      suggestion: '',
      rephrases: [],
    };
  }
}

async function submitReportToBackend(reportData) {
  try {
    const { userUuid } = await chrome.storage.local.get(['userUuid']);
    const manifest = chrome.runtime.getManifest();

    const res = await fetch(`${BACKEND_URL}/api/extension/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-id': chrome.runtime.id,
        'x-extension-version': manifest.version,
        'x-user-uuid': userUuid,
      },
      body: JSON.stringify(reportData),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    await updateStats({ reportsSubmitted: 1 });
    return json.data || null;
  } catch (err) {
    console.warn('[TypeAware] report submission error:', err?.message || err);
    return null;
  }
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getPlatformFromUrl(url) {
  if (!url) return 'web';
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('twitter') || h.includes('x.com')) return 'twitter';
    if (h.includes('reddit')) return 'reddit';
    if (h.includes('youtube')) return 'youtube';
    if (h.includes('facebook')) return 'facebook';
    if (h.includes('instagram')) return 'instagram';
    if (h.includes('tiktok')) return 'tiktok';
  } catch {
    // ignore invalid URL
  }
  return 'web';
}
