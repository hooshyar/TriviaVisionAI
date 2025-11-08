# TriviaVisionAI: Electron Migration Plan

> **Strategic Migration from Python/Tkinter to Electron**
> Complete modernization roadmap for cross-platform desktop application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Migration Strategy](#migration-strategy)
4. [12-Day Implementation Timeline](#12-day-implementation-timeline)
5. [Architecture Comparison](#architecture-comparison)
6. [Code Migration Examples](#code-migration-examples)
7. [Technical Stack](#technical-stack)
8. [Risk Assessment](#risk-assessment)
9. [Success Criteria](#success-criteria)
10. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Why Migrate to Electron?

**Current Challenges with Tkinter:**
- ❌ Outdated UI appearance (native widgets look dated)
- ❌ Limited styling capabilities (CSS-like styling difficult)
- ❌ Complex distribution (Python + dependencies bundling)
- ❌ Platform inconsistencies (different behavior on Windows/macOS/Linux)
- ❌ Limited modern UI patterns (no flexbox, grid, animations)

**Benefits of Electron:**
- ✅ Modern, customizable UI with HTML/CSS/JavaScript
- ✅ Consistent cross-platform appearance
- ✅ Rich ecosystem (npm packages for everything)
- ✅ Better distribution (single executable with auto-updates)
- ✅ Native performance with Node.js backend
- ✅ Active community and extensive documentation

### Migration Scope

**Lines of Code:** ~1,700 Python → ~2,500 JavaScript/HTML/CSS
**Timeline:** 12 days (phased approach)
**Risk Level:** Medium (well-understood technology stack)
**Team Size:** 1-2 developers
**Downtime:** Zero (parallel development)

---

## Current State Analysis

### File Structure (Python/Tkinter)

```
TriviaVisionAI/
├── TriviaCaptureAI.py          # 1,706 lines - monolithic application
├── requirements.txt             # 4 Python dependencies
├── README.md                    # User documentation
├── MAC_SETUP.md                # macOS setup guide
├── trivia_config.json          # Configuration (gitignored)
└── captured_images/            # Screenshot storage
```

### Architecture Components

#### 1. **TriviaVisionAI Class** (Lines 1030-1650)
- Main application window (500x750px)
- UI setup and management
- Screenshot orchestration
- Configuration persistence
- Live preview system (1-second refresh)

#### 2. **RegionSelector Class** (Lines 588-1028)
- Fullscreen transparent overlay
- Interactive region selection (drag-to-draw)
- 8-handle resizing system (corners + edges)
- Retina/HiDPI display scaling
- Drag-to-move adjustment mode

#### 3. **SettingsDialog Class** (Lines 149-586)
- Modal settings dialog
- 3-tab interface (API Keys, Models, Prompt)
- API connection testing
- Password masking with toggle

### Dependency Analysis

```python
# Current Python Dependencies
Pillow>=10.0.0              # Image processing
requests>=2.31.0            # HTTP client
mss>=9.0.1                  # Screenshot capture
google-generativeai>=0.8.0  # Gemini API
tkinter                     # GUI (built-in)
```

**Equivalent Electron Stack:**
```json
{
  "electron": "^28.0.0",
  "sharp": "^0.33.0",              // Image processing
  "axios": "^1.6.0",               // HTTP client
  "@google/generative-ai": "^0.1.0", // Gemini API
  "electron-store": "^8.1.0",      // Config storage
  "screenshot-desktop": "^1.15.0"  // Screenshot capture
}
```

---

## Migration Strategy

### Phase-Based Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    MIGRATION PHASES                          │
├─────────────────────────────────────────────────────────────┤
│ Phase 1: Foundation (Days 1-3)                              │
│   • Project setup                                            │
│   • Main window UI                                           │
│   • Configuration system                                     │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: Core Features (Days 4-7)                           │
│   • Screen capture                                           │
│   • Region selector                                          │
│   • Live preview                                             │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: AI Integration (Days 8-10)                         │
│   • OpenAI API integration                                   │
│   • Gemini API integration                                   │
│   • Parallel processing                                      │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: Polish & Deploy (Days 11-12)                       │
│   • Settings dialog                                          │
│   • Testing & bug fixes                                      │
│   • Build & distribution                                     │
└─────────────────────────────────────────────────────────────┘
```

### Parallel Development Strategy

**Maintain both versions during migration:**
1. Keep `TriviaCaptureAI.py` functional (master branch)
2. Develop Electron version in `electron-app/` directory
3. Feature parity testing before final switch
4. Gradual rollout to users (beta testing)

---

## 12-Day Implementation Timeline

### **Day 1: Project Initialization & Setup**

**Duration:** 8 hours
**Deliverables:** Working Electron boilerplate

**Tasks:**
- [ ] Install Node.js and npm/yarn
- [ ] Initialize npm project: `npm init -y`
- [ ] Install Electron and dev dependencies
- [ ] Create project structure:
  ```
  electron-app/
  ├── package.json
  ├── main.js              # Electron main process
  ├── preload.js           # Security bridge
  ├── src/
  │   ├── index.html       # Main window HTML
  │   ├── styles.css       # Global styles
  │   ├── renderer.js      # Renderer process
  │   └── components/      # UI components
  ├── assets/              # Icons, images
  └── build/               # Build configuration
  ```
- [ ] Configure webpack/vite for bundling
- [ ] Test basic window creation
- [ ] Setup hot-reload for development

**Success Criteria:**
- ✅ Electron window opens with "Hello World"
- ✅ Dev tools accessible (F12)
- ✅ Hot-reload working for instant updates

---

### **Day 2: Main Window UI Structure**

**Duration:** 8 hours
**Deliverables:** Complete UI layout matching Tkinter design

**Tasks:**
- [ ] Create HTML structure for main window
- [ ] Implement CSS with exact color scheme:
  ```css
  :root {
    --bg-primary: #2c3e50;
    --bg-secondary: #34495e;
    --accent: #1abc9c;
    --input-bg: #1e2a38;
    --text-color: #ecf0f1;
  }
  ```
- [ ] Build component hierarchy:
  ```
  Main Window (500x750px)
  ├── Title Header
  ├── Live Preview Panel
  ├── AI Responses Panel
  │   ├── OpenAI Response
  │   └── Gemini Response
  ├── Status Display
  ├── Action Buttons
  │   ├── Select Region
  │   ├── Screenshot & Analyze
  │   └── Settings
  └── Region Info Footer
  ```
- [ ] Configure window properties:
  ```javascript
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    x: 0,  // Left-aligned
    resizable: false,
    backgroundColor: '#2c3e50',
    // ...
  });
  ```
- [ ] Add emoji buttons matching current design
- [ ] Implement responsive layout (CSS Grid/Flexbox)

**Success Criteria:**
- ✅ Window appears at left edge of screen
- ✅ UI matches Tkinter design pixel-perfect
- ✅ All buttons styled correctly

---

### **Day 3: Configuration System**

**Duration:** 8 hours
**Deliverables:** Config persistence with electron-store

**Tasks:**
- [ ] Install `electron-store`: `npm install electron-store`
- [ ] Create ConfigManager class:
  ```javascript
  const Store = require('electron-store');
  const config = new Store({
    defaults: {
      api_keys: { openai: '', gemini: '' },
      models: {
        openai_model: 'gpt-4o-mini',
        gemini_model: 'gemini-2.0-flash-exp'
      },
      prompt: 'This image contains a trivia question...',
      region: null
    }
  });
  ```
- [ ] Implement IPC (Inter-Process Communication):
  ```javascript
  // Main process
  ipcMain.handle('get-config', () => config.store);
  ipcMain.handle('set-config', (event, key, value) => {
    config.set(key, value);
  });

  // Renderer process
  const currentConfig = await ipcRenderer.invoke('get-config');
  ```
- [ ] Create config validation functions
- [ ] Test config persistence across app restarts
- [ ] Implement config migration from Python JSON

**Success Criteria:**
- ✅ Config persists across restarts
- ✅ IPC communication working
- ✅ Can import existing `trivia_config.json`

---

### **Day 4: Screenshot Capture System**

**Duration:** 8 hours
**Deliverables:** Working screenshot capture with HiDPI support

**Tasks:**
- [ ] Research Electron screenshot APIs:
  - Option 1: `desktopCapturer` API (native)
  - Option 2: `screenshot-desktop` npm package
- [ ] Implement screen detection:
  ```javascript
  const { screen } = require('electron');
  const displays = screen.getAllDisplays();
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
  ```
- [ ] Create ScreenCapture module:
  ```javascript
  async function captureRegion(region) {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: region.width * scaleFactor,
        height: region.height * scaleFactor
      }
    });
    // Crop to exact region
    const img = await sharp(sources[0].thumbnail.toPNG())
      .extract({
        left: region.left * scaleFactor,
        top: region.top * scaleFactor,
        width: region.width * scaleFactor,
        height: region.height * scaleFactor
      })
      .toBuffer();
    return img;
  }
  ```
- [ ] Test on HiDPI/Retina displays
- [ ] Implement multi-monitor support
- [ ] Add screenshot saving to `captured_images/`

**Success Criteria:**
- ✅ Screenshots captured at correct resolution
- ✅ HiDPI scaling handled properly
- ✅ Files saved with timestamps

---

### **Day 5-6: Region Selector (Critical Component)**

**Duration:** 16 hours
**Deliverables:** Interactive region selection overlay

**Tasks:**
- [ ] Create transparent fullscreen overlay window:
  ```javascript
  const selectorWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  ```
- [ ] Build HTML canvas for drawing:
  ```html
  <canvas id="selector-canvas"></canvas>
  <div id="dimensions-display"></div>
  ```
- [ ] Implement mouse event handlers:
  ```javascript
  // Drawing phase
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', updateDrawing);
  canvas.addEventListener('mouseup', finishDrawing);

  // Adjustment phase
  canvas.addEventListener('mousedown', checkHandleClick);
  canvas.addEventListener('mousemove', dragHandle);
  canvas.addEventListener('mouseup', releaseHandle);
  ```
- [ ] Create 8-handle resize system:
  ```javascript
  const handles = [
    { position: 'nw', cursor: 'nwse-resize' },
    { position: 'n',  cursor: 'ns-resize' },
    { position: 'ne', cursor: 'nesw-resize' },
    { position: 'e',  cursor: 'ew-resize' },
    { position: 'se', cursor: 'nwse-resize' },
    { position: 's',  cursor: 'ns-resize' },
    { position: 'sw', cursor: 'nesw-resize' },
    { position: 'w',  cursor: 'ew-resize' }
  ];
  ```
- [ ] Implement drag-to-move functionality
- [ ] Add keyboard shortcuts (Escape, Enter)
- [ ] Display real-time dimensions
- [ ] Visual feedback (highlight, borders)

**Success Criteria:**
- ✅ Can draw region with mouse
- ✅ Can resize with 8 handles
- ✅ Can drag to move entire region
- ✅ ESC cancels, ENTER confirms

---

### **Day 7: Live Preview System**

**Duration:** 8 hours
**Deliverables:** Auto-updating preview panel

**Tasks:**
- [ ] Create preview loop with setInterval:
  ```javascript
  let previewInterval = null;

  function startPreview() {
    if (previewInterval) clearInterval(previewInterval);

    previewInterval = setInterval(async () => {
      const region = config.get('region');
      if (!region) return;

      const screenshot = await captureRegion(region);
      const base64 = screenshot.toString('base64');

      // Send to renderer
      mainWindow.webContents.send('preview-update', base64);
    }, 1000);
  }
  ```
- [ ] Implement preview image display:
  ```javascript
  // Renderer
  ipcRenderer.on('preview-update', (event, base64) => {
    const img = document.getElementById('preview-image');
    img.src = `data:image/png;base64,${base64}`;
  });
  ```
- [ ] Add resize logic (max 400x200px, maintain aspect ratio):
  ```css
  #preview-image {
    max-width: 400px;
    max-height: 200px;
    object-fit: contain;
  }
  ```
- [ ] Optimize performance (debouncing, throttling)
- [ ] Add loading spinner during capture
- [ ] Test with various screen sizes

**Success Criteria:**
- ✅ Preview updates every 1 second
- ✅ Image scales correctly
- ✅ No memory leaks

---

### **Day 8: OpenAI Integration**

**Duration:** 8 hours
**Deliverables:** Working OpenAI API calls

**Tasks:**
- [ ] Install dependencies: `npm install axios`
- [ ] Create OpenAI service module:
  ```javascript
  const axios = require('axios');

  async function analyzeWithOpenAI(imageBuffer, apiKey, model, prompt) {
    const base64 = imageBuffer.toString('base64');
    const startTime = Date.now();

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }],
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const answer = response.data.choices[0].message.content;

      return { answer, duration, error: null };
    } catch (error) {
      return { answer: null, duration: null, error: error.message };
    }
  }
  ```
- [ ] Add model options:
  ```javascript
  const OPENAI_MODELS = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4'
  ];
  ```
- [ ] Implement IPC handlers for API calls
- [ ] Test with various image sizes
- [ ] Handle rate limits and errors

**Success Criteria:**
- ✅ API calls succeed
- ✅ Responses displayed correctly
- ✅ Timing tracked accurately

---

### **Day 9: Gemini Integration**

**Duration:** 8 hours
**Deliverables:** Working Gemini API calls

**Tasks:**
- [ ] Install SDK: `npm install @google/generative-ai`
- [ ] Create Gemini service module:
  ```javascript
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  async function analyzeWithGemini(imageBuffer, apiKey, model, prompt) {
    const startTime = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model });

      const imageParts = [{
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/png'
        }
      }];

      const result = await geminiModel.generateContent([
        prompt,
        ...imageParts
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const answer = result.response.text();

      return { answer, duration, error: null };
    } catch (error) {
      return { answer: null, duration: null, error: error.message };
    }
  }
  ```
- [ ] Add model options:
  ```javascript
  const GEMINI_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];
  ```
- [ ] Test with sample images
- [ ] Handle API errors gracefully

**Success Criteria:**
- ✅ Gemini API working
- ✅ Model switching functional
- ✅ Error handling robust

---

### **Day 10: Parallel Processing**

**Duration:** 8 hours
**Deliverables:** Simultaneous API calls with Promise.all

**Tasks:**
- [ ] Implement parallel execution:
  ```javascript
  async function analyzeScreenshot(imageBuffer) {
    const openaiKey = config.get('api_keys.openai');
    const geminiKey = config.get('api_keys.gemini');
    const prompt = config.get('prompt');
    const openaiModel = config.get('models.openai_model');
    const geminiModel = config.get('models.gemini_model');

    // Disable screenshot button
    mainWindow.webContents.send('analysis-started');

    // Run in parallel
    const [openaiResult, geminiResult] = await Promise.all([
      analyzeWithOpenAI(imageBuffer, openaiKey, openaiModel, prompt),
      analyzeWithGemini(imageBuffer, geminiKey, geminiModel, prompt)
    ]);

    // Send results to renderer
    mainWindow.webContents.send('openai-result', openaiResult);
    mainWindow.webContents.send('gemini-result', geminiResult);

    // Re-enable screenshot button
    mainWindow.webContents.send('analysis-complete');
  }
  ```
- [ ] Update UI in real-time as results arrive
- [ ] Add loading indicators per API
- [ ] Implement timeout handling (30s per API)
- [ ] Test with slow network conditions
- [ ] Add retry logic for failed requests

**Success Criteria:**
- ✅ Both APIs called simultaneously
- ✅ Results display as they arrive
- ✅ Proper error handling

---

### **Day 11: Settings Dialog**

**Duration:** 8 hours
**Deliverables:** Complete settings modal with 3 tabs

**Tasks:**
- [ ] Create modal window:
  ```javascript
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: mainWindow,
    modal: true,
    resizable: false,
    backgroundColor: '#2c3e50'
  });
  ```
- [ ] Build 3-tab interface:
  ```html
  <div class="tabs">
    <button class="tab active" data-tab="api-keys">API Keys</button>
    <button class="tab" data-tab="models">Models</button>
    <button class="tab" data-tab="prompt">Prompt</button>
  </div>

  <div class="tab-content" id="api-keys">
    <input type="password" id="openai-key" />
    <button id="toggle-openai">Show/Hide</button>
    <button id="test-openai">Test Connection</button>
  </div>
  ```
- [ ] Implement password masking toggle:
  ```javascript
  document.getElementById('toggle-openai').addEventListener('click', () => {
    const input = document.getElementById('openai-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  ```
- [ ] Add API connection testing:
  ```javascript
  async function testOpenAIConnection(apiKey) {
    try {
      const response = await axios.get(
        'https://api.openai.com/v1/models',
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      return { success: true, message: 'Connection successful!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  ```
- [ ] Create model dropdowns with current selections
- [ ] Implement prompt templates
- [ ] Save/Cancel buttons with config persistence

**Success Criteria:**
- ✅ Settings save correctly
- ✅ API tests work
- ✅ Modal opens/closes properly

---

### **Day 12: Testing, Polish & Build**

**Duration:** 8 hours
**Deliverables:** Production-ready application

**Tasks:**
- [ ] End-to-end testing:
  - [ ] Region selection (all scenarios)
  - [ ] Screenshot capture (various resolutions)
  - [ ] API calls (both services)
  - [ ] Config persistence
  - [ ] Settings dialog (all tabs)
  - [ ] Live preview
- [ ] Performance optimization:
  - [ ] Reduce memory footprint
  - [ ] Optimize preview loop
  - [ ] Minimize bundle size
- [ ] macOS-specific testing:
  - [ ] Check screen recording permissions
  - [ ] Test on Retina displays
  - [ ] Verify multi-monitor support
- [ ] Configure electron-builder:
  ```json
  {
    "build": {
      "appId": "com.triviavisionai.app",
      "productName": "TriviaVisionAI",
      "files": ["dist/**/*", "main.js", "preload.js"],
      "mac": {
        "target": ["dmg", "zip"],
        "icon": "assets/icon.icns",
        "category": "public.app-category.productivity"
      },
      "win": {
        "target": ["nsis", "portable"],
        "icon": "assets/icon.ico"
      },
      "linux": {
        "target": ["AppImage", "deb"],
        "icon": "assets/icon.png"
      }
    }
  }
  ```
- [ ] Build installers:
  ```bash
  npm run build          # Production build
  npm run dist:mac       # macOS DMG
  npm run dist:win       # Windows installer
  npm run dist:linux     # Linux AppImage
  ```
- [ ] Test installers on clean machines
- [ ] Create migration guide for users

**Success Criteria:**
- ✅ All features working
- ✅ No critical bugs
- ✅ Installers build successfully

---

## Architecture Comparison

### Current Architecture (Python/Tkinter)

```
┌─────────────────────────────────────────────────────────────┐
│                   PYTHON/TKINTER STACK                       │
├─────────────────────────────────────────────────────────────┤
│  TriviaCaptureAI.py (Single File, 1706 lines)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TriviaVisionAI Class (Main App)                       │  │
│  │  • Tkinter GUI (tk.Tk)                                │  │
│  │  • Config Management (JSON)                           │  │
│  │  • Event Loop (root.mainloop)                         │  │
│  │  • Screenshot Orchestration                           │  │
│  │  • Live Preview (root.after)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ RegionSelector Class                                  │  │
│  │  • Fullscreen Overlay (tk.Toplevel)                   │  │
│  │  • Canvas Drawing (tk.Canvas)                         │  │
│  │  • Mouse Events (bind)                                │  │
│  │  • HiDPI Scaling                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SettingsDialog Class                                  │  │
│  │  • Modal Dialog (tk.Toplevel)                         │  │
│  │  • Notebook Tabs (ttk.Notebook)                       │  │
│  │  • API Testing                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Dependencies                                          │  │
│  │  • mss (screenshot)                                   │  │
│  │  • Pillow (image processing)                          │  │
│  │  • requests (HTTP)                                    │  │
│  │  • google-generativeai (Gemini)                       │  │
│  │  • concurrent.futures (threading)                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Electron)

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON STACK                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MAIN PROCESS (Node.js)                                 │ │
│  │                                                         │ │
│  │  main.js                                               │ │
│  │  ├── BrowserWindow Management                          │ │
│  │  ├── IPC Handlers (ipcMain)                            │ │
│  │  ├── Screen Capture (desktopCapturer)                  │ │
│  │  └── File System Operations                            │ │
│  │                                                         │ │
│  │  services/                                             │ │
│  │  ├── ConfigService.js (electron-store)                 │ │
│  │  ├── ScreenCaptureService.js                           │ │
│  │  ├── OpenAIService.js                                  │ │
│  │  └── GeminiService.js                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕ IPC                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RENDERER PROCESS (Chromium)                            │ │
│  │                                                         │ │
│  │  src/                                                  │ │
│  │  ├── index.html (Main Window)                          │ │
│  │  │   ├── Title Bar                                     │ │
│  │  │   ├── Preview Panel                                 │ │
│  │  │   ├── Response Displays                             │ │
│  │  │   └── Action Buttons                                │ │
│  │  │                                                      │ │
│  │  ├── selector.html (Region Selector)                   │ │
│  │  │   └── Canvas + Handles                              │ │
│  │  │                                                      │ │
│  │  ├── settings.html (Settings Modal)                    │ │
│  │  │   └── 3-Tab Interface                               │ │
│  │  │                                                      │ │
│  │  ├── styles.css (Global Styles)                        │ │
│  │  └── renderer.js (UI Logic)                            │ │
│  │                                                         │ │
│  │  components/                                           │ │
│  │  ├── PreviewPanel.js                                   │ │
│  │  ├── ResponseDisplay.js                                │ │
│  │  ├── RegionSelector.js                                 │ │
│  │  └── SettingsDialog.js                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PRELOAD SCRIPT (Security Bridge)                       │ │
│  │                                                         │ │
│  │  preload.js                                            │ │
│  │  └── Expose safe APIs via contextBridge                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NPM DEPENDENCIES                                        │ │
│  │  • electron                                            │ │
│  │  • sharp (image processing)                            │ │
│  │  • axios (HTTP client)                                 │ │
│  │  • @google/generative-ai                               │ │
│  │  • electron-store (config)                             │ │
│  │  • screenshot-desktop (optional)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Differences

| Aspect | Python/Tkinter | Electron |
|--------|----------------|----------|
| **Process Model** | Single process | Multi-process (main + renderer) |
| **UI Rendering** | Native widgets | Chromium (HTML/CSS) |
| **Styling** | Limited (tk themes) | Full CSS power |
| **Threading** | Python threads | Worker threads / async |
| **IPC** | N/A (single process) | IPC channels (main ↔ renderer) |
| **Config Storage** | JSON file | electron-store (encrypted) |
| **Distribution** | PyInstaller bundle | electron-builder (native) |
| **Auto-updates** | Manual | Built-in (electron-updater) |
| **File Size** | ~50-100 MB | ~150-200 MB |

---

## Code Migration Examples

### Example 1: Configuration Management

#### Python (Current)

```python
import json
import os

class TriviaVisionAI:
    def __init__(self):
        self.config_file = 'trivia_config.json'
        self.config = self.load_config()

    def load_config(self):
        """Load configuration from JSON file"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                return json.load(f)
        return {
            'api_keys': {'openai': '', 'gemini': ''},
            'models': {
                'openai_model': 'gpt-4o-mini',
                'gemini_model': 'gemini-2.0-flash-exp'
            },
            'prompt': 'This image contains a trivia question...',
            'region': None
        }

    def save_config(self):
        """Save configuration to JSON file"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
```

#### Electron (Target)

```javascript
// main.js (Main Process)
const Store = require('electron-store');

// Initialize with schema and defaults
const config = new Store({
  schema: {
    api_keys: {
      type: 'object',
      properties: {
        openai: { type: 'string', default: '' },
        gemini: { type: 'string', default: '' }
      }
    },
    models: {
      type: 'object',
      properties: {
        openai_model: { type: 'string', default: 'gpt-4o-mini' },
        gemini_model: { type: 'string', default: 'gemini-2.0-flash-exp' }
      }
    },
    prompt: {
      type: 'string',
      default: 'This image contains a trivia question...'
    },
    region: {
      type: ['object', 'null'],
      default: null
    }
  },
  encryptionKey: 'optional-encryption-key' // Encrypt sensitive data
});

// IPC handlers for renderer access
const { ipcMain } = require('electron');

ipcMain.handle('config:get', (event, key) => {
  return config.get(key);
});

ipcMain.handle('config:set', (event, key, value) => {
  config.set(key, value);
  return true;
});

ipcMain.handle('config:getAll', () => {
  return config.store;
});
```

```javascript
// preload.js (Security Bridge)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),
  getAllConfig: () => ipcRenderer.invoke('config:getAll')
});
```

```javascript
// renderer.js (Renderer Process)
async function loadSettings() {
  const config = await window.electronAPI.getAllConfig();

  document.getElementById('openai-key').value = config.api_keys.openai;
  document.getElementById('gemini-key').value = config.api_keys.gemini;
  // ... populate other fields
}

async function saveSettings() {
  await window.electronAPI.setConfig('api_keys.openai',
    document.getElementById('openai-key').value);
  await window.electronAPI.setConfig('api_keys.gemini',
    document.getElementById('gemini-key').value);
  // ... save other fields
}
```

**Benefits of Electron approach:**
- ✅ Type safety with schema validation
- ✅ Optional encryption for API keys
- ✅ Atomic writes (no corruption)
- ✅ Watch for changes
- ✅ Migration support for schema updates

---

### Example 2: Screen Capture

#### Python (Current)

```python
from mss import mss
from PIL import Image, ImageGrab
import time

def capture_region(self):
    """Capture screenshot of selected region"""
    region = self.config.get('region')
    if not region:
        return None

    try:
        # Primary method: mss (fast, macOS compatible)
        with mss() as sct:
            monitor = {
                'top': region['top'],
                'left': region['left'],
                'width': region['width'],
                'height': region['height']
            }
            screenshot = sct.grab(monitor)
            img = Image.frombytes('RGB', screenshot.size, screenshot.rgb)

    except Exception as e:
        # Fallback: PIL ImageGrab
        bbox = (
            region['left'],
            region['top'],
            region['left'] + region['width'],
            region['top'] + region['height']
        )
        img = ImageGrab.grab(bbox=bbox)

    # Save with timestamp
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    filename = f'captured_images/trivia_screenshot_{timestamp}.png'
    img.save(filename, 'PNG')

    return img
```

#### Electron (Target)

```javascript
// services/ScreenCaptureService.js (Main Process)
const { desktopCapturer, screen } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ScreenCaptureService {
  constructor() {
    this.outputDir = 'captured_images';
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create output directory:', err);
    }
  }

  async captureRegion(region) {
    if (!region) {
      throw new Error('No region selected');
    }

    // Get scale factor for HiDPI displays
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor;

    // Get desktop sources (screenshot)
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: primaryDisplay.size.width * scaleFactor,
        height: primaryDisplay.size.height * scaleFactor
      }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // Convert Electron NativeImage to Buffer
    const screenshot = sources[0].thumbnail;
    const imageBuffer = screenshot.toPNG();

    // Crop to exact region using Sharp
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(region.left * scaleFactor),
        top: Math.round(region.top * scaleFactor),
        width: Math.round(region.width * scaleFactor),
        height: Math.round(region.height * scaleFactor)
      })
      .png({ quality: 100 })
      .toBuffer();

    // Save with timestamp
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const filename = `trivia_screenshot_${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);

    await fs.writeFile(filepath, croppedBuffer);

    return {
      buffer: croppedBuffer,
      filepath: filepath,
      base64: croppedBuffer.toString('base64')
    };
  }

  async captureForPreview(region) {
    // Lighter version for preview (lower quality)
    const { buffer } = await this.captureRegion(region);

    // Resize for preview (max 400x200)
    const resized = await sharp(buffer)
      .resize(400, 200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 80 })
      .toBuffer();

    return resized.toString('base64');
  }
}

module.exports = new ScreenCaptureService();
```

