# 🚀 ELECTRON IMPLEMENTATION ROADMAP

> **Status**: ULTRATHINK Mode Active
> **Phase**: Full Migration Implementation
> **Approach**: Code first, test after complete

---

## 📋 IMPLEMENTATION STRATEGY

Based on complete Python codebase analysis (1,706 lines), implementing full-featured Electron application with all capabilities:

### Python Features Inventory:

1. **Configuration System** (lines 34-101)
   - JSON file storage (trivia_config.json)
   - API keys (OpenAI, Gemini) with env fallback
   - Model selection (4 OpenAI models, 4 Gemini models)
   - Custom prompt with templates
   - Region persistence
   - HiDPI detection

2. **Settings Dialog** (lines 149-585, 436 lines)
   - Tabbed interface: API Keys | Models | Prompt
   - Password visibility toggle
   - API connection testing (live validation)
   - Model dropdowns with recommendations
   - Prompt templates (Default, Detailed, Quick)
   - Color scheme: #2c3e50, #34495e, #1abc9c

3. **Region Selector** (lines 588-1028, 440 lines)
   - Drawing mode: Click-drag to create
   - Adjustment mode: Drag to move, 8 resize handles
   - Handles: nw, n, ne, e, se, s, sw, w (10px squares)
   - Live dimension display
   - Keyboard: ESC (cancel), ENTER (confirm)
   - HiDPI scaling (logical → physical pixels)
   - Minimum size: 20x20px

4. **Main Application** (lines 1030-1651, 621 lines)
   - Window: 500x750, left-side positioned
   - Live preview (1-second refresh, 400px width)
   - Dual AI panels (OpenAI + Gemini)
   - Status display (2-line)
   - Buttons: Select Region, Screenshot & Analyze, Settings
   - Region info label

5. **Screen Capture** (lines 1380-1422)
   - mss library (primary)
   - PIL ImageGrab (fallback)
   - HiDPI scaling
   - macOS permission detection
   - Blank screen detection

6. **AI Integration** (lines 1474-1646)
   - Parallel execution (ThreadPoolExecutor)
   - OpenAI Vision API (base64 PNG, "high" detail, 500 max_tokens)
   - Gemini multimodal (direct image object)
   - 30-second timeout per API
   - Duration tracking (milliseconds)
   - Error handling per API (continue if one fails)

---

## 🎯 IMPLEMENTATION ORDER

### Phase 1: Foundation (Core Infrastructure)
**Files**: package.json, main.js updates, new config module

1. ✅ Update package.json with ALL dependencies
2. ✅ Implement configuration system (electron-store)
3. ✅ Create config manager module
4. ✅ Add logging system

### Phase 2: Screen Capture Enhancement
**Files**: main.js screen capture section, new utils/capture.js

5. ✅ Implement Sharp-based region cropping
6. ✅ Add HiDPI scaling logic
7. ✅ Implement image saving with timestamps
8. ✅ Add permission detection (macOS)

### Phase 3: Advanced Region Selector
**Files**: selector.html, selector.js, selector.css

9. ✅ Implement 8 resize handles (nw, n, ne, e, se, s, sw, w)
10. ✅ Add drag-to-move functionality
11. ✅ Implement handle-based resizing
12. ✅ Add live dimension display
13. ✅ Ensure minimum size constraints (20x20px)
14. ✅ Add cursor changes (fleur, corners, sides)

### Phase 4: Live Preview System
**Files**: renderer.js, main.js IPC

15. ✅ Implement 1-second auto-refresh
16. ✅ Add preview image display (400px max width)
17. ✅ Handle aspect ratio preservation
18. ✅ Add start/stop preview controls

### Phase 5: AI Integration
**Files**: new utils/ai.js, main.js IPC handlers

19. ✅ Implement OpenAI Vision API client
20. ✅ Implement Gemini multimodal API client
21. ✅ Create parallel execution wrapper (Promise.all)
22. ✅ Add base64 encoding for OpenAI
23. ✅ Add duration tracking
24. ✅ Implement error isolation (one API can fail)

### Phase 6: Settings Dialog
**Files**: new settings.html, settings.js, settings.css

25. ✅ Create tabbed interface (API Keys, Models, Prompt)
26. ✅ Implement API key input with visibility toggle
27. ✅ Add connection test buttons (live validation)
28. ✅ Create model selection dropdowns
29. ✅ Add prompt editor with templates
30. ✅ Implement save/cancel functionality

### Phase 7: UI Polish & Error Handling
**Files**: All files - error boundaries, logging

31. ✅ Add comprehensive error handling
32. ✅ Implement user-friendly error messages
33. ✅ Add loading states and progress indicators
34. ✅ Create notification system
35. ✅ Add keyboard shortcuts (global)

### Phase 8: Assets & Build
**Files**: assets/, electron-builder config

