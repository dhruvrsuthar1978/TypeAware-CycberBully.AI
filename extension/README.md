# TypeAware Extension

Chrome extension for TypeAware moderation with real-time page scanning and typed-message protection.

## Features

- Real-time detection on supported social platforms
- Highlighting of detected risky content
- AI-assisted analysis and rephrase suggestions
- Pre-submit blocking for high-risk typed messages (toggle in Settings)
- Auto-report option for severe detections
- Popup dashboard with live stats and backend health status

## Backend Requirement

Run backend at `http://localhost:8010`.

Extension API usage:
- `GET /api/health`
- `POST /api/ai/analyze`
- `POST /api/ai/rephrase`
- `POST /api/message`
- `POST /api/extension/reports`

## Install (Developer Mode)

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked
4. Select the `extension` folder

## Notes

- Data is stored in `chrome.storage.local` (stats, settings, recent detections, local UUID).
- Backend must be running before using AI/rephrase/block/report features.
- Supported domains are listed in `manifest.json`.
