# TypeAware Extension

A Chrome extension for AI-powered content moderation that detects and highlights harmful content across social media platforms.

## 🚀 Features

- **Real-time Content Detection**: Automatically scans and highlights harmful content
- **Multi-platform Support**: Works on Twitter, Reddit, YouTube, Facebook, Instagram, and TikTok
- **Local Detection**: All detection happens locally - no data sent to external servers
- **Statistics Dashboard**: Track detections in real-time
- **One-click Toggle**: Enable/disable the extension instantly
- **Clean UI**: Beautiful, modern popup interface

## 📁 File Structure

```
typeaware-extension/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── popup.html         # Popup interface
├── popup.js           # Popup functionality
├── content.js         # Content script for scanning
├── content.css        # Content styling
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## 🔧 Installation

### Option 1: Manual Installation

1. **Download the extension files** to a folder on your computer
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right corner)
4. **Click "Load unpacked"**
5. **Select the extension folder**
6. **Done!** The extension is now installed

### Option 2: Using npm

```bash
npm install
npm run build
# Then load the folder in Chrome
```

## 🎯 How to Use

1. **Enable the Extension**: Click the toggle button to turn it ON/OFF
2. **Browse Normally**: Visit any supported social media platform
3. **See Detections**: Harmful content will be highlighted with a red border
4. **View Statistics**: Check the popup to see scan count and threats detected
5. **Clear Data**: Use the "Clear" button to reset statistics

## 🛡️ Detected Categories

- **Harassment**: Personal attacks, bullying
- **Hate Speech**: Discriminatory content
- **Threats**: Violent language or threats
- **Profanity**: Offensive language
- **Spam**: Unwanted promotional content

## 🔒 Privacy

- ✅ No data collection
- ✅ No tracking
- ✅ All detection happens locally
- ✅ No external API calls
- ✅ Storage only in browser

## 📊 Storage

The extension stores:
- Detection statistics (total scanned, threats found)
- Recent detections (last 100)
- Extension state (enabled/disabled)

All data is stored in `chrome.storage.local`

## 🚀 Supported Platforms

- Twitter (X)
- Reddit
- YouTube
- Facebook
- Instagram
- TikTok

## 🐛 Troubleshooting

### Buttons not working?
- Check the browser console (F12)
- Make sure all files are in the correct location
- Try reloading the extension

### Not detecting content?
- Make sure the extension is enabled (toggle ON)
- Refresh the page
- Try visiting a supported platform

### Performance issues?
- Disable if not actively using
- Use the Clear button to reset data
- Restart Chrome if needed

## 📝 Version

Version 1.0.0

## 💡 Tips

- The extension respects user privacy - all processing is local
- Detection patterns are updated periodically
- Use the statistics to understand online safety trends
- Report false positives to help improve detection

## 📞 Support

For issues or feature requests, please visit the project repository.

---

**Stay Safe Online with TypeAware** 🛡️