36. ✅ Create application icon (multiple sizes)
37. ✅ Update electron-builder configuration
38. ✅ Add DMG background (macOS)
39. ✅ Configure code signing placeholders
40. ✅ Set up auto-updater skeleton

---

## 📁 FILE STRUCTURE

```
electron-app/
├── package.json (updated with all deps)
├── main.js (updated with AI, config)
├── preload.js (updated with new IPC methods)
├── .gitignore
├── README.md
│
├── src/
│   ├── index.html (main window - updated)
│   ├── styles.css (updated)
│   ├── renderer.js (updated with preview, AI)
│   ├── selector.html (updated with handles)
│   ├── selector.js (updated with 8 handles)
│   ├── selector.css (new - selector-specific styles)
│   ├── settings.html (new - settings dialog)
│   ├── settings.js (new - settings logic)
│   └── settings.css (new - settings styles)
│
├── utils/ (new directory)
│   ├── config.js (electron-store wrapper)
│   ├── capture.js (Sharp-based screen capture)
│   ├── ai.js (OpenAI + Gemini clients)
│   ├── logger.js (logging system)
│   └── constants.js (shared constants)
│
├── assets/ (new directory)
│   ├── icon.png (1024x1024)
│   ├── icon.icns (macOS)
│   ├── icon.ico (Windows)
│   └── icons/ (various sizes)
│
└── captured_images/ (created at runtime)
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### Dependencies Required:

```json
{
  "dependencies": {
    "electron-store": "^8.1.0",      // Config persistence
    "axios": "^1.6.0",                 // HTTP client for OpenAI
    "@google/generative-ai": "^0.1.0", // Gemini client
    "sharp": "^0.33.0",                // Image processing
    "electron-log": "^5.0.1"           // Logging
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  }
}
```

### Configuration Schema:

```javascript
{
  "api_keys": {
    "openai": "",
    "gemini": ""
  },
  "models": {
    "openai_model": "gpt-4o-mini",
    "gemini_model": "gemini-2.0-flash-exp"
  },
  "prompt": "This image contains a trivia question...",
  "region": {
    "left": 0,
    "top": 0,
    "width": 800,
    "height": 600
  },
  "preferences": {
    "previewEnabled": true,
    "previewInterval": 1000
  }
}
```

### IPC Methods Required:

```javascript
// Main → Renderer
'config-updated'
'preview-update' (image data)
'ai-response-openai' (response, duration)
'ai-response-gemini' (response, duration)
'error' (message)

// Renderer → Main
'open-selector'
'close-selector'
'save-region' (region data)
'capture-screenshot'
'analyze-screenshot'
'get-config'
'set-config' (config data)
'test-openai-connection' (api_key)
'test-gemini-connection' (api_key)
'open-settings'
'start-preview'
'stop-preview'
```

---

## ⚡ CRITICAL IMPLEMENTATION DETAILS

### 1. HiDPI Scaling

```javascript
// Detect scale factor
const primaryDisplay = screen.getPrimaryDisplay();
const scaleFactor = primaryDisplay.scaleFactor; // 1.0, 2.0, etc.

// Region selector: logical → physical pixels
const physicalRegion = {
  left: logicalX * scaleFactor,
  top: logicalY * scaleFactor,
  width: logicalWidth * scaleFactor,
  height: logicalHeight * scaleFactor
};

// Capture: use physical pixels
const screenshot = await desktopCapturer.getSources({
  types: ['screen'],
  thumbnailSize: {
    width: display.size.width * scaleFactor,
    height: display.size.height * scaleFactor
  }
});

// Crop with Sharp
const cropped = await sharp(screenshot)
  .extract({
    left: region.left,
    top: region.top,
    width: region.width,
    height: region.height
  })
  .toBuffer();
```

### 2. Parallel AI Execution

```javascript
async function analyzeWithBothAIs(imagePath, config) {
  const promises = [];

  if (config.api_keys.openai) {
    promises.push(analyzeWithOpenAI(imagePath, config));
  }

  if (config.api_keys.gemini) {
    promises.push(analyzeWithGemini(imagePath, config));
  }

  // Promise.allSettled allows partial success
  const results = await Promise.allSettled(promises);

  return {
    openai: results[0]?.status === 'fulfilled' ? results[0].value : { error: results[0].reason },
    gemini: results[1]?.status === 'fulfilled' ? results[1].value : { error: results[1].reason }
  };
}
```

### 3. Region Selector 8 Handles

```javascript
// Handle positions (relative to region bounds)
const handles = {
  'nw': { x: x1, y: y1, cursor: 'nwse-resize' },
  'n':  { x: (x1+x2)/2, y: y1, cursor: 'ns-resize' },
  'ne': { x: x2, y: y1, cursor: 'nesw-resize' },
  'e':  { x: x2, y: (y1+y2)/2, cursor: 'ew-resize' },
  'se': { x: x2, y: y2, cursor: 'nwse-resize' },
  's':  { x: (x1+x2)/2, y: y2, cursor: 'ns-resize' },
  'sw': { x: x1, y: y2, cursor: 'nesw-resize' },
  'w':  { x: x1, y: (y1+y2)/2, cursor: 'ew-resize' }
};

