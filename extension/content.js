// TypeAware Content Script v2.1

const PATTERNS = {
  HARASSMENT: {
    severity: 'high',
    patterns: [
      /\b(loser|stupid|idiot|dumb|fool|hate you|kill yourself|kys)\b/i,
      /\b(you're trash|you suck|shut up)\b/i,
      /\b(nobody likes you|everyone hates you)\b/i,
    ],
  },
  HATE_SPEECH: {
    severity: 'high',
    patterns: [/\b(racist|homophobic|transphobic|sexist)\b/i, /\b(i hate|hate all)\b/i],
  },
  THREATS: {
    severity: 'high',
    patterns: [/\b(i'll hurt|gonna kill|watch your back)\b/i, /\b(you're dead|i'll find you)\b/i],
  },
  PROFANITY: {
    severity: 'medium',
    patterns: [/\b(damn|hell|crap|sucks?|pissed)\b/i],
  },
  SPAM: {
    severity: 'low',
    patterns: [
      /\b(buy now|click here|limited time|act now)\b/i,
      /\b(follow my link|check my profile)\b/i,
    ],
  },
};

const SENS_FILTER = {
  1: ['high'],
  2: ['high', 'medium'],
  3: ['high', 'medium', 'low'],
};

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'meta', 'link', 'svg', 'head', 'iframe']);

let enabled = true;
let settings = {
  sensitivity: 2,
  showHighlights: true,
  aiAnalysis: true,
  autoReport: false,
  notifications: false,
  blockHighSeverity: true,
};

let observer = null;
let scanDebounce = null;
let initDone = false;
const composerState = new WeakMap();
const composerTimers = new WeakMap();
const typedDetectionFingerprint = new WeakMap();

chrome.storage.local.get(['enabled', 'settings'], (result) => {
  enabled = result.enabled !== false;
  if (result.settings) Object.assign(settings, result.settings);
  if (enabled) init();
});

chrome.runtime.onMessage.addListener((req) => {
  if (req.action === 'toggleExtension') {
    enabled = req.enabled;
    if (enabled) init();
    else teardown();
  }

  if (req.action === 'settingsUpdated') {
    Object.assign(settings, req.settings || {});
    if (!settings.showHighlights) removeHighlights();
  }

  if (req.action === 'forceScan') {
    scanPage(true);
  }
});

function init() {
  if (!initDone) {
    initDone = true;
    document.addEventListener('input', onDocumentInput, true);
    document.addEventListener('keydown', onDocumentKeyDown, true);
    document.addEventListener('submit', onDocumentSubmit, true);
    initTooltipHandlers();
  }

  scanPage();

  if (!observer) {
    observer = new MutationObserver(() => {
      clearTimeout(scanDebounce);
      scanDebounce = setTimeout(scanPage, 600);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

function teardown() {
  removeHighlights();
  hideComposerHint();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  clearTimeout(scanDebounce);
}

// Tooltip and banner
let tipEl = null;
let tipShow = false;
let bannerTimeout;
let composerHintEl = null;

function initTooltipHandlers() {
  document.addEventListener(
    'mouseover',
    (e) => {
      const target = e.target.closest?.('.ta-detected');
      if (!target) return;
      const t = ensureTip();
      t.textContent = target.getAttribute('data-ta-label') || 'Detected content';
      t.style.opacity = '1';
      tipShow = true;
    },
    { passive: true }
  );

  document.addEventListener(
    'mousemove',
    (e) => {
      if (!tipShow || !tipEl) return;
      tipEl.style.left = `${e.clientX + 14}px`;
      tipEl.style.top = `${e.clientY - 32}px`;
    },
    { passive: true }
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      if (!e.target.closest?.('.ta-detected')) return;
      if (tipEl) tipEl.style.opacity = '0';
      tipShow = false;
    },
    { passive: true }
  );
}

function ensureTip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = '__ta_tip__';
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function showBanner(msg, dotClass = 'safe') {
  let el = document.getElementById('__ta_banner__');
  if (!el) {
    el = document.createElement('div');
    el.id = '__ta_banner__';
    el.innerHTML = '<span class="ta-banner-dot"></span><span id="__ta_banner_text__"></span>';
    document.body.appendChild(el);
  }

  el.querySelector('.ta-banner-dot').className = `ta-banner-dot ${dotClass}`;
  const textEl = document.getElementById('__ta_banner_text__');
  if (textEl) textEl.textContent = msg;

  el.classList.add('visible');
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => el.classList.remove('visible'), 3500);
}

function ensureComposerHint() {
  if (!composerHintEl) {
    composerHintEl = document.createElement('div');
    composerHintEl.id = '__ta_compose_hint__';
    composerHintEl.style.position = 'fixed';
    composerHintEl.style.zIndex = '2147483647';
    composerHintEl.style.maxWidth = '360px';
    composerHintEl.style.background = '#0D1526';
    composerHintEl.style.color = '#E8F0F8';
    composerHintEl.style.border = '1px solid #1E2D47';
    composerHintEl.style.borderRadius = '10px';
    composerHintEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45)';
    composerHintEl.style.padding = '10px 12px';
    composerHintEl.style.font = '12px/1.4 Inter, Segoe UI, sans-serif';
    composerHintEl.style.pointerEvents = 'none';
    composerHintEl.style.opacity = '0';
    composerHintEl.style.transition = 'opacity 0.15s ease';
    document.body.appendChild(composerHintEl);
  }
  return composerHintEl;
}

function showComposerHint(target, title, suggestion) {
  const hint = ensureComposerHint();
  const r = target.getBoundingClientRect();
  hint.innerHTML = `
    <div style="font-weight:700;color:#F59E0B;margin-bottom:4px;">${escapeHtml(title)}</div>
    <div style="color:#C5D7EA;">${escapeHtml(suggestion || 'Try rewriting this message respectfully.')}</div>
  `;
  hint.style.left = `${Math.max(8, Math.min(window.innerWidth - 368, r.left))}px`;
  hint.style.top = `${Math.max(8, r.bottom + 8)}px`;
  hint.style.opacity = '1';
}

function hideComposerHint() {
  if (composerHintEl) composerHintEl.style.opacity = '0';
}

// Page scan/highlight
function scanPage() {
  if (!enabled) return;

  const allowed = SENS_FILTER[settings.sensitivity] || ['high', 'medium'];

  document
    .querySelectorAll(
      'p, span, div, h1, h2, h3, h4, h5, h6, article, li, blockquote, [contenteditable], textarea, input[type="text"], input[type="search"]'
    )
    .forEach((el) => {
      if (shouldSkip(el)) return;

      const text = getEditableText(el) || (el.textContent || '').trim();
      if (text.length < 4 || text.length > 2000) return;
      if (el.children.length > 4) return;

      const detection = detectSync(text, allowed);
      if (detection) {
        el.setAttribute('data-ta-scanned', '1');
        if (settings.showHighlights) applyHighlight(el, detection);
        sendDetection(detection);
      } else if (!el.hasAttribute('data-ta-scanned')) {
        el.setAttribute('data-ta-scanned', '1');
        maybeAIAnalyse(el, text);
      }
    });
}

function shouldSkip(el) {
  if (SKIP_TAGS.has(el.tagName?.toLowerCase())) return true;
  if (el.hasAttribute('data-ta-scanned') && !isEditable(el)) return true;
  if (el.classList.contains('ta-detected')) return true;
  if (el.closest?.('#__ta_banner__')) return true;
  return false;
}

function detectSync(text, allowedSeverities) {
  for (const [type, cfg] of Object.entries(PATTERNS)) {
    if (!allowedSeverities.includes(cfg.severity)) continue;
    for (const rx of cfg.patterns) {
      if (rx.test(text)) {
        return {
          type,
          severity: cfg.severity,
          text: text.substring(0, 120),
          source: 'pattern',
        };
      }
    }
  }
  return null;
}

function applyHighlight(el, detection) {
  if (isEditable(el)) {
    applyInputWarning(el, detection);
    return;
  }
  el.classList.add('ta-detected', `ta-${detection.severity}`);
  const typeLabel = detection.type.replace(/_/g, ' ');
  el.setAttribute('data-ta-label', `${typeLabel} · ${detection.severity} severity`);
}

function applyInputWarning(el, detection) {
  el.style.outline = detection.severity === 'high' ? '2px solid #ef4444' : '2px solid #f59e0b';
  el.style.outlineOffset = '1px';
  el.setAttribute('data-ta-label', `${String(detection.type).replace(/_/g, ' ')} · ${detection.severity}`);
}

function removeHighlights() {
  document.querySelectorAll('.ta-detected').forEach((el) => {
    el.classList.remove('ta-detected', 'ta-high', 'ta-medium', 'ta-low');
    el.removeAttribute('data-ta-label');
    el.removeAttribute('data-ta-scanned');
  });
  document
    .querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]')
    .forEach((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeAttribute('data-ta-label');
    });
}

async function maybeAIAnalyse(el, text) {
  if (!settings.aiAnalysis) return;
  if (Math.random() > 0.08) return;

  const result = await sendToBackground('analyzeContent', {
    content: text,
    context: { url: location.href },
  });

  if (!result) return;

  const sev = ['high', 'medium', 'low'].includes(result.severity) ? result.severity : null;
  if (!sev) return;
  if ((result.toxicity_score || 0) <= 0.55) return;
  if (result.category === 'safe' || result.category === 'none') return;

  el.setAttribute('data-ta-scanned', '1');
  if (settings.showHighlights) applyHighlight(el, { type: result.category || 'AI_DETECTED', severity: sev });

  sendDetection({
    type: result.category || 'AI_DETECTED',
    severity: sev,
    source: 'ai',
    confidence: result.toxicity_score,
    text: text.substring(0, 120),
  });

  if (settings.notifications && sev === 'high') {
    chrome.runtime.sendMessage({ action: 'notify', message: `High-severity content detected on ${getPlatform()}` });
  }
}

// Typed message interception
function onDocumentInput(event) {
  if (!enabled) return;

  const target = getEditableTarget(event.target);
  if (!target) return;

  const text = getEditableText(target);
  const timer = composerTimers.get(target);
  if (timer) clearTimeout(timer);

  composerTimers.set(
    target,
    setTimeout(async () => {
      if (!enabled) return;
      if (!text || text.length < 3) {
        composerState.delete(target);
        hideComposerHint();
        return;
      }

      const allowed = SENS_FILTER[settings.sensitivity] || ['high', 'medium'];
      const local = detectSync(text, allowed);

      let ai = null;
      if (settings.aiAnalysis && text.length >= 12) {
        ai = await sendToBackground('analyzeContent', {
          content: text,
          context: { url: location.href, typed: true },
        });
      }

      const severity = pickSeverity(local, ai);
      const flagged = Boolean(
        local || (ai && (ai.toxicity_score || 0) >= 0.55 && ai.category !== 'safe' && ai.category !== 'none')
      );

      const suggestion = (ai && ai.suggestion) || (local && 'Consider rephrasing this message respectfully.') || '';

      composerState.set(target, {
        text,
        flagged,
        severity,
        local,
        ai,
        suggestion,
        ts: Date.now(),
      });

      if (flagged && severity !== 'low') {
        const type = local?.type || ai?.category || 'Potential harmful language';
        showComposerHint(target, `${String(type).replace(/_/g, ' ')} detected`, suggestion);
        recordTypedDetection(target, {
          type: type || 'TYPED_HARMFUL_CONTENT',
          severity,
          confidence: ai?.toxicity_score || 0.65,
          text,
        });
      } else {
        clearInputWarning(target);
        hideComposerHint();
      }
    }, 250)
  );
}

async function onDocumentKeyDown(event) {
  if (!enabled) return;
  if (event.key !== 'Enter') return;

  const target = getEditableTarget(event.target);
  if (!target) return;

  // Allow Shift+Enter newline in editors.
  if (event.shiftKey) return;

  await guardSubmission(event, target);
}

async function onDocumentSubmit(event) {
  if (!enabled) return;

  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const target = form.querySelector('[contenteditable="true"], textarea, input[type="text"], input[type="search"]');
  if (!target) return;

  await guardSubmission(event, target);
}

async function guardSubmission(event, target) {
  const text = getEditableText(target).trim();
  if (!text) return;

  const screen = await sendToBackground('screenMessage', {
    content: text,
    context: { url: location.href, platform: getPlatform() },
  });

  if (!screen) return;

  const severity = screen?.moderation?.severity || 'none';
  const flagged = Boolean(screen?.moderation?.flagged);
  const blockedByBackend = screen?.accepted === false;
  const shouldBlockBySeverity = settings.blockHighSeverity && flagged && severity === 'high';

  if (flagged) {
    sendDetection({
      type: screen?.moderation?.matches?.[0]?.term || screen?.moderation?.message || 'HARMFUL_TYPED_CONTENT',
      severity,
      source: 'typed',
      confidence: screen?.moderation?.risk_score || screen?.moderation?.ml_toxic_probability || 0.75,
      text: text.substring(0, 120),
    });
  } else {
    chrome.runtime.sendMessage({ action: 'updateStats', data: { totalScanned: 1 } }, () => {});
  }

  if (blockedByBackend || shouldBlockBySeverity) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    const backendReason =
      screen?.reason ||
      screen?.moderation?.message ||
      'Message blocked because harmful language was detected.';

    const suggestion =
      screen?.rephrases?.[0] ||
      screen?.moderation?.suggestion ||
      'Try using constructive and respectful wording.';

    showBanner(backendReason, 'high');
    showComposerHint(target, 'Message blocked', suggestion);

    if (settings.autoReport) {
      submitReport({
        text,
        reason: 'AUTO_BLOCKED_HIGH_RISK',
        confidence: screen?.moderation?.risk_score || 0.8,
      });
    }
    return;
  }

  if (flagged && severity === 'medium') {
    showBanner('Potentially harmful message detected. Consider rephrasing.', 'medium');
    const suggestion =
      screen?.rephrases?.[0] ||
      screen?.moderation?.suggestion ||
      'You can keep this respectful by avoiding personal attacks.';
    showComposerHint(target, 'Suggestion', suggestion);
  } else {
    hideComposerHint();
  }
}

