// Detection patterns
const PATTERNS = {
  HARASSMENT: {
    severity: 'high',
    patterns: [
      /\b(loser|stupid|idiot|dumb|fool|hate you|kill yourself|kys)\b/i,
      /\b(you're trash|you suck|shut up)\b/i,
      /\b(nobody likes you|everyone hates you)\b/i
    ]
  },
  HATE_SPEECH: {
    severity: 'high',
    patterns: [
      /\b(racist|homophobic|transphobic|sexist)\b/i,
      /\b(i hate|hate all)\b/i
    ]
  },
  THREATS: {
    severity: 'high',
    patterns: [
      /\b(i'll hurt|gonna kill|watch your back)\b/i,
      /\b(you're dead|i'll find you)\b/i
    ]
  },
  PROFANITY: {
    severity: 'medium',
    patterns: [
      /\b(damn|hell|crap|sucks?|pissed)\b/i
    ]
  },
  SPAM: {
    severity: 'low',
    patterns: [
      /\b(buy now|click here|limited time|act now)\b/i,
      /\b(follow my link|check my profile)\b/i
    ]
  }
};

let enabled = true;
const highlightedElements = new WeakMap();

// Check if extension is enabled
chrome.storage.local.get(['enabled'], (result) => {
  enabled = result.enabled !== false;
  if (enabled) startScanning();
});

// Listen for toggle messages
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleExtension') {
    enabled = request.enabled;
    if (enabled) {
      startScanning();
    } else {
      removeAllHighlights();
    }
  }
});

function startScanning() {
  // Scan on page load
  scanPage();

  // Re-scan on DOM changes
  const observer = new MutationObserver(() => {
    scanPage();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Periodic scan every 2 seconds
  setInterval(scanPage, 2000);
}

function scanPage() {
  if (!enabled) return;

  document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, article, li, button, a, [contenteditable]').forEach((element) => {
    if (shouldSkipElement(element)) return;

    const text = element.textContent.trim();
    if (text.length < 3 || text.length > 5000) return;

    const detection = detectContent(text);
    if (detection) {
      highlightElement(element, detection);
      updateStats(detection.type);
      submitReportIfNeeded(detection, element);
    }
  });
}

function shouldSkipElement(element) {
  const tag = element.tagName.toLowerCase();
  const skipTags = ['script', 'style', 'noscript', 'meta', 'link', 'svg'];
  if (skipTags.includes(tag)) return true;

  if (highlightedElements.has(element)) return true;

  return false;
}

async function detectContent(text) {
  // First, check with pattern matching for quick detection
  let patternDetection = null;
  for (const [type, config] of Object.entries(PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        patternDetection = {
          type: type.replace(/_/g, ' '),
          severity: config.severity,
          text: text.substring(0, 50),
          source: 'pattern'
        };
        break;
      }
    }
    if (patternDetection) break;
  }

  // If pattern detected high severity, or randomly sample for AI analysis
  const shouldAnalyzeWithAI = patternDetection?.severity === 'high' ||
                              Math.random() < 0.1; // 10% chance for AI analysis

  if (shouldAnalyzeWithAI) {
    try {
      const aiResult = await analyzeWithAI(text, window.location.href);
      if (aiResult) {
        // Combine pattern and AI results
        const combinedDetection = {
          ...patternDetection,
          aiAnalysis: aiResult,
          severity: aiResult.severity === 'high' ? 'high' : patternDetection?.severity || aiResult.severity,
          confidence: aiResult.toxicity_score || 0.5,
          source: patternDetection ? 'hybrid' : 'ai'
        };
        return combinedDetection;
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fall back to pattern detection if AI fails
    }
  }

  return patternDetection;
}

// Analyze content with AI via background script
async function analyzeWithAI(text, url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'analyzeContent',
      content: text,
      context: { url }
    }, (response) => {
      resolve(response?.result || null);
    });
  });
}

function highlightElement(element, detection) {
  element.style.borderBottom = '2px solid #ef4444';
  element.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
  element.title = `${detection.type} - ${detection.severity} severity`;
  highlightedElements.set(element, detection);
}

function removeAllHighlights() {
  document.querySelectorAll('[style*="borderBottom"]').forEach((el) => {
    el.style.borderBottom = '';
    el.style.backgroundColor = '';
  });
}

async function updateStats(detectionType) {
  chrome.runtime.sendMessage({
    action: 'updateStats',
    data: {
      totalScanned: 1,
      threatsDetected: 1
    }
  }, () => {});

  // Add to detections list
  chrome.runtime.sendMessage({
    action: 'addDetection',
    detection: {
      type: detectionType,
      platform: getPlatform(),
      timestamp: Date.now()
    }
  }, () => {});
}

// Submit report for high-confidence detections
async function submitReportIfNeeded(detection, element) {
  // Submit reports for high severity detections or AI-confirmed bullying
  const shouldReport = detection.severity === 'high' ||
                      (detection.aiAnalysis && detection.aiAnalysis.category !== 'none') ||
                      (detection.confidence && detection.confidence > 0.7);

  if (shouldReport) {
    const reportData = {
      content: element.textContent.trim(),
      flagReason: detection.type,
      platform: getPlatform(),
      context: {
        url: window.location.href,
        detectionSource: detection.source,
        confidence: detection.confidence || 0.5,
        aiAnalysis: detection.aiAnalysis || null,
        elementInfo: {
          tagName: element.tagName.toLowerCase(),
          className: element.className,
          id: element.id
        }
      },
      timestamp: new Date().toISOString()
    };

    chrome.runtime.sendMessage({
      action: 'submitReport',
      reportData
    }, (response) => {
      if (response?.result) {
        console.log('Report submitted successfully:', response.result);
        // Update stats for report submission
        chrome.runtime.sendMessage({
          action: 'updateStats',
          data: { reportsSubmitted: 1 }
        });
      }
    });
  }
}

function getPlatform() {
  const url = window.location.hostname;
  if (url.includes('twitter')) return 'Twitter';
  if (url.includes('reddit')) return 'Reddit';
  if (url.includes('youtube')) return 'YouTube';
  if (url.includes('facebook')) return 'Facebook';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('tiktok')) return 'TikTok';
  return 'Web';
}
