/**
 * TriviaVisionAI - Main Window Renderer
 * UI logic for the main application window
 */

// Application state
let config = null;
let region = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Renderer] DOM loaded');
  initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('[Renderer] Initializing application...');

  // Display system info
  displaySystemInfo();

  // Load configuration
  await loadConfiguration();

  // Set up event listeners
  setupEventListeners();

  // Set up preview listener
  setupPreviewListener();

  // Initial status
  updateStatus('Ready');

  console.log('[Renderer] Initialization complete');
}

/**
 * Display system information
 */
function displaySystemInfo() {
  const platformInfo = document.getElementById('platform-info');
  const versionInfo = document.getElementById('version-info');

  if (window.electronAPI) {
    const { platform, versions } = window.electronAPI;
    platformInfo.textContent = `Platform: ${platform}`;
    versionInfo.textContent = `Electron ${versions.electron}`;
  }
}

/**
 * Load configuration from main process
 */
async function loadConfiguration() {
  try {
    const result = await window.electronAPI.getConfig();
    if (result.success) {
      config = result.config;
      region = config.region;

      console.log('[Renderer] Configuration loaded:', config);

      // Update UI
      updateRegionInfo();
      updateAPIStatus();
    }
  } catch (error) {
    console.error('[Renderer] Failed to load config:', error);
    updateStatus('Error loading configuration', 'error');
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Select Region button
  const selectRegionBtn = document.getElementById('select-region-btn');
  if (selectRegionBtn) {
    selectRegionBtn.addEventListener('click', handleSelectRegion);
  }

  // Screenshot & Analyze button
  const screenshotBtn = document.getElementById('screenshot-btn');
  if (screenshotBtn) {
    screenshotBtn.addEventListener('click', handleAnalyzeScreenshot);
  }

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', handleOpenSettings);
  }
}

/**
 * Set up preview update listener
 */
function setupPreviewListener() {
  window.electronAPI.onPreviewUpdate((data) => {
    updatePreviewImage(data);
  });
}

/**
 * Handle Select Region button click
 */
