/**
 * TriviaVisionAI - Settings Dialog
 * Configuration UI for API keys, models, and prompts
 */

// Prompt templates
const PROMPT_TEMPLATES = {
  default: 'This image contains a trivia question. Please read the question carefully and provide the correct answer. Be concise and direct with your answer.',
  detailed: 'This image shows a trivia question. Please analyze the question carefully, consider all options if present, and provide the most accurate answer with a brief explanation.',
  quick: 'Read this trivia question and give me the answer only. Be brief.'
};

// Current configuration
let config = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Settings] Initializing...');
  setupTabs();
  setupEventListeners();
  loadConfiguration();
});

/**
 * Setup tab switching
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');

      console.log(`[Settings] Switched to tab: ${tabName}`);
    });
  });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // API Key visibility toggles
  document.getElementById('toggle-openai').addEventListener('click', () => {
    togglePasswordVisibility('openai-key', 'toggle-openai');
  });

  document.getElementById('toggle-gemini').addEventListener('click', () => {
    togglePasswordVisibility('gemini-key', 'toggle-gemini');
  });

  // API connection tests
  document.getElementById('test-openai').addEventListener('click', testOpenAI);
  document.getElementById('test-gemini').addEventListener('click', testGemini);

  // Template buttons
  document.querySelectorAll('.btn-template').forEach(button => {
    button.addEventListener('click', () => {
      const template = button.getAttribute('data-template');
      setPromptTemplate(template);
    });
  });

  // Save and Cancel buttons
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('cancel-btn').addEventListener('click', closeSettings);
}

/**
 * Load configuration from main process
 */
async function loadConfiguration() {
  try {
    const result = await window.electronAPI.getConfig();
    if (result.success) {
      config = result.config;
      console.log('[Settings] Configuration loaded');

      // Populate form fields
      populateFormFields();
    }
  } catch (error) {
    console.error('[Settings] Failed to load config:', error);
  }
}

/**
 * Populate form fields with current configuration
 */
function populateFormFields() {
  if (!config) return;

  // API Keys
  document.getElementById('openai-key').value = config.api_keys.openai || '';
  document.getElementById('gemini-key').value = config.api_keys.gemini || '';

  // Models
  document.getElementById('openai-model').value = config.models.openai_model || 'gpt-4o-mini';
  document.getElementById('gemini-model').value = config.models.gemini_model || 'gemini-2.0-flash-exp';

  // Prompt
  document.getElementById('prompt-text').value = config.prompt || PROMPT_TEMPLATES.default;
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈 Hide';
  } else {
    input.type = 'password';
    button.textContent = '👁️ Show';
  }
}

/**
 * Set prompt from template
 */
function setPromptTemplate(template) {
  const promptText = document.getElementById('prompt-text');
  promptText.value = PROMPT_TEMPLATES[template] || PROMPT_TEMPLATES.default;
  console.log(`[Settings] Applied template: ${template}`);
}

/**
 * Test OpenAI connection
 */
async function testOpenAI() {
  const apiKey = document.getElementById('openai-key').value.trim();
  const resultDiv = document.getElementById('openai-test-result');
  const testButton = document.getElementById('test-openai');

  if (!apiKey) {
    resultDiv.textContent = '⚠️ Please enter an API key first';
    resultDiv.className = 'test-result warning';
    resultDiv.style.display = 'block';
    return;
  }

  // Show loading state
  testButton.disabled = true;
  testButton.textContent = '⏳ Testing...';
  resultDiv.textContent = 'Testing OpenAI connection...';
  resultDiv.className = 'test-result info';
  resultDiv.style.display = 'block';

  try {
    const result = await window.electronAPI.testOpenAIConnection(apiKey);

    if (result.success) {
      resultDiv.textContent = '✅ OpenAI API key is valid!';
      resultDiv.className = 'test-result success';
    } else {
      resultDiv.textContent = `❌ ${result.message}`;
      resultDiv.className = 'test-result error';
    }
  } catch (error) {
    resultDiv.textContent = `❌ Connection failed: ${error.message}`;
    resultDiv.className = 'test-result error';
  } finally {
    testButton.disabled = false;
    testButton.textContent = '🧪 Test';
  }
}

/**
 * Test Gemini connection
 */
async function testGemini() {
  const apiKey = document.getElementById('gemini-key').value.trim();
  const resultDiv = document.getElementById('gemini-test-result');
  const testButton = document.getElementById('test-gemini');

  if (!apiKey) {
    resultDiv.textContent = '⚠️ Please enter an API key first';
    resultDiv.className = 'test-result warning';
    resultDiv.style.display = 'block';
    return;
  }

  // Show loading state
  testButton.disabled = true;
  testButton.textContent = '⏳ Testing...';
  resultDiv.textContent = 'Testing Gemini connection...';
  resultDiv.className = 'test-result info';
  resultDiv.style.display = 'block';

  try {
    const result = await window.electronAPI.testGeminiConnection(apiKey);

    if (result.success) {
      resultDiv.textContent = '✅ Gemini API key is valid!';
      resultDiv.className = 'test-result success';
    } else {
      resultDiv.textContent = `❌ ${result.message}`;
      resultDiv.className = 'test-result error';
    }
  } catch (error) {
    resultDiv.textContent = `❌ Connection failed: ${error.message}`;
    resultDiv.className = 'test-result error';
  } finally {
    testButton.disabled = false;
    testButton.textContent = '🧪 Test';
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  console.log('[Settings] Saving settings...');

  try {
    // Gather form data
    const updates = {
      api_keys: {
        openai: document.getElementById('openai-key').value.trim(),
        gemini: document.getElementById('gemini-key').value.trim()
      },
      models: {
        openai_model: document.getElementById('openai-model').value,
        gemini_model: document.getElementById('gemini-model').value
      },
      prompt: document.getElementById('prompt-text').value.trim()
    };

    // Validate
    if (!updates.prompt) {
      alert('Prompt cannot be empty');
      return;
    }

    // Save to main process
    const result = await window.electronAPI.setConfig(updates);

    if (result.success) {
      console.log('[Settings] Settings saved successfully');
      closeSettings();
    } else {
      alert('Failed to save settings');
    }
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    alert(`Error saving settings: ${error.message}`);
  }
}

/**
 * Close settings dialog
 */
function closeSettings() {
  window.electronAPI.closeSettings();
}
