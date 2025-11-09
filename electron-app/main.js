/**
 * TriviaVisionAI - Electron Main Process
 *
 * Complete migration from Python/Tkinter
 * Manages application lifecycle, windows, IPC, screen capture, and AI integration
 */

const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

// Utility modules
const { configManager, OPENAI_MODELS, GEMINI_MODELS } = require('./utils/config');
const { screenCapture } = require('./utils/capture');
const { analyzeParallel, testOpenAIConnection, testGeminiConnection } = require('./utils/ai');
const logger = require('./utils/logger');
const { MAIN_WINDOW, PREVIEW } = require('./utils/constants');

// Keep references to prevent garbage collection
let mainWindow = null;
let selectorWindow = null;
let settingsWindow = null;
let previewTimer = null;

/**
 * Log application startup
 */
function logStartup() {
  const packageJson = require('./package.json');
  logger.startup('TriviaVisionAI', packageJson.version);
  logger.info(`Config file: ${configManager.getPath()}`);
  logger.info(`Log file: ${logger.getLogPath()}`);
}

/**
 * Create the main application window
 */
function createMainWindow() {
  logger.info('Creating main window...');

  // Get saved window position or use defaults
  const prefs = configManager.getPreferences();
  const savedPosition = prefs.windowPosition;

  const windowConfig = {
    width: savedPosition?.width || MAIN_WINDOW.WIDTH,
    height: savedPosition?.height || MAIN_WINDOW.HEIGHT,
    minWidth: MAIN_WINDOW.MIN_WIDTH,
    minHeight: MAIN_WINDOW.MIN_HEIGHT,
    x: savedPosition?.x !== undefined ? savedPosition.x : 20,  // Left edge
    y: savedPosition?.y !== undefined ? savedPosition.y : 100,
    backgroundColor: '#2c3e50',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'TriviaVisionAI',
    show: false  // Show after ready to prevent flicker
  };

  mainWindow = new BrowserWindow(windowConfig);

  mainWindow.loadFile('src/index.html');

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logger.info('Main window ready');
  });

  // Open DevTools in development
  if (process.argv.includes('--enable-logging')) {
    mainWindow.webContents.openDevTools();
  }

  // Save window position on move/resize
  mainWindow.on('moved', saveWindowPosition);
  mainWindow.on('resized', saveWindowPosition);

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPreview();
  });

  // Always on top if configured
  if (prefs.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true);
  }

  // Log display information
  logDisplayInfo();

  // Start preview if region is configured
  const region = configManager.getRegion();
  if (region && prefs.previewEnabled) {
    startPreview();
  }
}

/**
 * Save window position to config
 */
function saveWindowPosition() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const bounds = mainWindow.getBounds();
    configManager.updatePreferences({
      windowPosition: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      }
    });
  }
}

/**
 * Create the region selector overlay window
 */
function createSelectorWindow() {
  logger.info('Creating region selector overlay...');

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Use 'panel' type for overlay that doesn't create desktop space
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
    type: 'panel',  // CRITICAL for macOS
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  selectorWindow.loadFile('src/selector.html');

  // Make visible on all workspaces
  selectorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  selectorWindow.setAlwaysOnTop(true, 'screen-saver');

  selectorWindow.on('closed', () => {
    selectorWindow = null;
    logger.info('Selector window closed');
  });

  logger.info('Selector window created (type: panel)');
}

/**
 * Close the selector window
 */
function closeSelectorWindow() {
  if (selectorWindow && !selectorWindow.isDestroyed()) {
    selectorWindow.close();
    selectorWindow = null;
  }
}

/**
 * Create settings dialog window
 */
function createSettingsWindow() {
  logger.info('Creating settings window...');

  settingsWindow = new BrowserWindow({
    width: 700,
    height: 650,
    parent: mainWindow,
    modal: true,
    show: false,
    backgroundColor: '#2c3e50',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Settings'
  });

  settingsWindow.loadFile('src/settings.html');

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    logger.info('Settings window closed');
  });
}

/**
 * Log display information for debugging
 */