```javascript
// main.js - IPC Handlers
const screenCapture = require('./services/ScreenCaptureService');

ipcMain.handle('screen:capture', async (event, region) => {
  try {
    return await screenCapture.captureRegion(region);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('screen:preview', async (event, region) => {
  try {
    return await screenCapture.captureForPreview(region);
  } catch (error) {
    throw error;
  }
});
```

**Benefits:**
- ✅ Native Electron API (no external dependencies)
- ✅ Sharp for fast image processing
- ✅ Async/await pattern (cleaner code)
- ✅ Automatic HiDPI handling
- ✅ Preview optimization

---

### Example 3: Parallel API Calls

#### Python (Current)

```python
from concurrent.futures import ThreadPoolExecutor
import time

def analyze_screenshot_parallel(self, screenshot):
    """Call OpenAI and Gemini in parallel"""
    start_time = time.time()

    # Disable screenshot button
    self.screenshot_button.configure(state='disabled')

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {}

        # Submit OpenAI task
        if self.config['api_keys']['openai']:
            futures['openai'] = executor.submit(
                self.analyze_with_openai,
                screenshot
            )

        # Submit Gemini task
        if self.config['api_keys']['gemini']:
            futures['gemini'] = executor.submit(
                self.analyze_with_gemini,
                screenshot
            )

        # Collect results
        results = {}
        for model_name, future in futures.items():
            try:
                results[model_name] = future.result(timeout=30)
            except Exception as e:
                results[model_name] = f"Error: {str(e)}"

    # Update UI (must use root.after for thread safety)
    self.root.after(0, self.display_results, results)
    self.root.after(0, lambda: self.screenshot_button.configure(state='normal'))

def analyze_with_openai(self, screenshot):
    """Call OpenAI API"""
    # ... API call logic
    return response_text
```