function pickSeverity(local, ai) {
  const ranks = { none: 0, low: 1, medium: 2, high: 3 };
  const localSev = local?.severity || 'none';
  const aiSev = ai?.severity || 'none';
  return ranks[aiSev] > ranks[localSev] ? aiSev : localSev;
}

function getEditableTarget(node) {
  if (!node || !(node instanceof Element)) return null;

  if (isEditable(node)) return node;
  const editableParent = node.closest('textarea, input[type="text"], input[type="search"], [contenteditable="true"]');
  return editableParent || null;
}

function isEditable(el) {
  if (!(el instanceof Element)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag === 'input') {
    const t = (el.getAttribute('type') || 'text').toLowerCase();
    return t === 'text' || t === 'search';
  }
  return el.getAttribute('contenteditable') === 'true';
}

function getEditableText(el) {
  if (!el) return '';
  const tag = el.tagName?.toLowerCase();
  if (tag === 'textarea' || tag === 'input') return (el.value || '').trim();
  return (el.innerText || el.textContent || '').trim();
}

function clearInputWarning(el) {
  if (!el) return;
  el.style.outline = '';
  el.style.outlineOffset = '';
}

function recordTypedDetection(target, detection) {
  // Avoid flooding stats while user is typing the same content.
  const fingerprint = `${detection.severity}:${String(detection.type).toLowerCase()}:${detection.text.slice(0, 60)}`;
  if (typedDetectionFingerprint.get(target) === fingerprint) return;
  typedDetectionFingerprint.set(target, fingerprint);

  applyInputWarning(target, detection);
  sendDetection({
    ...detection,
    source: 'typed-live',
    text: detection.text.slice(0, 120),
  });
}

