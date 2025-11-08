# Electron POC Validation Test

## 🎯 Purpose

**CRITICAL**: This POC must be completed BEFORE committing to full Electron migration.

**Time Required**: 4-8 hours
**Cost**: $200-400 (developer time)
**Risk Mitigation**: Prevents wasting $7,200 on failed migration

---

## 📋 Test Requirements

### Must Validate:
1. ✅ Transparent fullscreen overlay does NOT create new desktop space on macOS
2. ✅ Screen capture works correctly on Retina displays
3. ✅ Window positioning works (left-aligned, 500x750px)
4. ✅ Basic IPC communication between main and renderer
5. ✅ Performance acceptable (startup < 3s, memory < 200MB)

---

## 🚀 Quick Start

### Step 1: Create POC Project

```bash
# Create test directory
mkdir electron-poc-test
cd electron-poc-test

# Initialize npm project
npm init -y

# Install Electron
npm install electron --save-dev

# Create project structure
mkdir src
touch main.js
touch src/index.html
touch src/selector.html
```

### Step 2: Create Main Process (main.js)

```javascript
const { app, BrowserWindow, screen, desktopCapturer, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let selectorWindow = null;

// Test 1: Basic window creation
function createMainWindow() {
  const startTime = Date.now();

  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    x: 0,  // Left edge of screen
    y: 100,
    resizable: false,
    backgroundColor: '#2c3e50',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.webContents.openDevTools();

  const loadTime = Date.now() - startTime;
  console.log(`✅ Test 1: Window created in ${loadTime}ms (Target: <3000ms)`);
}

// Test 2: Transparent fullscreen overlay (CRITICAL FOR macOS)
function createSelectorWindow() {
  console.log('🧪 Test 2: Creating fullscreen overlay...');
  console.log('⚠️  MANUAL CHECK: Does this create a new desktop space on macOS?');
  console.log('   Expected: NO (should stay on current desktop)');
  console.log('   If YES: Electron migration FAILS core requirement');

  selectorWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  selectorWindow.loadFile('src/selector.html');

  // Close on Escape key
  selectorWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      selectorWindow.close();
      selectorWindow = null;
      console.log('✅ Test 2: Overlay closed with Escape key');
    }
  });
}

// Test 3: Retina display detection
function testRetinaDisplay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const scaleFactor = primaryDisplay.scaleFactor;
  const { width, height } = primaryDisplay.size;

  console.log('\n🧪 Test 3: Display Information');
  console.log(`   Resolution: ${width}x${height}`);
  console.log(`   Scale Factor: ${scaleFactor}x`);
  console.log(`   Retina Display: ${scaleFactor === 2 ? 'YES' : 'NO'}`);

  if (scaleFactor === 2) {
    console.log('   ✅ Retina detected - screenshots will need scaling');
  } else {
    console.log('   ℹ️  Standard display - no scaling needed');
  }
}

// Test 4: Screen capture
async function testScreenCapture() {
  console.log('\n🧪 Test 4: Screen Capture Test');

  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor;
    const { width, height } = primaryDisplay.size;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: width * scaleFactor,
        height: height * scaleFactor
      }
    });

    if (sources.length === 0) {
      console.log('   ❌ FAILED: No screen sources available');
      console.log('   → Check macOS Screen Recording permissions');
      return false;
    }

    const thumbnail = sources[0].thumbnail;
    const size = thumbnail.getSize();

    console.log(`   ✅ Captured: ${size.width}x${size.height}`);
    console.log(`   Expected (Retina): ${width * scaleFactor}x${height * scaleFactor}`);

    if (scaleFactor === 2 && size.width !== width * scaleFactor) {
      console.log('   ⚠️  WARNING: Captured size doesn\'t match expected Retina size');
      return false;
    }

    console.log('   ✅ Screen capture working correctly');
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return false;
  }
}

// Test 5: Memory monitoring
function monitorMemory() {
  console.log('\n🧪 Test 5: Memory Monitoring (Running for 60 seconds)');

  let count = 0;
  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    count++;
    console.log(`   [${count * 10}s] Heap: ${heapMB} MB, RSS: ${rssMB} MB`);

    if (heapMB > 200) {
      console.log('   ⚠️  WARNING: Memory usage above 200 MB threshold');
    }

    if (count >= 6) {
      clearInterval(interval);
      console.log('   ✅ Memory test complete');
    }
  }, 10000);
}

// IPC handlers
ipcMain.handle('open-selector', () => {
  createSelectorWindow();
});

ipcMain.handle('test-capture', async () => {
  return await testScreenCapture();
});

// App lifecycle
app.whenReady().then(async () => {
  console.log('='.repeat(60));
  console.log('Electron POC Validation Test');
  console.log('='.repeat(60));

  testRetinaDisplay();
  createMainWindow();
  monitorMemory();

  // Run screen capture test after 2 seconds
  setTimeout(async () => {
    await testScreenCapture();
  }, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
```