function logDisplayInfo() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const allDisplays = screen.getAllDisplays();

  logger.info('Display Information:');
  logger.info(`  Size: ${primaryDisplay.size.width}x${primaryDisplay.size.height}`);
  logger.info(`  Work Area: ${primaryDisplay.workAreaSize.width}x${primaryDisplay.workAreaSize.height}`);
  logger.info(`  Scale Factor: ${primaryDisplay.scaleFactor}x`);
  logger.info(`  Retina: ${primaryDisplay.scaleFactor > 1 ? 'YES' : 'NO'}`);
  logger.info(`  Total Displays: ${allDisplays.length}`);
}

/**
 * Start live preview
 */
function startPreview() {
  if (previewTimer) {
    logger.debug('Preview already running');
    return;
  }

  const region = configManager.getRegion();
  if (!region) {
    logger.warn('Cannot start preview: no region configured');
    return;
  }

  const prefs = configManager.getPreferences();
  const interval = prefs.previewInterval || PREVIEW.INTERVAL;

  logger.info(`Starting preview (${interval}ms interval)`);

  previewTimer = setInterval(async () => {
    try {
      // Capture region
      const imageBuffer = await screenCapture.captureRegion(region);

      // Resize for preview
      const previewBuffer = await screenCapture.resizeForPreview(
        imageBuffer,
        PREVIEW.MAX_WIDTH,
        PREVIEW.MAX_HEIGHT
      );

      // Send to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('preview-update', {
          image: previewBuffer.toString('base64'),
          region: region
        });
      }
    } catch (error) {
      logger.error('Preview error:', error);
      // Don't stop preview on error - might be temporary
    }
  }, interval);
}

/**
 * Stop live preview
 */
function stopPreview() {
  if (previewTimer) {
    clearInterval(previewTimer);
    previewTimer = null;
    logger.info('Preview stopped');
  }
}

/**
 * IPC Handlers
 */

// ===== Window Management =====

ipcMain.handle('open-selector', () => {
  logger.info('[IPC] open-selector');
  createSelectorWindow();
  return { success: true };
});

ipcMain.handle('close-selector', () => {
  logger.info('[IPC] close-selector');
  closeSelectorWindow();
  return { success: true };
});

ipcMain.handle('open-settings', () => {
  logger.info('[IPC] open-settings');
  if (!settingsWindow) {
    createSettingsWindow();
  } else {
    settingsWindow.focus();
  }
  return { success: true };
});

ipcMain.handle('close-settings', () => {
  logger.info('[IPC] close-settings');
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
  return { success: true };
});

// ===== Configuration Management =====

ipcMain.handle('get-config', () => {
  logger.debug('[IPC] get-config');
  return {
    success: true,
    config: configManager.getAll()
  };
});

ipcMain.handle('set-config', (event, updates) => {
  logger.info('[IPC] set-config', Object.keys(updates));
  const success = configManager.update(updates);
  return { success };
});

ipcMain.handle('get-api-keys', () => {
  logger.debug('[IPC] get-api-keys');
  return {
    success: true,
    api_keys: configManager.getApiKeys()
  };
});

ipcMain.handle('set-api-keys', (event, keys) => {
  logger.info('[IPC] set-api-keys');
  const success = configManager.setApiKeys(keys);
  return { success };
});

ipcMain.handle('get-models', () => {
  logger.debug('[IPC] get-models');
  return {
    success: true,
    models: configManager.getModels(),
    available: {
      openai: OPENAI_MODELS,
      gemini: GEMINI_MODELS
    }
  };
});

ipcMain.handle('set-models', (event, models) => {
  logger.info('[IPC] set-models', models);
  const success = configManager.setModels(models);
  return { success };
});

ipcMain.handle('get-prompt', () => {
  logger.debug('[IPC] get-prompt');
  return {
    success: true,
    prompt: configManager.getPrompt()
  };
});

ipcMain.handle('set-prompt', (event, prompt) => {
  logger.info('[IPC] set-prompt');
  const success = configManager.setPrompt(prompt);
  return { success };
});

ipcMain.handle('get-region', () => {
  logger.debug('[IPC] get-region');
  return {
    success: true,
    region: configManager.getRegion()
  };
});

