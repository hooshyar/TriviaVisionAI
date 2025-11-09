/**
 * TriviaVisionAI - Preload Script
 *
 * Security bridge between main process and renderer
 * Exposes only specific IPC methods via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== Window Management =====
  openSelector: () => ipcRenderer.invoke('open-selector'),
  closeSelector: () => ipcRenderer.invoke('close-selector'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),

  // ===== Configuration Management =====
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (updates) => ipcRenderer.invoke('set-config', updates),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  setApiKeys: (keys) => ipcRenderer.invoke('set-api-keys', keys),
  getModels: () => ipcRenderer.invoke('get-models'),
  setModels: (models) => ipcRenderer.invoke('set-models', models),
  getPrompt: () => ipcRenderer.invoke('get-prompt'),
  setPrompt: (prompt) => ipcRenderer.invoke('set-prompt', prompt),
  getRegion: () => ipcRenderer.invoke('get-region'),
  setRegion: (region) => ipcRenderer.invoke('set-region', region),

  // ===== Preview Management =====
  startPreview: () => ipcRenderer.invoke('start-preview'),
  stopPreview: () => ipcRenderer.invoke('stop-preview'),

  // ===== Screen Capture =====
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  testCapture: () => ipcRenderer.invoke('test-capture'),

  // ===== AI Integration =====
  analyzeScreenshot: () => ipcRenderer.invoke('analyze-screenshot'),
  testOpenAIConnection: (apiKey) => ipcRenderer.invoke('test-openai-connection', apiKey),
  testGeminiConnection: (apiKey) => ipcRenderer.invoke('test-gemini-connection', apiKey),

  // ===== Utility =====
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),

  // ===== Event Listeners (Main → Renderer) =====
  onPreviewUpdate: (callback) => {
    ipcRenderer.on('preview-update', (event, data) => callback(data));
  },
  onConfigUpdated: (callback) => {
    ipcRenderer.on('config-updated', (event, config) => callback(config));
  },
  onSelectorClosed: (callback) => {
    ipcRenderer.on('selector-closed', callback);
  },

  // ===== Platform Information =====
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('[Preload] Security bridge initialized');
console.log(`[Preload] Platform: ${process.platform}`);
