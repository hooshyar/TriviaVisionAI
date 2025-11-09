/**
 * TriviaVisionAI - Preload Script
 *
 * This script runs in the renderer process BEFORE the web page loads.
 * It has access to both Node.js APIs and the DOM.
 *
 * Security: Uses contextBridge to expose only specific APIs to the renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Region selector
  openSelector: () => ipcRenderer.invoke('open-selector'),
  closeSelector: () => ipcRenderer.invoke('close-selector'),

  // Screen capture
  testCapture: () => ipcRenderer.invoke('test-capture'),

  // Display info
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),

  // Event listeners (one-way from main to renderer)
  onSelectorClosed: (callback) => {
    ipcRenderer.on('selector-closed', callback);
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('[Preload] Security bridge initialized');
console.log(`[Preload] Platform: ${process.platform}`);
