
# TypeAware Browser Extension

A browser extension for real-time detection and reporting of abusive online behavior.

## Features

- **Real-time Detection**: Scans content on popular platforms (Twitter, YouTube, Reddit, Facebook)
- **On-device Processing**: No server calls needed for detection
- **Smart Warnings**: Overlays warnings on potentially offensive content
- **Content Suggestions**: Offers alternative phrasings for problematic text
- **Anonymous Reporting**: Reports content with anonymous UUID tracking
- **Platform Integration**: Works seamlessly across multiple social platforms

## Installation

### Development Mode

1. Clone the repository
2. Navigate to the extension directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build

```bash
npm run build
```

This creates a production-ready extension in the `dist` folder.

## Architecture

### Content Detection
- **Pattern Matching**: Uses regex patterns to identify problematic content
- **Sentiment Analysis**: Analyzes emotional tone of messages
- **Platform-Specific Rules**: Customized detection for different platforms
- **Fuzzy Matching**: Catches creative spelling of offensive terms

### User Interface
- **Popup Dashboard**: Shows statistics and recent detections
- **Content Overlays**: Visual warnings on flagged content
- **Suggestion System**: Provides alternative phrasings
- **Report Buttons**: Easy one-click reporting

### Data Management
- **Local Storage**: Uses `chrome.storage.local` for data persistence
- **Anonymous UUIDs**: Tracks users without collecting PII
- **Data Cleanup**: Automatically removes old data

## Detection Categories

1. **Harassment**: Personal attacks, bullying, threats
2. **Hate Speech**: Discriminatory language, slurs
3. **Spam**: Promotional content, repetitive messages
4. **Threats**: Violence, intimidation
5. **General Toxicity**: Negative sentiment, offensive language

## Configuration

The extension can be configured through:
- **Popup Interface**: Toggle on/off, view statistics
- **Storage Settings**: Adjust sensitivity, manage data
- **Platform Rules**: Customize detection per platform

## Privacy

- **No PII Collection**: Only anonymous UUIDs are used
- **Local Processing**: Detection happens on-device
- **Minimal Data**: Only necessary information is stored
- **User Control**: Users can clear data anytime

## Integration with TypeAware Web App

The extension integrates with the main TypeAware web application:
- Reports are sent to the central system
- Statistics sync across devices
- Shared user preferences and settings
- Unified dashboard experience

## Development

### File Structure
```
extension/
├── manifest.json          # Extension manifest
├── src/
│   ├── popup.jsx         # Popup interface
│   ├── content.js        # Content script
│   ├── background.js     # Background script
│   └── utils/
│       └── detector.js   # Detection utilities
├── content.css           # Content script styles
└── icons/                # Extension icons
```

### Building
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## Browser Support

- Chrome (Manifest V3)
- Edge (Manifest V3)
- Firefox (with minor modifications)

## License

This project is part of the TypeAware platform for online safety and content moderation.