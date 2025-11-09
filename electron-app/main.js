/**
 * TriviaVisionAI - Electron Main Process
 *
 * This is the main process that manages:
 * - Application lifecycle
 * - Window management
 * - IPC communication
 * - Screen capture
 * - File system operations
 */

const { app, BrowserWindow, screen, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Keep references to prevent garbage collection
let mainWindow = null;
let selectorWindow = null;

/**
 * Create the main application window
 */
function createMainWindow() {
  const startTime = Date.now();

  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    x: 0,  // Left edge of screen (like Python version)
    y: 100,
    resizable: false,
    backgroundColor: '#2c3e50',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'TriviaVisionAI'
  });

  mainWindow.loadFile('src/index.html');

  // Open DevTools in development
  if (process.argv.includes('--enable-logging')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const loadTime = Date.now() - startTime;
  console.log(`[Main] Window created in ${loadTime}ms`);

  // Log display information
  logDisplayInfo();
}

/**
 * Create the region selector overlay window
 * CRITICAL: This must NOT create a new desktop space on macOS
 */
function createSelectorWindow() {
  console.log('[Selector] Creating fullscreen overlay...');
  console.log('[Selector] CRITICAL TEST: Does this create new desktop space on macOS?');

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // APPROACH 1: Use 'panel' type for overlay that floats on all spaces
  // This is the recommended approach for overlays on macOS
  selectorWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    // CRITICAL: Use 'panel' type to avoid desktop space creation
    type: 'panel',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the selector UI
  selectorWindow.loadFile('src/selector.html');

  // Make it visible on all workspaces (critical for macOS)
  selectorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Set to highest z-order level
  selectorWindow.setAlwaysOnTop(true, 'screen-saver');

  selectorWindow.on('closed', () => {
    selectorWindow = null;
    console.log('[Selector] Window closed');
  });

  console.log('[Selector] Window created with type: panel');
  console.log('[Selector] visibleOnAllWorkspaces: true');
  console.log('[Selector] alwaysOnTop level: screen-saver');
}

/**
 * Close the selector window
 */
function closeSelectorWindow() {
  if (selectorWindow) {
    selectorWindow.close();
    selectorWindow = null;
  }
}

/**
 * Log display information for debugging
 */
function logDisplayInfo() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const allDisplays = screen.getAllDisplays();

  console.log('[Display] Primary Display Info:');
  console.log(`  - Size: ${primaryDisplay.size.width}x${primaryDisplay.size.height}`);
  console.log(`  - Work Area: ${primaryDisplay.workAreaSize.width}x${primaryDisplay.workAreaSize.height}`);
  console.log(`  - Scale Factor: ${primaryDisplay.scaleFactor}x`);
  console.log(`  - Retina Display: ${primaryDisplay.scaleFactor === 2 ? 'YES' : 'NO'}`);
  console.log(`[Display] Total Displays: ${allDisplays.length}`);
}

/**
 * Capture screenshot of a specific region
 */
async function captureRegion(region) {
  console.log('[Capture] Starting screen capture...');
  console.log(`[Capture] Region: ${region.left},${region.top} ${region.width}x${region.height}`);

  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor;

    console.log(`[Capture] Scale factor: ${scaleFactor}x`);

    // Get desktop sources
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: primaryDisplay.size.width * scaleFactor,
        height: primaryDisplay.size.height * scaleFactor
      }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources available. Check Screen Recording permissions.');
    }

    console.log(`[Capture] Found ${sources.length} screen source(s)`);

    // Get the screenshot as a NativeImage
    const screenshot = sources[0].thumbnail;
    const size = screenshot.getSize();

    console.log(`[Capture] Captured size: ${size.width}x${size.height}`);

    // Convert to PNG buffer
    const imageBuffer = screenshot.toPNG();

    // For now, return the full screenshot
    // TODO: Crop to exact region using Sharp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `trivia_screenshot_${timestamp}.png`;
    const filepath = path.join(__dirname, '..', 'captured_images', filename);

    // Ensure directory exists
    await fs.mkdir(path.join(__dirname, '..', 'captured_images'), { recursive: true });

    // Save screenshot
    await fs.writeFile(filepath, imageBuffer);

    console.log(`[Capture] Saved to: ${filepath}`);

    return {
      success: true,
      filepath: filepath,
      size: size,
      scaleFactor: scaleFactor
    };
  } catch (error) {
    console.error('[Capture] Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * IPC Handlers
 */

// Open region selector
ipcMain.handle('open-selector', () => {
  console.log('[IPC] open-selector called');
  createSelectorWindow();
});

// Close region selector
ipcMain.handle('close-selector', () => {
  console.log('[IPC] close-selector called');
  closeSelectorWindow();
});

// Test screen capture
ipcMain.handle('test-capture', async () => {
  console.log('[IPC] test-capture called');

  // Capture full screen as test
  const primaryDisplay = screen.getPrimaryDisplay();
  const testRegion = {
    left: 0,
    top: 0,
    width: primaryDisplay.size.width,
    height: primaryDisplay.size.height
  };

  return await captureRegion(testRegion);
});

// Get display info
ipcMain.handle('get-display-info', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    size: primaryDisplay.size,
    workAreaSize: primaryDisplay.workAreaSize,
    scaleFactor: primaryDisplay.scaleFactor,
    isRetina: primaryDisplay.scaleFactor === 2
  };
});

/**
 * App Lifecycle
 */

app.whenReady().then(() => {
  console.log('='.repeat(60));
  console.log('TriviaVisionAI - Electron Version');
  console.log('='.repeat(60));
  console.log(`[App] Electron Version: ${process.versions.electron}`);
  console.log(`[App] Chrome Version: ${process.versions.chrome}`);
  console.log(`[App] Node Version: ${process.versions.node}`);
  console.log(`[App] Platform: ${process.platform}`);
  console.log('='.repeat(60));

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Graceful shutdown
app.on('before-quit', () => {
  console.log('[App] Shutting down...');
  closeSelectorWindow();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Error] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Error] Unhandled Rejection at:', promise, 'reason:', reason);
});
