/**
 * Logging System
 * Centralized logging with electron-log
 */

const log = require('electron-log');
const path = require('path');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Set log file location
// Default: Linux: ~/.config/{app name}/logs/main.log
//          macOS: ~/Library/Logs/{app name}/main.log
//          Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\main.log

// Add timestamp format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

// Create logger instance with helper methods
const logger = {
  /**
   * Debug level logging
   */
  debug(...args) {
    log.debug(...args);
  },

  /**
   * Info level logging
   */
  info(...args) {
    log.info(...args);
  },

  /**
   * Warning level logging
   */
  warn(...args) {
    log.warn(...args);
  },

  /**
   * Error level logging
   */
  error(...args) {
    log.error(...args);
  },

  /**
   * Log application startup
   */
  startup(appName, version) {
    log.info('='.repeat(70));
    log.info(`${appName} v${version} - Starting`);
    log.info(`Platform: ${process.platform} ${process.arch}`);
    log.info(`Electron: ${process.versions.electron}`);
    log.info(`Node: ${process.versions.node}`);
    log.info(`Chrome: ${process.versions.chrome}`);
    log.info(`Log file: ${log.transports.file.getFile().path}`);
    log.info('='.repeat(70));
  },

  /**
   * Log AI request
   */
  aiRequest(provider, model) {
    log.info(`[AI] ${provider} request: ${model}`);
  },

  /**
   * Log AI response
   */
  aiResponse(provider, duration, success) {
    if (success) {
      log.info(`[AI] ${provider} response: ${duration.toFixed(2)}s ✓`);
    } else {
      log.error(`[AI] ${provider} failed after ${duration.toFixed(2)}s`);
    }
  },

  /**
   * Log screenshot capture
   */
  screenshot(region, success) {
    if (success) {
      log.info(`[Capture] Screenshot: ${region.width}x${region.height} at (${region.left},${region.top}) ✓`);
    } else {
      log.error(`[Capture] Screenshot failed: ${region.width}x${region.height}`);
    }
  },

  /**
   * Log region selection
   */
  regionSelected(region) {
    log.info(`[Region] Selected: ${region.width}x${region.height} at (${region.left},${region.top})`);
  },

  /**
   * Log configuration change
   */
  configChanged(key, value) {
    if (key.includes('api_key')) {
      // Don't log API keys
      log.info(`[Config] ${key}: ***`);
    } else {
      log.info(`[Config] ${key}:`, value);
    }
  },

  /**
   * Get log file path
   */
  getLogPath() {
    return log.transports.file.getFile().path;
  }
};

module.exports = logger;