// Resize logic
if (resizing) {
  if (handle.includes('n')) region.top += dy, region.height -= dy;
  if (handle.includes('s')) region.height += dy;
  if (handle.includes('w')) region.left += dx, region.width -= dx;
  if (handle.includes('e')) region.width += dx;

  // Enforce minimum size
  region.width = Math.max(20, region.width);
  region.height = Math.max(20, region.height);
}
```

### 4. Live Preview Loop

```javascript
let previewTimer = null;

function startPreview() {
  if (previewTimer) return;

  previewTimer = setInterval(async () => {
    try {
      const screenshot = await captureRegion(config.region);
      const resized = await resizeForPreview(screenshot, 400); // max width
      mainWindow.webContents.send('preview-update', resized);
    } catch (error) {
      console.error('Preview error:', error);
    }
  }, 1000); // 1 second
}

function stopPreview() {
  if (previewTimer) {
    clearInterval(previewTimer);
    previewTimer = null;
  }
}
```

---

## 🎨 UI COLOR SCHEME (Match Python Exactly)

```css
:root {
  --bg-primary: #2c3e50;      /* Main background */
  --bg-secondary: #34495e;    /* Frames, panels */
  --accent: #1abc9c;          /* Selection, highlights */
  --input-bg: #1e2a38;        /* Text inputs */
  --text-color: #ecf0f1;      /* Primary text */
  --text-dim: #bdc3c7;        /* Secondary text */
  --text-dimmer: #95a5a6;     /* Tertiary text */
  --success: #27ae60;         /* Success button */
  --warning: #f39c12;         /* Warning */
  --danger: #e74c3c;          /* Error, cancel */
  --info: #3498db;            /* Info button */
  --purple: #9b59b6;          /* Settings button */
  --openai: #10a37f;          /* OpenAI brand */
  --gemini: #4285f4;          /* Google brand */
}
```

---

## 📊 IMPLEMENTATION METRICS

**Total Estimated Code:**
- Updated files: 1,200 lines
- New files: 1,800 lines
- **Total: ~3,000 lines** (vs Python's 1,706 lines)

**Complexity Increase Reasons:**
- Multi-process architecture (main + renderer + preload)
- Explicit IPC communication
- Security boundaries (contextBridge)
- Modern async/await patterns
- Enhanced error handling
- Modular structure

**Time Estimate:**
- Foundation: 2 hours
- Screen Capture: 1 hour
- Region Selector: 2 hours
- Live Preview: 1 hour
- AI Integration: 2 hours
- Settings Dialog: 2 hours
- Polish: 2 hours
- **Total: 12 hours**

**Files to Create/Modify:**
- Update: 5 files (package.json, main.js, preload.js, renderer.js, selector.js)
- Create: 9 files (settings.html/js/css, selector.css, utils/*.js, assets)
- **Total: 14 files**

---

## ✅ COMPLETION CHECKLIST

### Foundation
- [ ] Update package.json with all dependencies
- [ ] Create utils/config.js (electron-store wrapper)
- [ ] Create utils/logger.js (logging system)
- [ ] Create utils/constants.js (shared constants)

### Screen Capture
- [ ] Create utils/capture.js (Sharp-based capture)
- [ ] Implement HiDPI scaling
- [ ] Add region cropping
- [ ] Add image saving with timestamps

### Region Selector
- [ ] Update selector.js with 8 handles
- [ ] Implement drag-to-move
- [ ] Implement resize logic
- [ ] Create selector.css
- [ ] Add dimension display
- [ ] Add cursor changes

### Live Preview
- [ ] Implement preview loop in main.js
- [ ] Add IPC handlers for preview
- [ ] Update renderer.js with preview display
- [ ] Add start/stop controls

### AI Integration
- [ ] Create utils/ai.js
- [ ] Implement OpenAI Vision client
- [ ] Implement Gemini multimodal client
- [ ] Add parallel execution
- [ ] Add duration tracking
- [ ] Add error isolation

### Settings Dialog
- [ ] Create settings.html
- [ ] Create settings.js
- [ ] Create settings.css
- [ ] Implement tabs (API Keys, Models, Prompt)
- [ ] Add visibility toggle
- [ ] Add connection testing
- [ ] Add model dropdowns
- [ ] Add prompt templates

### Polish
- [ ] Add error handling everywhere
- [ ] Implement loading states
- [ ] Add notification system
- [ ] Create keyboard shortcuts
- [ ] Add comprehensive logging

### Assets & Build
- [ ] Create application icon
- [ ] Update electron-builder config
- [ ] Add DMG background
- [ ] Configure code signing placeholders
- [ ] Set up auto-updater skeleton

---

**Status**: Ready to begin Phase 1
**Next Action**: Update package.json with all dependencies
