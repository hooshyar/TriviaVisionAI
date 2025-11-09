/**
 * Shared Constants
 */

// Window dimensions
const MAIN_WINDOW = {
  WIDTH: 500,
  HEIGHT: 750,
  MIN_WIDTH: 450,
  MIN_HEIGHT: 600
};

// Preview settings
const PREVIEW = {
  MAX_WIDTH: 400,
  MAX_HEIGHT: 200,
  INTERVAL: 1000  // 1 second
};

// Region constraints
const REGION = {
  MIN_WIDTH: 20,
  MIN_HEIGHT: 20,
  HANDLE_SIZE: 10
};

// AI settings
const AI = {
  TIMEOUT: 30000,  // 30 seconds
  MAX_TOKENS: 500,
  IMAGE_DETAIL: 'high'
};

// Colors (matching Python/Tkinter exactly)
const COLORS = {
  BG_PRIMARY: '#2c3e50',
  BG_SECONDARY: '#34495e',
  ACCENT: '#1abc9c',
  INPUT_BG: '#1e2a38',
  TEXT_COLOR: '#ecf0f1',
  TEXT_DIM: '#bdc3c7',
  TEXT_DIMMER: '#95a5a6',
  SUCCESS: '#27ae60',
  WARNING: '#f39c12',
  DANGER: '#e74c3c',
  INFO: '#3498db',
  PURPLE: '#9b59b6',
  OPENAI: '#10a37f',
  GEMINI: '#4285f4'
};

// Prompt templates
const PROMPT_TEMPLATES = {
  DEFAULT: 'This image contains a trivia question. Please read the question carefully and provide the correct answer. Be concise and direct with your answer.',
  DETAILED: 'This image shows a trivia question. Please analyze the question carefully, consider all options if present, and provide the most accurate answer with a brief explanation.',
  QUICK: 'Read this trivia question and give me the answer only. Be brief.'
};

// File paths
const PATHS = {
  CAPTURED_IMAGES: 'captured_images',
  CONFIG_FILE: 'trivia-config.json'
};

// API endpoints
const API = {
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    CHAT_COMPLETIONS: '/chat/completions',
    MODELS: '/models'
  },
  GEMINI: {
    // Gemini uses SDK, not direct endpoints
  }
};

module.exports = {
  MAIN_WINDOW,
  PREVIEW,
  REGION,
  AI,
  COLORS,
  PROMPT_TEMPLATES,
  PATHS,
  API
};
