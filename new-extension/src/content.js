// Local detection patterns - no API needed
// Note: Removed 'g' flag from patterns to prevent lastIndex issues with .test()
const detectionPatterns = {
  HARASSMENT: {
    severity: "high",
    color: "#dc2626",
    patterns: [
      /\b(loser|stupid|idiot|dumb|fool|hate you|kill yourself|kys)\b/i,
      /stfu|shut.*up|go away|nobody likes/i,
      /you're.*trash|you suck/i
    ]
  },
  HATE_SPEECH: {
    severity: "high",
    color: "#b91c1c",
    patterns: [
      /\b(damn|hell|crap)\b/i // mild version for demo
    ]
  },
  PROFANITY: {
    severity: "medium",
    color: "#ea580c",
    patterns: [
      /\b(hell|damn|crap|sucks?|pissed)\b/i
    ]
  },
  SPAM: {
    severity: "low",
    color: "#ca8a04",
    patterns: [
      /buy now|click here|limited time|act now/i,
      /follow my link|check my profile/i
    ]
  }
};

const config = {
  API_BASE_URL: "https://api.typeaware.com",
  EXTENSION_ID: chrome.runtime.id,
  VERSION: "1.0.0",
  DETECTION_THRESHOLDS: {
    MIN_TEXT_LENGTH: 3,
    MAX_TEXT_LENGTH: 5000,
    BATCH_SIZE: 5,
    DEBOUNCE_DELAY: 300
  },
  UI: {
    POPUP_FADE_DELAY: 5000,
    MAX_SUGGESTIONS: 3,
    ANIMATION_DURATION: 200
  }
};

class ContentDetector {
  constructor() {
    this.cache = new Map();
    this.processingQueue = new Set();
  }

  async detectContent(text, element) {
    if (!text || text.length < config.DETECTION_THRESHOLDS.MIN_TEXT_LENGTH) {
      return null;
    }

    // Local pattern matching instead of API call
    const result = this.analyzeWithPatterns(text);
    
    if (result && result.category !== "none") {
      this.logDetection(result, text, element);
    }

    return result;
  }

  analyzeWithPatterns(text) {
    for (const [category, data] of Object.entries(detectionPatterns)) {
      for (const pattern of data.patterns) {
        if (pattern.test(text)) {
          return {
            category: category.toLowerCase(),
            severity: data.severity,
            confidence: 0.85,
            explanation: `Detected ${category.replace(/_/g, " ").toLowerCase()} in content`,
            suggestion: "Consider using more respectful language",
            color: data.color
          };
        }
      }
    }

    return {
      category: "none",
      severity: "low",
      confidence: 0,
      explanation: "",
      suggestion: "",
      color: ""
    };
  }

  async logDetection(detection, text, element) {
    try {
      const metadata = {
        types: [detection.category],
        content: text.substring(0, 100), // Truncate for storage
        platform: this.detectPlatform(),
        timestamp: Date.now()
      };

      // Store detection directly using chrome.storage
      await this.storeDetection(metadata);

      // Update stats
      await chrome.runtime.sendMessage({
        action: "updateStats",
        data: {
          totalScanned: 1,
          threatsDetected: 1
        }
      });

      console.log("Threat detected:", metadata);
    } catch (error) {
      console.error("Detection logging error:", error);
    }
  }

  // Inline storage utilities to avoid module imports
  async storeDetection(detection) {
    try {
      // Get current detections
      const result = await chrome.storage.local.get(['detections']);
      let detections = result.detections || [];

      // Add new detection
      detections.unshift(detection);

      // Keep only last 50 detections
      if (detections.length > 50) {
        detections = detections.slice(0, 50);
      }

      // Store updated detections
      await chrome.storage.local.set({ detections });

      return true;
    } catch (error) {
      console.error('Error storing detection:', error);
      return false;
    }
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("youtube.com")) return "youtube";
    if (hostname.includes("reddit.com")) return "reddit";
    if (hostname.includes("facebook.com")) return "facebook";
    return "web";
  }
}

class UIManager {
  constructor() {
    this.activePopups = new Set();
    this.highlightedElements = new WeakMap();
    this.shadowHost = null;
    this.shadowRoot = null;
    this.initShadowDOM();
  }

