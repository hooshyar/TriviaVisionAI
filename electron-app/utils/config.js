/**
 * Configuration Manager
 * Handles persistent storage using electron-store
 */

const Store = require('electron-store');
const log = require('electron-log');

// Available models
const OPENAI_MODELS = [
  "gpt-4o",           // Latest full model (best quality)
  "gpt-4o-mini",      // Fast and cheap (recommended)
  "gpt-4-turbo",      // Previous generation
  "gpt-4"             // Original GPT-4
];

const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",      // Latest experimental flash (fastest)
  "gemini-1.5-flash",          // Stable flash model
  "gemini-1.5-flash-8b",       // Smaller, faster
  "gemini-1.5-pro"             // Pro model (best quality)
];

// Default configuration
const DEFAULT_CONFIG = {
  api_keys: {
    openai: process.env.OPENAI_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || ''
  },
  models: {
    openai_model: 'gpt-4o-mini',
    gemini_model: 'gemini-2.0-flash-exp'
  },
  prompt: 'This image contains a trivia question. Please read the question carefully and provide the correct answer. Be concise and direct with your answer.',
  region: null,
  preferences: {
    previewEnabled: true,
    previewInterval: 1000,  // 1 second
    windowPosition: null,   // { x, y, width, height }
    alwaysOnTop: false
  }
};

// Schema for validation
const schema = {
  api_keys: {
    type: 'object',
    properties: {
      openai: { type: 'string' },
      gemini: { type: 'string' }
    }
  },
  models: {
    type: 'object',
    properties: {
      openai_model: { type: 'string', enum: OPENAI_MODELS },
      gemini_model: { type: 'string', enum: GEMINI_MODELS }
    }
  },
  prompt: {
    type: 'string',
    minLength: 1
  },
  region: {
    type: ['object', 'null'],
    properties: {
      left: { type: 'number' },
      top: { type: 'number' },
      width: { type: 'number', minimum: 20 },
      height: { type: 'number', minimum: 20 }
    }
  },
  preferences: {
    type: 'object',
    properties: {
      previewEnabled: { type: 'boolean' },
      previewInterval: { type: 'number', minimum: 100 },
      windowPosition: { type: ['object', 'null'] },
      alwaysOnTop: { type: 'boolean' }
    }
  }
};

class ConfigManager {
  constructor() {
    this.store = new Store({
      name: 'trivia-config',
      defaults: DEFAULT_CONFIG,
      schema: schema
    });

    log.info('Configuration loaded from:', this.store.path);
  }

  /**
   * Get entire configuration
   */
  getAll() {
    return this.store.store;
  }

  /**
   * Get specific configuration value
   */
  get(key, defaultValue = null) {
    return this.store.get(key, defaultValue);
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    try {
      this.store.set(key, value);
      log.info(`Config updated: ${key}`, value);
      return true;
    } catch (error) {
      log.error(`Failed to set config ${key}:`, error);
      return false;
    }
  }

  /**
   * Update multiple configuration values
   */
  update(updates) {
    try {
      Object.entries(updates).forEach(([key, value]) => {
        this.store.set(key, value);
      });
      log.info('Config updated:', Object.keys(updates));
      return true;
    } catch (error) {
      log.error('Failed to update config:', error);
      return false;
    }
  }

  /**
   * Reset to defaults
   */
  reset() {
    try {
      this.store.clear();
      log.info('Configuration reset to defaults');
      return true;
    } catch (error) {
      log.error('Failed to reset config:', error);
      return false;
    }
  }

  /**
   * Get API keys
   */
  getApiKeys() {
    return this.get('api_keys', DEFAULT_CONFIG.api_keys);
  }

  /**
   * Set API keys
   */
  setApiKeys(keys) {
    const currentKeys = this.getApiKeys();
    const updated = { ...currentKeys, ...keys };
    return this.set('api_keys', updated);
  }

  /**
   * Get models configuration
   */
  getModels() {
    return this.get('models', DEFAULT_CONFIG.models);
  }

  /**
   * Set models
   */
  setModels(models) {
    const currentModels = this.getModels();
    const updated = { ...currentModels, ...models };
    return this.set('models', updated);
  }

  /**
   * Get prompt
   */
  getPrompt() {
    return this.get('prompt', DEFAULT_CONFIG.prompt);
  }

  /**
   * Set prompt
   */
  setPrompt(prompt) {
    return this.set('prompt', prompt);
  }

  /**
   * Get region
   */
  getRegion() {
    return this.get('region');
  }

  /**
   * Set region
   */
  setRegion(region) {
    if (!region) {
      return this.set('region', null);
    }

    // Validate region
    if (region.width < 20 || region.height < 20) {
      log.error('Region too small (minimum 20x20):', region);
      return false;
    }

    return this.set('region', region);
  }

  /**
   * Get preferences
   */
  getPreferences() {
    return this.get('preferences', DEFAULT_CONFIG.preferences);
  }

  /**
   * Update preferences
   */
  updatePreferences(prefs) {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    return this.set('preferences', updated);
  }

  /**
   * Check if OpenAI is configured
   */
  hasOpenAI() {
    const keys = this.getApiKeys();
    return !!(keys.openai && keys.openai.trim());
  }

  /**
   * Check if Gemini is configured
   */
  hasGemini() {
    const keys = this.getApiKeys();
    return !!(keys.gemini && keys.gemini.trim());
  }

  /**
   * Check if any AI is configured
   */
  hasAnyAI() {
    return this.hasOpenAI() || this.hasGemini();
  }

  /**
   * Get configuration file path (for display)
   */
  getPath() {
    return this.store.path;
  }
}

// Export singleton instance
const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  configManager,
  OPENAI_MODELS,
  GEMINI_MODELS,
  DEFAULT_CONFIG
};
