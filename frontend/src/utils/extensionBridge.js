// Bridge for communicating with TypeAware browser extension

export class ExtensionBridge {
  constructor() {
    this.isExtensionAvailable = false;
    this.extensionId = 'typeaware-extension'; // This should match the extension ID
    this.checkExtensionAvailability();
  }

  // Check if the extension is installed and available
  checkExtensionAvailability() {
    if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
      this.isExtensionAvailable = true;
    }
  }

  // Send message to extension
  async sendMessage(message) {
    if (!this.isExtensionAvailable) {
      console.warn('TypeAware extension is not available');
      return null;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        window.chrome.runtime.sendMessage(this.extensionId, message, (response) => {
          if (window.chrome.runtime.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      return response;
    } catch (error) {
      console.error('Failed to communicate with extension:', error);
      return null;
    }
  }

  // Analyze text using extension
  async analyzeText(text) {
    return this.sendMessage({
      action: 'analyzeText',
      data: { text }
    });
  }

  // Get extension statistics
  async getStats() {
    return this.sendMessage({
      action: 'getStats'
    });
  }

  // Update extension settings
  async updateSettings(settings) {
    return this.sendMessage({
      action: 'updateSettings',
      data: settings
    });
  }

  // Get extension status
  async getStatus() {
    return this.sendMessage({
      action: 'getStatus'
    });
  }

  // Listen for extension events
  addEventListener(callback) {
    if (!this.isExtensionAvailable) {
      return () => {}; // Return empty cleanup function
    }

    const messageListener = (request, sender, sendResponse) => {
      if (sender.id === this.extensionId) {
        callback(request);
        sendResponse({ received: true });
      }
    };

    window.chrome.runtime.onMessage.addListener(messageListener);

    // Return cleanup function
    return () => {
      if (window.chrome?.runtime?.onMessage) {
        window.chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }
}

// Singleton instance
export const extensionBridge = new ExtensionBridge();

// React hook for using extension bridge
export const useExtensionBridge = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [extensionData, setExtensionData] = useState(null);

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      const status = await extensionBridge.getStatus();
      setIsConnected(!!status);
    };

    checkConnection();

    // Listen for extension events
    const cleanup = extensionBridge.addEventListener((data) => {
      setExtensionData(data);
    });

    return cleanup;
  }, []);

  return {
    isConnected,
    extensionData,
    analyzeText: extensionBridge.analyzeText.bind(extensionBridge),
    getStats: extensionBridge.getStats.bind(extensionBridge),
    updateSettings: extensionBridge.updateSettings.bind(extensionBridge)
  };
};

// For React import
import { useState, useEffect } from 'react';