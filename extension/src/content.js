
class TypeAwareDetector {
  constructor() {
    this.isEnabled = true;
    this.processed = new Set();
    this.abusivePatterns = this.initializePatterns();
    this.suggestions = this.initializeSuggestions();
    
    this.init();
  }

  async init() {
    // Check if extension is enabled
    const result = await chrome.storage.local.get(['enabled']);
    this.isEnabled = result.enabled !== false;
    
    if (this.isEnabled) {
      this.startDetection();
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleExtension') {
        this.isEnabled = request.enabled;
        if (this.isEnabled) {
          this.startDetection();
        } else {
          this.stopDetection();
        }
      }
    });
  }

  initializePatterns() {
    return {
      harassment: [
        /\b(kill\s+yourself|kys)\b/gi,
        /\b(you\s+suck|you're\s+stupid|idiot|moron)\b/gi,
        /\b(shut\s+up|stfu)\b/gi,
        /\b(loser|pathetic|worthless)\b/gi
      ],
      hate: [
        /\b(racist|fascist|nazi)\b/gi,
        /\b(hate\s+you|i\s+hate)\b/gi,
        /\b(disgusting|gross|sick)\b/gi
      ],
      spam: [
        /\b(buy\s+now|click\s+here|free\s+money)\b/gi,
        /\b(amazing\s+offer|limited\s+time)\b/gi,
        /\b(www\.|http|\.com)\b/gi
      ],
      profanity: [
        /\b(f[u\*]ck|sh[i\*]t|damn|hell)\b/gi,
        /\b(b[i\*]tch|a[s\*]{2}hole)\b/gi
      ],
      threats: [
        /\b(i'll\s+kill|gonna\s+hurt|beat\s+you\s+up)\b/gi,
        /\b(watch\s+out|you're\s+dead)\b/gi,
        /\b(threat|violence|harm)\b/gi
      ]
    };
  }

  initializeSuggestions() {
    return {
      harassment: [
        "I disagree with your point of view",
        "That's not how I see it",
        "I think differently about this"
      ],
      hate: [
        "I respectfully disagree",
        "We have different perspectives",
        "I see this differently"
      ],
      spam: [
        "Here's something you might find interesting",
        "I'd like to share this with you",
        "You might want to check this out"
      ],
      profanity: [
        "That's really frustrating",
        "This is quite annoying",
        "I'm disappointed by this"
      ],
      threats: [
        "I'm really upset about this",
        "This situation is very frustrating",
        "I strongly disagree with this"
      ]
    };
  }

  startDetection() {
    console.log('TypeAware detection started');
    
    // Detect existing content
    this.scanPage();
    
    // Monitor for new content
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanElement(node);
          }
        });
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Monitor text inputs
    this.monitorInputs();
  }

  stopDetection() {
    console.log('TypeAware detection stopped');
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove all warnings
    document.querySelectorAll('.typeaware-warning').forEach(el => el.remove());
    document.querySelectorAll('.typeaware-overlay').forEach(el => el.remove());
  }

  scanPage() {
    // Scan common content areas based on platform
    const selectors = this.getPlatformSelectors();
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.scanElement(element);
      });
    });
  }

  getPlatformSelectors() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return ['[data-testid="tweetText"]', '[data-testid="tweet"]', 'div[role="textbox"]'];
    } else if (hostname.includes('youtube.com')) {
      return ['#content-text', '#comment-content', '.comment-text'];
    } else if (hostname.includes('reddit.com')) {
      return ['.usertext-body', '.md', '[data-testid="comment"]'];
    } else if (hostname.includes('facebook.com')) {
      return ['[data-testid="post_message"]', '.userContent', 'div[role="textbox"]'];
    }
    
    // Generic selectors
    return ['p', 'div', 'span', 'textarea', 'input[type="text"]'];
  }

  scanElement(element) {
    if (this.processed.has(element) || !element.textContent) {
      return;
    }
    
    this.processed.add(element);
    
    const text = element.textContent.trim();
    if (text.length < 3) return;
    
    const detection = this.detectAbusiveContent(text);
    
    if (detection.isAbusive) {
      this.handleAbusiveContent(element, detection, text);
    }
    
    // Update stats
    this.updateStats({ totalScanned: 1 });
  }

  detectAbusiveContent(text) {
    const result = {
      isAbusive: false,
      types: [],
      confidence: 0,
      matches: []
    };
    
    for (const [type, patterns] of Object.entries(this.abusivePatterns)) {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          result.isAbusive = true;
          result.types.push(type);
          result.matches.push(...matches);
          result.confidence = Math.max(result.confidence, 0.8);
        }
      }
    }
    
    // Additional heuristics
    if (!result.isAbusive) {
      // Check for excessive caps
      const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      if (capsRatio > 0.7 && text.length > 10) {
        result.isAbusive = true;
        result.types.push('aggressive');
        result.confidence = 0.6;
      }
      
      // Check for repetitive characters
      if (/(.)\1{4,}/.test(text)) {
        result.isAbusive = true;
        result.types.push('spam');
        result.confidence = 0.5;
      }
    }
    
    return result;
  }

  handleAbusiveContent(element, detection, originalText) {
    // Create warning overlay
    const overlay = this.createWarningOverlay(element, detection, originalText);
    
    // Blur the content
    element.style.filter = 'blur(3px)';
    element.style.opacity = '0.7';
    
    // Store detection
    this.storeDetection(detection, originalText);
    
    // Update stats
    this.updateStats({ threatsDetected: 1 });
  }

  createWarningOverlay(element, detection, originalText) {
    const overlay = document.createElement('div');
    overlay.className = 'typeaware-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid #ef4444;
      border-radius: 8px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    // Make parent relative if needed
    const parent = element.offsetParent || element.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    const warning = document.createElement('div');
    warning.className = 'typeaware-warning';
    warning.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #ef4444;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    const primaryType = detection.types[0] || 'inappropriate';
    warning.textContent = `⚠️ Potentially ${primaryType} content detected`;
    
    // Add action buttons
    const actions = document.createElement('div');
    actions.style.cssText = `
      position: absolute;
      top: -80px;
      left: 0;
      display: flex;
      gap: 8px;
      z-index: 10002;
    `;
    
    // Show content button
    const showBtn = document.createElement('button');
    showBtn.textContent = 'Show';
    showBtn.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    `;
    showBtn.onclick = () => {
      element.style.filter = 'none';
      element.style.opacity = '1';
      overlay.remove();
    };
    
    // Report button
    const reportBtn = document.createElement('button');
    reportBtn.textContent = 'Report';
    reportBtn.style.cssText = `
      background: #ef4444;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    `;
    reportBtn.onclick = () => {
      this.reportContent(detection, originalText);
      reportBtn.textContent = 'Reported';
      reportBtn.style.background = '#10b981';
    };
    
    // Suggestions button
    const suggestBtn = document.createElement('button');
    suggestBtn.textContent = 'Suggest';
    suggestBtn.style.cssText = `
      background: #10b981;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    `;
    suggestBtn.onclick = () => {
      this.showSuggestions(element, detection, originalText);
    };
    
    actions.appendChild(showBtn);
    actions.appendChild(reportBtn);
    actions.appendChild(suggestBtn);
    
    overlay.appendChild(warning);
    overlay.appendChild(actions);
    
    // Position relative to element
    element.style.position = 'relative';
    element.appendChild(overlay);
    
    return overlay;
  }

  showSuggestions(element, detection, originalText) {
    const primaryType = detection.types[0] || 'harassment';
    const suggestions = this.suggestions[primaryType] || this.suggestions.harassment;
    
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      max-width: 400px;
      z-index: 20000;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;
    
    popup.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Suggested Alternatives</h3>
      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Consider using one of these alternatives:</p>
      <div style="margin-bottom: 16px;">
        ${suggestions.map(suggestion => `
          <div style="
            background: #f3f4f6;
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            border: 1px solid transparent;
          " 
          class="suggestion-item"
          onmouseover="this.style.background='#e5e7eb'; this.style.borderColor='#d1d5db'"
          onmouseout="this.style.background='#f3f4f6'; this.style.borderColor='transparent'"
          onclick="navigator.clipboard.writeText('${suggestion}'); this.innerHTML='✓ Copied to clipboard';"
          >${suggestion}</div>
        `).join('')}
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #6b7280;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        float: right;
      ">Close</button>
    `;
    
    document.body.appendChild(popup);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (popup.parentElement) {
        popup.remove();
      }
    }, 10000);
  }

  monitorInputs() {
    // Monitor text inputs for real-time detection
    document.addEventListener('input', (e) => {
      if (!this.isEnabled) return;
      
      const element = e.target;
      if (element.tagName === 'TEXTAREA' || 
          (element.tagName === 'INPUT' && element.type === 'text') ||
          element.contentEditable === 'true') {
        
        const text = element.value || element.textContent;
        if (text && text.length > 10) {
          const detection = this.detectAbusiveContent(text);
          
          if (detection.isAbusive) {
            this.showInputWarning(element, detection);
          } else {
            this.hideInputWarning(element);
          }
        }
      }
    });
  }

  showInputWarning(element, detection) {
    // Remove existing warning
    this.hideInputWarning(element);
    
    const warning = document.createElement('div');
    warning.className = 'typeaware-input-warning';
    warning.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 0;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 4px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    const primaryType = detection.types[0] || 'inappropriate';
    warning.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Potentially ${primaryType} content</div>
      <div style="font-size: 11px;">Consider rephrasing your message</div>
    `;
    
    element.style.position = 'relative';
    element.parentElement.style.position = 'relative';
    element.parentElement.appendChild(warning);
  }

  hideInputWarning(element) {
    const existing = element.parentElement?.querySelector('.typeaware-input-warning');
    if (existing) {
      existing.remove();
    }
  }

  async storeDetection(detection, content) {
    const result = await chrome.storage.local.get(['detections']);
    const detections = result.detections || [];
    
    detections.push({
      ...detection,
      content: content.substring(0, 200), // Limit content length
      platform: window.location.hostname,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 detections
    if (detections.length > 50) {
      detections.splice(0, detections.length - 50);
    }
    
    await chrome.storage.local.set({ detections });
  }

  reportContent(detection, content) {
    chrome.runtime.sendMessage({
      action: 'reportContent',
      data: {
        content: content.substring(0, 500),
        types: detection.types,
        confidence: detection.confidence,
        platform: window.location.hostname,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  }

  updateStats(update) {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      data: update
    });
  }
}

// Initialize the detector when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TypeAwareDetector();
  });
} else {
  new TypeAwareDetector();
}