### Step 3: Create Preload Script (preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openSelector: () => ipcRenderer.invoke('open-selector'),
  testCapture: () => ipcRenderer.invoke('test-capture')
});
```

### Step 4: Create Main Window HTML (src/index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Electron POC Test</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #2c3e50;
      color: #ecf0f1;
      font-family: Arial, sans-serif;
    }

    h1 {
      margin-top: 0;
      color: #1abc9c;
    }

    .test-section {
      background-color: #34495e;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }

    button {
      background-color: #1abc9c;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
    }

    button:hover {
      background-color: #16a085;
    }

    .result {
      margin-top: 10px;
      padding: 10px;
      background-color: #1e2a38;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>🧪 Electron POC Validation</h1>

  <div class="test-section">
    <h3>Test 1: Window Positioning ✅</h3>
    <p>Is this window at the left edge of your screen?</p>
    <p>Size: 500x750px</p>
  </div>

  <div class="test-section">
    <h3>Test 2: Fullscreen Overlay (CRITICAL for macOS)</h3>
    <button onclick="testOverlay()">Open Fullscreen Overlay</button>
    <p><strong>Manual Check:</strong> Does it create a new desktop space?</p>
    <p>Expected: NO (should stay on current desktop)</p>
    <p>Press ESC to close overlay</p>
    <div class="result" id="overlay-result">Not tested yet</div>
  </div>

  <div class="test-section">
    <h3>Test 3: Screen Capture</h3>
    <button onclick="testCapture()">Test Screen Capture</button>
    <div class="result" id="capture-result">Not tested yet</div>
  </div>

  <div class="test-section">
    <h3>Test 4: Performance</h3>
    <p>Check console for:</p>
    <ul>
      <li>Startup time (should be &lt; 3 seconds)</li>
      <li>Memory usage (should be &lt; 200 MB)</li>
    </ul>
  </div>

  <div class="test-section">
    <h3>🎯 Pass/Fail Criteria</h3>
    <ul>
      <li>✅ Window positioned at left edge</li>
      <li>⏳ Overlay does NOT create desktop space (macOS)</li>
      <li>⏳ Screen capture works on Retina displays</li>
      <li>⏳ Startup time &lt; 3 seconds</li>
      <li>⏳ Memory usage &lt; 200 MB</li>
    </ul>
  </div>

  <script>
    async function testOverlay() {
      await window.electronAPI.openSelector();
      document.getElementById('overlay-result').textContent =
        'Overlay opened - Did it create a new desktop space? (Check manually)';
    }

    async function testCapture() {
      const result = document.getElementById('capture-result');
      result.textContent = 'Testing...';

      try {
        const success = await window.electronAPI.testCapture();
        result.textContent = success
          ? '✅ Screen capture working!'
          : '❌ Screen capture failed - check console for details';
      } catch (error) {
        result.textContent = `❌ Error: ${error.message}`;
      }
    }

    // Log startup time
    console.log('Renderer process loaded');
  </script>
</body>
</html>
```

