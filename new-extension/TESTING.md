# TypeAware Extension - Testing Guide

## Quick Start (Development Mode)

### Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `new-extension` folder
5. The TypeAware extension should now appear in your extensions list

### Testing the Popup Buttons

Once loaded, click the TypeAware extension icon in your toolbar to open the popup. You should see:

#### Available Buttons:

1. **🛡️ Status Toggle (ON/OFF)**
   - Click to enable/disable the extension
   - Color changes: Green (ON) / Red (OFF)
   - Status persists across browser sessions

2. **🔍 Scan Messages**
   - Scans messages on the current active tab
   - Works on: Twitter, YouTube, Reddit, Facebook, Instagram
   - Requires content script to be loaded on the page

3. **⚠️ Check Threats**
   - Checks for threats on the current active tab
   - Highlights detected threats with warnings
   - Works on supported social media platforms

4. **📊 Dashboard**
   - Opens the TypeAware dashboard in a new tab
   - URL: `http://localhost:8080/dashboard`
   - Requires backend server to be running

5. **🗑️ Clear Data**
   - Clears all detection history and statistics
   - Shows confirmation dialog before clearing
   - Resets counters to zero

### Testing on Supported Platforms

The extension works on these platforms:
- Twitter (X.com)
- YouTube
- Reddit
- Facebook
- Instagram

**Note:** The content script only loads on these platforms. On other websites, the "Scan Messages" and "Check Threats" buttons won't have any effect.

### Viewing Statistics

The popup displays:
- **📊 Messages Scanned**: Total number of messages analyzed
- **⚠️ Threats Detected**: Total number of threats found
- **Recent Detections**: Last 5 detections with timestamp and platform

Statistics update automatically every 2 seconds while the popup is open.

## Production Build

For production deployment:

```bash
npm install
npm run build
```

This creates a `dist` folder with the bundled extension ready for distribution.

### Load Production Build

1. Go to `chrome://extensions/`
2. Click **Load unpacked**
3. Select the `dist` folder (not `new-extension`)

## Troubleshooting

### Buttons Not Working?

1. **Check Console**: Right-click popup → Inspect → Console tab
2. **Reload Extension**: Go to `chrome://extensions/` and click the reload icon
3. **Check Permissions**: Ensure all required permissions are granted
4. **Verify Content Script**: The page must be one of the supported platforms

### Content Script Not Loading?

- Refresh the webpage after loading the extension
- Check if the URL matches the supported platforms
- Look for errors in the page console (F12)

### Dashboard Not Opening?

- Ensure the backend server is running on `http://localhost:8080`
- Check if port 8080 is available
- Verify the backend is properly configured

## Development Tips

- Use `console.log()` statements to debug
- Check both popup console and page console for errors
- Storage data persists between popup opens
- Use Chrome DevTools to inspect storage: `chrome://extensions/` → Details → Inspect views: service worker