#### Electron (Target)

```javascript
// services/AnalysisService.js (Main Process)
const openaiService = require('./OpenAIService');
const geminiService = require('./GeminiService');

class AnalysisService {
  async analyzeScreenshot(imageBuffer, config) {
    const promises = [];

    // Queue OpenAI if API key exists
    if (config.api_keys.openai) {
      promises.push(
        this.analyzeWithTimeout(
          'openai',
          () => openaiService.analyze(
            imageBuffer,
            config.api_keys.openai,
            config.models.openai_model,
            config.prompt
          )
        )
      );
    }

    // Queue Gemini if API key exists
    if (config.api_keys.gemini) {
      promises.push(
        this.analyzeWithTimeout(
          'gemini',
          () => geminiService.analyze(
            imageBuffer,
            config.api_keys.gemini,
            config.models.gemini_model,
            config.prompt
          )
        )
      );
    }

    // Execute in parallel
    const results = await Promise.allSettled(promises);

    // Format results
    return {
      openai: results.find(r => r.value?.service === 'openai')?.value || null,
      gemini: results.find(r => r.value?.service === 'gemini')?.value || null
    };
  }

  async analyzeWithTimeout(service, analyzeFunc, timeout = 30000) {
    return Promise.race([
      analyzeFunc().then(result => ({ service, ...result })),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }
}

module.exports = new AnalysisService();
```