async function handleSelectRegion() {
  console.log('[UI] Select Region clicked');
  updateStatus('Opening region selector...');

  try {
    await window.electronAPI.openSelector();
    updateStatus('Region selector opened - Draw region, then press ENTER');
  } catch (error) {
    console.error('[UI] Error opening selector:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Handle Screenshot & Analyze button click
 */
async function handleAnalyzeScreenshot() {
  console.log('[UI] Screenshot & Analyze clicked');

  // Check if region is set
  if (!region) {
    updateStatus('Please select a region first', 'warning');
    return;
  }

  // Check if API keys are configured
  if (!config.api_keys.openai && !config.api_keys.gemini) {
    updateStatus('Please configure API keys in Settings', 'warning');
    return;
  }

  // Disable button and show loading state
  const screenshotBtn = document.getElementById('screenshot-btn');
  screenshotBtn.disabled = true;
  screenshotBtn.textContent = '⏳ Analyzing...';

  updateStatus('Capturing screenshot and analyzing with AI...');
  updateOpenAIText('⏳ Analyzing...');
  updateGeminiText('⏳ Analyzing...');

  try {
    const result = await window.electronAPI.analyzeScreenshot();

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('[UI] Analysis complete:', result);

    // Update OpenAI response
    if (result.results.openai) {
      if (result.results.openai.success) {
        const duration = result.results.openai.duration.toFixed(2);
        const text = `⏱️ ${duration}s\n\n${result.results.openai.response}`;
        updateOpenAIText(text);
      } else {
        updateOpenAIText(`❌ Error: ${result.results.openai.error}`);
      }
    } else {
      updateOpenAIText('⚠️ Not configured');
    }

    // Update Gemini response
    if (result.results.gemini) {
      if (result.results.gemini.success) {
        const duration = result.results.gemini.duration.toFixed(2);
        const text = `⏱️ ${duration}s\n\n${result.results.gemini.response}`;
        updateGeminiText(text);
      } else {
        updateGeminiText(`❌ Error: ${result.results.gemini.error}`);
      }
    } else {
      updateGeminiText('⚠️ Not configured');
    }

    // Build status message
    let statusParts = [];
    if (result.results.openai?.success) {
      statusParts.push(`OpenAI: ${result.results.openai.duration.toFixed(2)}s`);
    }
    if (result.results.gemini?.success) {
      statusParts.push(`Gemini: ${result.results.gemini.duration.toFixed(2)}s`);
    }

    if (statusParts.length > 0) {
      updateStatus(`✅ Analysis complete! ${statusParts.join(' | ')}`, 'success');
    } else {
      updateStatus('❌ Analysis failed - check API keys', 'error');
    }

  } catch (error) {
    console.error('[UI] Error analyzing screenshot:', error);
    updateStatus(`❌ Error: ${error.message}`, 'error');
    updateOpenAIText('');
    updateGeminiText('');
  } finally {
    // Re-enable button
    screenshotBtn.disabled = false;
    screenshotBtn.textContent = '📸 Screenshot & Analyze';
  }
}

/**
 * Handle Settings button click
 */
async function handleOpenSettings() {
  console.log('[UI] Settings clicked');

  try {
    await window.electronAPI.openSettings();

    // Reload configuration when settings window closes
    // (Settings window will update config directly)
    setTimeout(async () => {
      await loadConfiguration();
    }, 500);
  } catch (error) {
    console.error('[UI] Error opening settings:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Update preview image
 */
function updatePreviewImage(data) {
  const previewImg = document.getElementById('preview-image');
  const previewPlaceholder = document.getElementById('preview-placeholder');

  if (data && data.image) {
    // Show image
    previewImg.src = `data:image/png;base64,${data.image}`;
    previewImg.style.display = 'block';

    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'none';
    }
  } else {
    // Show placeholder
    previewImg.style.display = 'none';
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'flex';
    }
  }
}

/**
 * Update region info display
 */
function updateRegionInfo() {
  const regionText = document.getElementById('region-text');
  const screenshotBtn = document.getElementById('screenshot-btn');

  if (region) {
    regionText.textContent = `Region: ${region.width}x${region.height} at (${region.left}, ${region.top})`;
    if (screenshotBtn) {
      screenshotBtn.disabled = false;
    }
  } else {
    regionText.textContent = 'No region selected';
    if (screenshotBtn) {
      screenshotBtn.disabled = true;
    }
  }
}

/**
 * Update API status display
 */
function updateAPIStatus() {
  if (!config) return;

  const hasOpenAI = !!(config.api_keys.openai && config.api_keys.openai.trim());
  const hasGemini = !!(config.api_keys.gemini && config.api_keys.gemini.trim());

  // Update OpenAI status
  const openaiText = document.getElementById('openai-text');
  if (openaiText && openaiText.textContent === '') {
    if (!hasOpenAI) {
      openaiText.textContent = '⚠️ API key not configured\n\nClick Settings to add your OpenAI API key';
    }
  }

  // Update Gemini status
  const geminiText = document.getElementById('gemini-text');
  if (geminiText && geminiText.textContent === '') {
    if (!hasGemini) {
      geminiText.textContent = '⚠️ API key not configured\n\nClick Settings to add your Gemini API key';
    }
  }
}

/**
 * Update OpenAI response text
 */
function updateOpenAIText(text) {
  const openaiText = document.getElementById('openai-text');
  if (openaiText) {
    openaiText.textContent = text;
  }
}

/**
 * Update Gemini response text
 */
function updateGeminiText(text) {
  const geminiText = document.getElementById('gemini-text');
  if (geminiText) {
    geminiText.textContent = text;
  }
}

/**
 * Update status display
 */
function updateStatus(message, type = 'normal') {
  const statusText = document.getElementById('status-text');
  if (!statusText) return;

  statusText.textContent = message;

  // Color based on type
  switch (type) {
    case 'error':
      statusText.style.color = '#e74c3c';
      break;
    case 'success':
      statusText.style.color = '#27ae60';
      break;
    case 'warning':
      statusText.style.color = '#f39c12';
      break;
    default:
      statusText.style.color = '#1abc9c';
  }

  console.log(`[Status] ${message}`);
}

/**
 * Handle region selected (called from selector window)
 */
window.handleRegionSelected = async function(selectedRegion) {
  console.log('[UI] Region selected:', selectedRegion);

  try {
    const result = await window.electronAPI.setRegion(selectedRegion);

    if (result.success) {
      region = selectedRegion;
      updateRegionInfo();
      updateStatus(`✅ Region selected: ${region.width}x${region.height}`, 'success');
    } else {
      updateStatus('Failed to save region', 'error');
    }
  } catch (error) {
    console.error('[UI] Error saving region:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
};

// Log initialization
console.log('[Renderer] Script loaded');
console.log('[Renderer] electronAPI available:', !!window.electronAPI);
