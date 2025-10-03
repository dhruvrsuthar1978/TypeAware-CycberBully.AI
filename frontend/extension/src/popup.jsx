import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Activity, Settings, BarChart3, AlertTriangle } from 'lucide-react';

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
    chrome.tabs.create({ url: 'https://typeaware.lovable.app' });
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
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-800">TypeAware</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${stats.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <button
            onClick={toggleExtension}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              stats.isEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            } transition-colors`}
          >
            {stats.isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-bold text-gray-800">{stats.totalScanned}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Messages Scanned</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-lg font-bold text-gray-800">{stats.threatsDetected}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Threats Detected</p>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Detections</h3>
        {recentDetections.length > 0 ? (
          <div className="space-y-2">
            {recentDetections.map((detection, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-red-700">{detection.type}</span>
                  <span className="text-xs text-red-600">{detection.platform}</span>
                </div>
                <p className="text-xs text-red-600 mt-1 truncate">
                  {detection.content.substring(0, 50)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">No recent detections</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={openWebApp}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Open Dashboard</span>
        </button>
        
        <button
          onClick={clearData}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Clear Data</span>
        </button>
      </div>
    </div>
  );
};

// Mount the React app to the DOM
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Popup />);