```javascript
// main.js - IPC Handler
const analysisService = require('./services/AnalysisService');

ipcMain.handle('analyze:screenshot', async (event, imageBuffer) => {
  const config = require('./services/ConfigService').getAll();

  try {
    // Send "started" event
    event.sender.send('analysis:started');

    // Run analysis
    const results = await analysisService.analyzeScreenshot(
      Buffer.from(imageBuffer),
      config
    );

    // Send individual results as they come in
    if (results.openai) {
      event.sender.send('analysis:result', { service: 'openai', ...results.openai });
    }
    if (results.gemini) {
      event.sender.send('analysis:result', { service: 'gemini', ...results.gemini });
    }

    // Send completion event
    event.sender.send('analysis:complete');

    return results;
  } catch (error) {
    event.sender.send('analysis:error', error.message);
    throw error;
  }
});
```

```javascript
// renderer.js - UI Updates
const screenshotBtn = document.getElementById('screenshot-btn');
const openaiResponse = document.getElementById('openai-response');
const geminiResponse = document.getElementById('gemini-response');

async function takeScreenshot() {
  // Disable button
  screenshotBtn.disabled = true;
  screenshotBtn.textContent = '⏳ Analyzing...';

  try {
    // Get current region
    const region = await window.electronAPI.getConfig('region');

    // Capture screenshot
    const { buffer } = await window.electronAPI.captureScreen(region);

    // Start analysis
    await window.electronAPI.analyzeScreenshot(buffer);

  } catch (error) {
    console.error('Screenshot failed:', error);
    alert(`Error: ${error.message}`);
    screenshotBtn.disabled = false;
    screenshotBtn.textContent = '📸 Screenshot & Analyze';
  }
}

// Listen for results
window.electronAPI.onAnalysisResult((result) => {
  if (result.service === 'openai') {
    openaiResponse.textContent = result.error
      ? `❌ Error: ${result.error}`
      : `⏱️ ${result.duration}s\n\n${result.answer}`;
  } else if (result.service === 'gemini') {
    geminiResponse.textContent = result.error
      ? `❌ Error: ${result.error}`
      : `⏱️ ${result.duration}s\n\n${result.answer}`;
  }
});

window.electronAPI.onAnalysisComplete(() => {
  screenshotBtn.disabled = false;
  screenshotBtn.textContent = '📸 Screenshot & Analyze';
});
```