  initShadowDOM() {
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'typeaware-shadow-host';
    document.body.appendChild(this.shadowHost);
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(`
      :host {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }

      .typeaware-popup {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 2px solid #dc2626;
        z-index: 999999;
        max-width: 350px;
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
        transition: all 0.2s ease;
        pointer-events: none;
      }

      .typeaware-popup.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .typeaware-popup-header {
        padding: 12px 16px;
        border-bottom: 2px solid #dc2626;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        border-radius: 10px 10px 0 0;
        font-weight: 600;
        color: #dc2626;
      }

      .typeaware-popup-content {
        padding: 12px 16px;
        font-size: 13px;
        color: #374151;
      }

      .typeaware-popup-suggestion {
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 8px;
        font-style: italic;
        color: #166534;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .typeaware-popup-suggestion:hover {
        background: #dcfce7;
        border-color: #4ade80;
      }

      .typeaware-popup-actions {
        padding: 8px 16px 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .typeaware-btn {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }

      .typeaware-btn-primary {
        background: #dc2626;
        color: white;
      }

      .typeaware-btn-primary:hover {
        background: #b91c1c;
      }

      .typeaware-btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .typeaware-btn-secondary:hover {
        background: #e2e8f0;
      }

      .typeaware-fade-out {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  highlightElement(element, detection) {
    if (element.classList.contains("typeaware-highlight")) return;

    element.classList.add("typeaware-highlight");
    element.setAttribute("data-typeaware-category", detection.category);
    element.setAttribute("data-typeaware-severity", detection.severity);

    const clickHandler = (e) => {
      e.stopPropagation();
      this.showSuggestionPopup(element, detection);
    };
    
    element.addEventListener("click", clickHandler);
    this.highlightedElements.set(element, clickHandler);
  }

  removeHighlight(element) {
    if (!element.classList.contains("typeaware-highlight")) return;

    element.classList.remove("typeaware-highlight");
    element.removeAttribute("data-typeaware-category");
    element.removeAttribute("data-typeaware-severity");

    const clickHandler = this.highlightedElements.get(element);
    if (clickHandler) {
      element.removeEventListener("click", clickHandler);
      this.highlightedElements.delete(element);
    }
  }

  removeAllHighlights() {
    document.querySelectorAll(".typeaware-highlight").forEach(el => {
      this.removeHighlight(el);
    });
  }

  showSuggestionPopup(element, detection) {
    this.hideAllPopups();

    const rect = element.getBoundingClientRect();
    const popup = this.createPopup(detection);

    const position = this.calculatePopupPosition(rect, popup);
    popup.style.left = `${position.left}px`;
    popup.style.top = `${position.top}px`;

    this.shadowRoot.appendChild(popup);

    setTimeout(() => popup.classList.add("visible"), 10);
    setTimeout(() => this.hidePopup(popup), config.UI.POPUP_FADE_DELAY);

    this.activePopups.add(popup);
  }

  calculatePopupPosition(elementRect, popup) {
    const popupWidth = 350;
    const popupHeight = 200;
    const padding = 10;

    let left = elementRect.left + window.scrollX;
    let top = elementRect.bottom + window.scrollY + 5;

    if (left + popupWidth > window.innerWidth + window.scrollX - padding) {
      left = window.innerWidth + window.scrollX - popupWidth - padding;
    }

    if (left < window.scrollX + padding) {
      left = window.scrollX + padding;
    }

    if (top + popupHeight > window.innerHeight + window.scrollY - padding) {
      top = elementRect.top + window.scrollY - popupHeight - 5;
      if (top < window.scrollY + padding) {
        top = elementRect.bottom + window.scrollY + 5;
      }
    }

    return { left, top };
  }

  createPopup(detection) {
    const popup = document.createElement("div");
    popup.className = "typeaware-popup";

    const header = document.createElement("div");
    header.className = "typeaware-popup-header";
    header.textContent = `⚠️ ${this.capitalizeFirst(detection.category)} Detected`;
    popup.appendChild(header);

    const content = document.createElement("div");
    content.className = "typeaware-popup-content";

    const explanation = document.createElement("p");
    explanation.style.margin = "0 0 8px";
    explanation.style.color = "#6b7280";
    explanation.textContent = detection.explanation || "This content may be harmful or inappropriate.";
    content.appendChild(explanation);

    if (detection.suggestion) {
      const suggestion = document.createElement("div");
      suggestion.className = "typeaware-popup-suggestion";
      suggestion.textContent = `💡 ${detection.suggestion}`;
      content.appendChild(suggestion);
    }

    popup.appendChild(content);

    const actions = document.createElement("div");
    actions.className = "typeaware-popup-actions";

    const dismissBtn = document.createElement("button");
    dismissBtn.className = "typeaware-btn typeaware-btn-secondary";
    dismissBtn.textContent = "Dismiss";
    dismissBtn.onclick = () => this.hidePopup(popup);
    actions.appendChild(dismissBtn);

    const learnMoreBtn = document.createElement("button");
    learnMoreBtn.className = "typeaware-btn typeaware-btn-primary";
    learnMoreBtn.textContent = "Learn More";
    learnMoreBtn.onclick = () => window.open('https://typeaware.com', '_blank');
    actions.appendChild(learnMoreBtn);

    popup.appendChild(actions);

    return popup;
  }

  hideAllPopups() {
    this.activePopups.forEach(popup => this.hidePopup(popup));
    this.activePopups.clear();
  }

  hidePopup(popup) {
    if (!popup) return;

    popup.classList.add("typeaware-fade-out");
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
      this.activePopups.delete(popup);
    }, config.UI.ANIMATION_DURATION);
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

class ContentScanObserver {
  constructor() {
    this.observer = null;
    this.processedElements = new WeakSet();
    this.debounceTimer = null;
    this.batchQueue = [];
    this.isProcessing = false;
    this.eventListeners = new WeakMap(); // Track event listeners for cleanup
    this.isDestroyed = false;
  }

  initializeObserver(detector, uiManager) {
    this.observer = new window.MutationObserver((mutations) => {
      this.debounceProcessing(() => this.processMutations(mutations, detector, uiManager));
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  debounceProcessing(callback) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(callback, config.DETECTION_THRESHOLDS.DEBOUNCE_DELAY);
  }

  processMutations(mutations, detector, uiManager) {
    const newElements = new Set();

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.findTextElements(node).forEach(el => newElements.add(el));
          }
        });
      } else if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent && this.isTextElement(parent)) {
          newElements.add(parent);
        }
      }
    });

    if (newElements.size > 0) {
      this.batchQueue.push(...Array.from(newElements));
      this.processBatch(detector, uiManager);
    }
  }

  findTextElements(element) {
    const elements = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (this.isTextElement(node) && node.textContent.trim().length > 0) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      elements.push(node);
    }

    return elements;
  }

  isTextElement(element) {
    const tag = element.tagName.toLowerCase();

    const excludedTags = ["script", "style", "noscript", "meta", "link"];
    if (excludedTags.includes(tag)) return false;

    if (this.processedElements.has(element)) return false;

    return true;
  }

  async processBatch(detector, uiManager) {
    if (this.isProcessing || this.isDestroyed) return;

    this.isProcessing = true;
    const batch = this.batchQueue.splice(0, config.DETECTION_THRESHOLDS.BATCH_SIZE);

    for (const element of batch) {
      if (this.isDestroyed) break;

      let text = element.textContent.trim();

      // Enforce text length limit to prevent regex DoS
      if (text.length > config.DETECTION_THRESHOLDS.MAX_TEXT_LENGTH) {
        text = text.substring(0, config.DETECTION_THRESHOLDS.MAX_TEXT_LENGTH);
      }

      const detection = await detector.detectContent(text, element);

      if (detection && detection.category !== "none") {
        uiManager.highlightElement(element, detection);
      }
    }

    this.isProcessing = false;

    if (this.batchQueue.length > 0 && !this.isDestroyed) {
      await this.processBatch(detector, uiManager);
    }
  }

  // Cleanup method to properly dispose of resources
  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Disconnect the MutationObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear any pending timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Clear batch queue
    this.batchQueue.length = 0;

    // Clear processed elements (WeakSet will be garbage collected)
    // Note: WeakSet automatically cleans up when elements are removed from DOM

    console.log("ContentScanObserver cleanup completed");
  }
}

// Initialize everything
const detector = new ContentDetector();
const uiManager = new UIManager();
const contentScanObserver = new ContentScanObserver();

contentScanObserver.initializeObserver(detector, uiManager);

// Process existing content - handle both loaded and loading states
function initializeScan() {
  const elements = contentScanObserver.findTextElements(document.body);
  contentScanObserver.batchQueue.push(...elements);
  contentScanObserver.processBatch(detector, uiManager);
}

// Check if DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeScan);
} else {
  // DOM already loaded, scan immediately
  initializeScan();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    // Disable/enable detection based on request
    if (!request.enabled) {
      // Properly remove all highlights with event listener cleanup
      uiManager.removeAllHighlights();
    }
  }
});

// Page unload cleanup
window.addEventListener("beforeunload", () => {
  console.log("TypeAware: Cleaning up content script resources");

  // Destroy content scan observer
  if (contentScanObserver) {
    contentScanObserver.destroy();
  }

  // Hide all active popups
  if (uiManager) {
    uiManager.hideAllPopups();
  }

  // Clear any remaining highlights
  document.querySelectorAll(".typeaware-highlight").forEach(el => {
    el.classList.remove("typeaware-highlight");
  });

  // Clear any injected styles (optional, as page is unloading)
  const injectedStyles = document.querySelector('style[data-typeaware]');
  if (injectedStyles) {
    injectedStyles.remove();
  }
});

// Additional cleanup on page visibility change (when tab becomes hidden)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, reduce activity
    if (contentScanObserver && contentScanObserver.debounceTimer) {
      clearTimeout(contentScanObserver.debounceTimer);
      contentScanObserver.debounceTimer = null;
    }
  }
});
