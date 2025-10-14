import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Activity, Settings, BarChart3, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
const Popup = () => {
  const [stats, setStats] = useState({
    totalScanned: 0,
    threatsDetected: 0,
    reportsSubmitted: 0,
    isEnabled: true
  });

  const [recentDetections, setRecentDetections] = useState([]);

  useEffect(() => {
    loadExtensionData();
  }, []);

  const loadExtensionData = async () => {
    try {
      const result = await chrome.storage.local.get(['stats', 'detections', 'enabled']);
      
      if (result.stats) {
        setStats(prev => ({ ...prev, ...result.stats }));
      }
      
      if (result.detections) {
        setRecentDetections(result.detections.slice(-5));
      }
      
      if (result.enabled !== undefined) {
        setStats(prev => ({ ...prev, isEnabled: result.enabled }));
      }
    } catch (error) {
      console.error('Error loading extension data:', error);
    }
  };

  const toggleExtension = async () => {
    const newEnabled = !stats.isEnabled;
    setStats(prev => ({ ...prev, isEnabled: newEnabled }));
    
    await chrome.storage.local.set({ enabled: newEnabled });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleExtension', 
      enabled: newEnabled 
    });
  };

  const openWebApp = () => {
    chrome.tabs.create({ url: 'http://localhost:8080/dashboard' });
  };

  const clearData = async () => {
    await chrome.storage.local.clear();
    setStats({
      totalScanned: 0,
      threatsDetected: 0,
      reportsSubmitted: 0,
      isEnabled: true
    });
    setRecentDetections([]);
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Aurora Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      
      {/* Animated Dots Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

      <div className="relative p-4 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Shield className="w-7 h-7 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-md"></div>
            </div>
            <h1 className="text-xl font-bold text-white">TypeAware</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stats.isEnabled ? 'bg-green-400' : 'bg-red-400'} shadow-lg ${stats.isEnabled ? 'shadow-green-400/80' : 'shadow-red-400/80'}`}></div>
            <button
              onClick={toggleExtension}
              className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                stats.isEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              } transition-all shadow-lg hover:scale-105`}
            >
              {stats.isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-cyan-300" />
              <span className="text-2xl font-bold text-white">{stats.totalScanned}</span>
            </div>
            <p className="text-xs text-white/90 font-medium">Messages Scanned</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-300" />
              <span className="text-2xl font-bold text-white">{stats.threatsDetected}</span>
            </div>
            <p className="text-xs text-white/90 font-medium">Threats Detected</p>
          </div>
        </div>

        {/* Recent Detections */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/30 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recent Detections
          </h3>
          {recentDetections.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 scrollbar-thumb-rounded-full">
              {recentDetections.map((detection, index) => (
                <div key={index} className="bg-red-500/30 backdrop-blur-sm border border-red-400/50 rounded-xl p-2.5 hover:bg-red-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-100">{detection.types?.[0] || 'inappropriate'}</span>
                    <span className="text-xs text-red-200 font-medium">{detection.platform}</span>
                  </div>
                  <p className="text-xs text-red-100 truncate">
                    {detection.content.substring(0, 45)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Zap className="w-8 h-8 text-white/50 mx-auto mb-2" />
              <p className="text-xs text-white/70">No recent detections</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={openWebApp}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-3 px-4 text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-lg hover:scale-105"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Open Dashboard</span>
          </button>
          
          <button
            onClick={clearData}
            className="w-full bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white rounded-xl py-3 px-4 text-sm font-bold transition-all flex items-center justify-center space-x-2 border border-white/30 shadow-lg hover:scale-105"
          >
            <Settings className="w-4 h-4" />
            <span>Clear Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Mount the React app to the DOM
function initPopup() {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