**Benefits:**
- ✅ Promise-based (modern async pattern)
- ✅ Better error handling (Promise.allSettled)
- ✅ Timeout per API
- ✅ Event-driven UI updates
- ✅ Cleaner separation of concerns

---

## Technical Stack

### Production Dependencies

```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "electron-store": "^8.1.0",
    "axios": "^1.6.0",
    "@google/generative-ai": "^0.1.0",
    "sharp": "^0.33.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "electron-builder": "^24.9.0",
    "electron-reload": "^2.0.0",
    "concurrently": "^8.2.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0"
  }
}
```

### Build Configuration

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "concurrently \"webpack --watch\" \"electron-reload .\"",
    "build": "webpack --mode production",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux"
  }
}
```

---

## Risk Assessment

### High-Risk Areas

#### 1. **Screen Capture on macOS** 🔴

**Risk:** Retina display scaling and permissions
**Impact:** App unusable on macOS (60% of target users)
**Mitigation:**
- Test on actual macOS hardware (not VM)
- Implement permission detection early
- Use Electron's `screen.getPrimaryDisplay().scaleFactor`
- Thorough testing on 1x and 2x displays

**Validation:**
```javascript
// Test on Retina display
const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
console.log('Scale factor:', scaleFactor); // Should be 2.0 on Retina