ipcMain.handle('set-region', (event, region) => {
  logger.regionSelected(region);
  const success = configManager.setRegion(region);

  // Restart preview if enabled
  const prefs = configManager.getPreferences();
  if (success && region && prefs.previewEnabled) {
    stopPreview();
    startPreview();
  }

  return { success };
});

// ===== Preview Management =====

ipcMain.handle('start-preview', () => {
  logger.info('[IPC] start-preview');
  startPreview();
  return { success: true };
});

ipcMain.handle('stop-preview', () => {
  logger.info('[IPC] stop-preview');
  stopPreview();
  return { success: true };
});

// ===== Screen Capture =====

ipcMain.handle('get-display-info', () => {
  logger.debug('[IPC] get-display-info');
  try {
    const displayInfo = screenCapture.getDisplayInfo();
    return {
      success: true,
      displayInfo
    };
  } catch (error) {
    logger.error('Failed to get display info:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('capture-screenshot', async () => {
  logger.info('[IPC] capture-screenshot');

  const region = configManager.getRegion();
  if (!region) {
    return {
      success: false,
      error: 'No region configured'
    };
  }

  try {
    const result = await screenCapture.captureAndSave(region);
    return result;
  } catch (error) {
    logger.error('Screenshot capture failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('test-capture', async () => {
  logger.info('[IPC] test-capture');

  try {
    // Capture full screen as test
    const displayInfo = screenCapture.getDisplayInfo();
    const testRegion = {
      left: 0,
      top: 0,
      width: displayInfo.size.width * displayInfo.scaleFactor,
      height: displayInfo.size.height * displayInfo.scaleFactor
    };

    const result = await screenCapture.captureAndSave(testRegion, 'test_capture.png');
    return result;
  } catch (error) {
    logger.error('Test capture failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// ===== AI Integration =====

ipcMain.handle('analyze-screenshot', async () => {
  logger.info('[IPC] analyze-screenshot');

  const region = configManager.getRegion();
  if (!region) {
    return {
      success: false,
      error: 'No region configured'
    };
  }

  const config = configManager.getAll();
  if (!configManager.hasAnyAI()) {
    return {
      success: false,
      error: 'No AI API keys configured'
    };
  }

  try {
    // Capture screenshot first
    const captureResult = await screenCapture.captureAndSave(region);
    if (!captureResult.success) {
      return {
        success: false,
        error: 'Screenshot capture failed: ' + captureResult.error
      };
    }

    // Read the saved image
    const fs = require('fs').promises;
    const imageBuffer = await fs.readFile(captureResult.filepath);

    // Analyze with both AIs in parallel
    const results = await analyzeParallel(imageBuffer, config);

    return {
      success: true,
      filepath: captureResult.filepath,
      results: results
    };
  } catch (error) {
    logger.error('Screenshot analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('test-openai-connection', async (event, apiKey) => {
  logger.info('[IPC] test-openai-connection');

  try {
    const result = await testOpenAIConnection(apiKey);
    return result;
  } catch (error) {
    logger.error('OpenAI connection test failed:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

ipcMain.handle('test-gemini-connection', async (event, apiKey) => {
  logger.info('[IPC] test-gemini-connection');

  try {
    const result = await testGeminiConnection(apiKey);
    return result;
  } catch (error) {
    logger.error('Gemini connection test failed:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

// ===== Utility Handlers =====

ipcMain.handle('check-permissions', async () => {
  logger.info('[IPC] check-permissions');

  try {
    const hasPermissions = await screenCapture.checkPermissions();
    return {
      success: true,
      hasPermissions: hasPermissions
    };
  } catch (error) {
    logger.error('Permission check failed:', error);
    return {
      success: false,
      hasPermissions: false,
      error: error.message
    };
  }
});

/**
 * App Lifecycle
 */

app.whenReady().then(() => {
  logStartup();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopPreview();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('Shutting down...');
  stopPreview();
  closeSelectorWindow();
  if (settingsWindow) {
    settingsWindow.close();
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});
