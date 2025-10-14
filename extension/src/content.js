// Local detection patterns - no API needed
const detectionPatterns = {
  HARASSMENT: {
    severity: "high",
    color: "#dc2626",
    patterns: [
      /\b(loser|stupid|idiot|dumb|fool|hate you|kill yourself|kys)\b/gi,
      /stfu|shut.*up|go away|nobody likes/gi,
      /you're.*trash|you suck/gi
    ]
  },
  HATE_SPEECH: {
    severity: "high",
    color: "#b91c1c",
    patterns: [
      /\b(damn|hell|crap)\b/gi, // mild version for demo
      /(slur words would go here)/gi
    ]
  },
  PROFANITY: {
    severity: "medium",
    color: "#ea580c",
    patterns: [
      /\b(hell|damn|crap|sucks?|pissed)\b/gi
    ]
  },
  SPAM: {
    severity: "low",
    color: "#ca8a04",
    patterns: [
      /buy now|click here|limited time|act now/gi,
      /follow my link|check my profile/gi
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
        platform: this.detectPlatform(),
        url: window.location.href,
        timestamp: Date.now(),
        category: detection.category,
        severity: detection.severity,
        confidence: detection.confidence,
        textLength: text.length,
        elementType: element?.tagName?.toLowerCase() || "unknown"
      };

      // Store detection locally
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
    this.stylesInjected = false;
    this.injectStyles();
  }

  injectStyles() {
    if (this.stylesInjected) return;

    const style = document.createElement("style");
    style.setAttribute("data-typeaware", "injected-styles");
    style.textContent = `
      .typeaware-highlight {
        position: relative;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.15));
        border-radius: 4px;
        border: 2px solid rgba(239, 68, 68, 0.5);
        padding: 2px 4px;
        margin: 0 1px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
      }

      .typeaware-highlight:hover {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.25));
        border-color: rgba(239, 68, 68, 0.7);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
      }

      .typeaware-popup {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 2px solid #dc2626;
        z-index: 999999;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
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
        opacity: 0 !important;
        transform: translateY(-10px) scale(0.95) !important;
      }
    `;

    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  highlightElement(element, detection) {
    if (element.classList.contains("typeaware-highlight")) return;

    element.classList.add("typeaware-highlight");
    element.setAttribute("data-typeaware-category", detection.category);
    element.setAttribute("data-typeaware-severity", detection.severity);

    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showSuggestionPopup(element, detection);
    });
  }

  showSuggestionPopup(element, detection) {
    this.hideAllPopups();

    const rect = element.getBoundingClientRect();
    const popup = this.createPopup(detection);

    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add("visible"), 10);
    setTimeout(() => this.hidePopup(popup), config.UI.POPUP_FADE_DELAY);

    this.activePopups.add(popup);
  }

  createPopup(detection) {
    const popup = document.createElement("div");
    popup.className = "typeaware-popup";

    popup.innerHTML = `
      <div class="typeaware-popup-header">
        ⚠️ ${this.capitalizeFirst(detection.category)} Detected
      </div>
      <div class="typeaware-popup-content">
        <p style="margin: 0 0 8px; color: #6b7280;">
          ${detection.explanation || "This content may be harmful or inappropriate."}
        </p>
        ${detection.suggestion ? `
          <div class="typeaware-popup-suggestion">
            💡 ${detection.suggestion}
          </div>
        ` : ""}
      </div>
      <div class="typeaware-popup-actions">
        <button class="typeaware-btn typeaware-btn-secondary" onclick="this.closest('.typeaware-popup').remove()">
          Dismiss
        </button>
        <button class="typeaware-btn typeaware-btn-primary" onclick="window.open('https://typeaware.com', '_blank')">
          Learn More
        </button>
      </div>
    `;

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

class MutationObserver {
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

      const text = element.textContent.trim();
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

    console.log("MutationObserver cleanup completed");
  }
}

// Initialize everything
const detector = new ContentDetector();
const uiManager = new UIManager();
const mutationObserver = new MutationObserver();

mutationObserver.initializeObserver(detector, uiManager);

// Process existing content
document.addEventListener("DOMContentLoaded", () => {
  const elements = mutationObserver.findTextElements(document.body);
  mutationObserver.batchQueue.push(...elements);
  mutationObserver.processBatch(detector, uiManager);
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    // Disable/enable detection based on request
    if (!request.enabled) {
      document.querySelectorAll(".typeaware-highlight").forEach(el => {
        el.classList.remove("typeaware-highlight");
      });
    }
  }
});

// Page unload cleanup
window.addEventListener("beforeunload", () => {
  console.log("TypeAware: Cleaning up content script resources");

  // Destroy mutation observer
  if (mutationObserver) {
    mutationObserver.destroy();
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
    if (mutationObserver && mutationObserver.debounceTimer) {
      clearTimeout(mutationObserver.debounceTimer);
      mutationObserver.debounceTimer = null;
    }
  }
});