function sendDetection(detection) {
  chrome.runtime.sendMessage(
    {
      action: 'updateStats',
      data: { totalScanned: 1, threatsDetected: 1 },
    },
    () => {}
  );

  chrome.runtime.sendMessage(
    {
      action: 'addDetection',
      detection: {
        type: detection.type,
        severity: detection.severity,
        platform: getPlatform(),
        timestamp: Date.now(),
      },
    },
    () => {}
  );

  const shouldReport =
    settings.autoReport &&
    (detection.severity === 'high' || (detection.confidence && detection.confidence > 0.75));

  if (shouldReport) {
    submitReport({
      text: detection.text || '',
      reason: detection.type,
      confidence: detection.confidence || 0.5,
      source: detection.source || 'pattern',
    });
  }
}

function submitReport(data) {
  chrome.runtime.sendMessage(
    {
      action: 'submitReport',
      reportData: {
        content: data.text || '',
        flagReason: data.reason,
        platform: getPlatform(),
        context: {
          url: location.href,
          detectionSource: data.source,
          confidence: data.confidence,
        },
        timestamp: new Date().toISOString(),
      },
    },
    () => {}
  );
}

function sendToBackground(action, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response?.result ?? response ?? null);
    });
  });
}

function getPlatform() {
  const h = location.hostname.toLowerCase();
  if (h.includes('twitter') || h.includes('x.com')) return 'Twitter';
  if (h.includes('reddit')) return 'Reddit';
  if (h.includes('youtube')) return 'YouTube';
  if (h.includes('facebook')) return 'Facebook';
  if (h.includes('instagram')) return 'Instagram';
  if (h.includes('tiktok')) return 'TikTok';
  return 'Web';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