### Step 5: Create Selector HTML (src/selector.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Selector Overlay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: rgba(0, 0, 0, 0.3);
      overflow: hidden;
      cursor: crosshair;
    }

    #instructions {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 20px;
    }

    h1 {
      color: #1abc9c;
      margin-top: 0;
    }

    .warning {
      color: #e74c3c;
      font-weight: bold;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div id="instructions">
    <h1>🧪 Fullscreen Overlay Test</h1>
    <p>This is a transparent fullscreen overlay.</p>
    <p><strong>Critical macOS Test:</strong></p>
    <p>Did this create a new desktop space?</p>
    <p class="warning">Press ESC to close</p>
  </div>
</body>
</html>
```

### Step 6: Update package.json

```json
{
  "name": "electron-poc-test",
  "version": "1.0.0",
  "description": "POC to validate Electron migration feasibility",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "echo 'Run npm start and follow manual tests'"
  },
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

---

## 🧪 Running the Tests

### Execute POC:

```bash
# Install dependencies
npm install

# Run Electron app
npm start
```

### Manual Testing Checklist:

#### Test 1: Window Positioning ✅
- [ ] Window appears at left edge of screen
- [ ] Window is 500x750 pixels
- [ ] Window is not resizable

#### Test 2: Fullscreen Overlay (CRITICAL) ⚠️
- [ ] Click "Open Fullscreen Overlay" button
- [ ] **CHECK**: Did macOS create a new desktop space?
  - ✅ NO = Electron solves the problem! Proceed with migration.
  - ❌ YES = Electron FAILS core requirement. Abort migration.
- [ ] Press ESC to close overlay
- [ ] Overlay closes properly

#### Test 3: Screen Capture
- [ ] Click "Test Screen Capture" button
- [ ] Check console output
- [ ] On Retina Mac: Verify captured size is 2x logical size
- [ ] On standard display: Verify size matches screen size

#### Test 4: Performance
- [ ] Check console for startup time (< 3s)
- [ ] Monitor memory usage for 60 seconds
- [ ] Memory should stay under 200 MB
- [ ] No crashes or freezes

#### Test 5: Dev Tools
- [ ] Open Developer Tools (F12)
- [ ] Check for any console errors
- [ ] Verify IPC communication working

---

## 📊 Results Template

### Fill this out after testing:

```
Electron POC Validation Results
Date: __________
Tester: __________
Platform: macOS _____ / Windows _____ / Linux _____

Test 1: Window Positioning
[ ] PASS   [ ] FAIL
Notes: ____________________________________________

Test 2: Fullscreen Overlay (CRITICAL)
[ ] PASS (No desktop space created)
[ ] FAIL (Desktop space created)
Notes: ____________________________________________

Test 3: Screen Capture
[ ] PASS   [ ] FAIL
Retina Scale Factor: _____
Captured Size: _____x_____
Expected Size: _____x_____
Notes: ____________________________________________

Test 4: Performance
Startup Time: _____ ms (Target: < 3000ms)
Memory Usage: _____ MB (Target: < 200 MB)
[ ] PASS   [ ] FAIL
Notes: ____________________________________________

Test 5: Stability
Ran for: _____ minutes
Crashes: _____
[ ] PASS   [ ] FAIL

OVERALL RESULT:
[ ] PASS - Proceed with full Electron migration
[ ] CONDITIONAL - Some issues, needs evaluation
[ ] FAIL - Abort Electron, try alternative (PyQt)

Critical Issues Found:
1. ____________________________________________
2. ____________________________________________
3. ____________________________________________
```

---

## 🎯 Decision Criteria

### GO (Proceed with Electron Migration):
- ✅ Fullscreen overlay does NOT create desktop space on macOS
- ✅ Screen capture works correctly on Retina displays
- ✅ Performance acceptable (startup < 3s, memory < 200MB)
- ✅ No critical bugs or crashes

**Action**: Begin 18-day Electron migration plan

### NO-GO (Abort Electron Migration):
- ❌ Fullscreen overlay creates desktop space on macOS
- ❌ Screen capture fails on Retina displays
- ❌ Performance unacceptable (startup > 5s, memory > 300MB)
- ❌ Critical bugs or frequent crashes

**Action**: Evaluate alternatives (PyQt, Tauri, or Tkinter fixes)

### CONDITIONAL (Needs Further Investigation):
- ⚠️ Some tests pass, others have minor issues
- ⚠️ Workarounds might be possible

**Action**: Spend additional 1-2 days investigating workarounds

---

## 🚨 Common Issues & Solutions

### Issue 1: "Electron not found"
```bash
# Solution:
npm install
# Or globally:
npm install -g electron
```

### Issue 2: macOS Security Warning
```
"electron" cannot be opened because it is from an unidentified developer
```

**Solution**:
```bash
# Allow the app in System Preferences > Security & Privacy
# Or use:
xattr -cr node_modules/electron/dist/Electron.app
```

### Issue 3: Screen Recording Permission
```
Screen capture returns empty/black image
```

**Solution**:
1. System Preferences > Security & Privacy > Privacy
2. Select "Screen Recording"
3. Add Terminal (or your IDE)
4. Restart the app

### Issue 4: Transparent Window Not Working
```
Window is black instead of transparent
```

**Solution**:
```javascript
// Ensure both transparent:true and backgroundColor with alpha
{
  transparent: true,
  backgroundColor: '#00000000'  // Must have alpha channel
}
```

---

## 📝 Next Steps Based on Results

### If POC PASSES:
1. ✅ Document POC results
2. ✅ Get stakeholder approval for full migration
3. ✅ Purchase Apple Developer account ($99)
4. ✅ Begin Day 1 of migration plan
5. ✅ Set up beta testing program

### If POC FAILS:
1. ❌ Document failure reasons
2. 🔄 Evaluate alternative solutions:
   - **Option A**: Try PyQt/PySide (8-12 days, $3,500)
   - **Option B**: Quick Tkinter fixes (3 days, $900)
   - **Option C**: Research Tauri (might be worth trying)
3. 📊 Create new migration plan for chosen alternative
4. 🎯 Run POC for alternative solution

---

**POC Status**: Ready to Execute
**Time Required**: 4-8 hours
**Critical Success Factor**: macOS fullscreen overlay behavior