// Capture test region
const testRegion = { left: 0, top: 0, width: 100, height: 100 };
const captured = await captureRegion(testRegion);
console.log('Captured size:', captured.width, captured.height);
// Should be 200x200 on Retina (2x scaling)
```

#### 2. **Region Selector Performance** 🟡

**Risk:** Canvas lag on large displays (4K+)
**Impact:** Poor UX during region selection
**Mitigation:**
- Use `requestAnimationFrame` for smooth rendering
- Debounce mouse events (throttle to 60fps)
- Optimize canvas clearing/redrawing
- Test on 4K and 5K displays

**Performance targets:**
- Region draw: < 16ms (60fps)
- Handle rendering: < 5ms
- Full redraw: < 10ms

#### 3. **API Integration Compatibility** 🟡

**Risk:** OpenAI/Gemini API changes
**Impact:** Features break without warning
**Mitigation:**
- Version-lock API clients
- Implement error handling for all API calls
- Add API version detection
- Create fallback mechanisms

#### 4. **Memory Leaks** 🟡

**Risk:** Preview loop and event listeners causing memory growth
**Impact:** App slows down over time
**Mitigation:**
- Clear intervals when not needed
- Remove event listeners on window close
- Use weak references where appropriate
- Regular garbage collection monitoring

**Testing:**
```javascript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory:', {
    rss: (usage.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
  });
}, 60000); // Every minute
```

### Medium-Risk Areas

#### 5. **File Size** 🟠

**Risk:** Electron bundle larger than Python app
**Impact:** Slow downloads, storage concerns
**Mitigation:**
- Use electron-builder compression
- Tree-shake unused code
- Optimize image assets
- Consider ASAR archive

**Expected sizes:**
- macOS DMG: ~150 MB (vs Python ~80 MB)
- Windows installer: ~170 MB (vs Python ~100 MB)
- Linux AppImage: ~160 MB (vs Python ~90 MB)

#### 6. **Cross-Platform Differences** 🟠

**Risk:** Features work differently on Windows/macOS/Linux
**Impact:** Inconsistent UX
**Mitigation:**
- Test on all platforms early
- Use platform detection for edge cases
- Implement platform-specific code paths
- Comprehensive CI/CD testing

---

## Success Criteria

### Functional Requirements

**Must-Have (P0):**
- ✅ Region selection works on all platforms
- ✅ Screenshot capture matches Python quality
- ✅ OpenAI API integration functional
- ✅ Gemini API integration functional
- ✅ Parallel processing (both APIs simultaneously)
- ✅ Live preview updates every 1 second
- ✅ Config persists across restarts
- ✅ Settings dialog with 3 tabs
- ✅ HiDPI/Retina display support

**Should-Have (P1):**
- ✅ Identical UI to Python version
- ✅ Same color scheme
- ✅ Keyboard shortcuts (ESC, Enter)
- ✅ API connection testing
- ✅ Multi-monitor support
- ✅ macOS permission detection
- ✅ Screenshot timestamping

**Nice-to-Have (P2):**
- 🔲 Auto-updates (electron-updater)
- 🔲 Keyboard shortcuts (global hotkeys)
- 🔲 Tray icon (minimize to tray)
- 🔲 Dark/light theme toggle
- 🔲 Export history

### Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| App startup time | < 2s | < 5s |
| Window open time | < 300ms | < 1s |
| Screenshot capture | < 200ms | < 500ms |
| Preview refresh | < 100ms | < 300ms |
| Region selector open | < 500ms | < 1s |
| API response display | < 50ms | < 200ms |
| Memory usage (idle) | < 150 MB | < 300 MB |
| Memory usage (active) | < 250 MB | < 500 MB |

### Quality Requirements

**Testing:**
- [ ] Unit tests for services (>80% coverage)
- [ ] Integration tests for IPC
- [ ] E2E tests for critical flows
- [ ] Manual testing on all platforms
- [ ] Retina display testing (macOS)
- [ ] Multi-monitor testing

**Documentation:**
- [ ] Migration guide for users
- [ ] Developer setup guide
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Troubleshooting guide

**User Experience:**
- [ ] No regressions from Python version
- [ ] Faster perceived performance
- [ ] Modern, polished UI
- [ ] Smooth animations
- [ ] Helpful error messages

---

## Rollback Plan

### Contingency Strategy

**If migration fails or is delayed:**

1. **Keep Python version maintained** (master branch)
2. **Electron in separate branch** (electron-migration)
3. **Feature parity checklist** before switching
4. **Beta testing period** (2-4 weeks)
5. **Phased rollout** (10% → 50% → 100%)

### Decision Points

**Day 6 Checkpoint:**
- ✅ Region selector working perfectly → Proceed
- ❌ Major issues remaining → Extend timeline or pivot

**Day 10 Checkpoint:**
- ✅ All APIs working → Proceed to polish
- ❌ Integration issues → Consider hybrid approach

**Day 12 Checkpoint:**
- ✅ All success criteria met → Release
- ❌ Critical bugs remain → Delay release, extend testing

---

## Conclusion

This migration from Python/Tkinter to Electron represents a strategic modernization of TriviaVisionAI. The 12-day timeline is aggressive but achievable with focused development. The phased approach minimizes risk while the parallel development strategy ensures zero downtime for existing users.

**Key Success Factors:**
1. ✅ Well-understood codebase (clean architecture)
2. ✅ Proven technology stack (Electron mature)
3. ✅ Clear requirements (feature parity)
4. ✅ Manageable scope (1,700 LOC)
5. ✅ Safety net (keep Python version)

**Estimated Total Effort:** 96 hours (12 days × 8 hours)
**Risk Level:** Medium
**Recommended Start Date:** When approved
**Target Completion:** 12 working days from start

---

**Document Version:** 2.0
**Last Updated:** 2025-11-08
**Author:** TriviaVisionAI Development Team
**Status:** Ready for Implementation
