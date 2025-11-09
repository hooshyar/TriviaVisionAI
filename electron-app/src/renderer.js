/**
 * TriviaVisionAI - Renderer Process
 * Main window UI logic
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Renderer] DOM loaded');
  initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
  // Display platform and version info
  displaySystemInfo();

  // Set up event listeners
  setupEventListeners();

  // Initial status
  updateStatus('Ready - Click "Select Region" to begin');
}

/**
 * Display system information in footer
 */
function displaySystemInfo() {
  const platformInfo = document.getElementById('platform-info');
  const versionInfo = document.getElementById('version-info');

  if (window.electronAPI) {
    const { platform, versions } = window.electronAPI;

    platformInfo.textContent = `Platform: ${platform}`;
    versionInfo.textContent = `Electron ${versions.electron} | Chrome ${versions.chrome}`;
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Select Region button
  const selectRegionBtn = document.getElementById('select-region-btn');
  selectRegionBtn.addEventListener('click', handleSelectRegion);

  // Screenshot button
  const screenshotBtn = document.getElementById('screenshot-btn');
  screenshotBtn.addEventListener('click', handleScreenshot);

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  settingsBtn.addEventListener('click', handleSettings);

  // Test buttons
  const testDisplayBtn = document.getElementById('test-display-btn');
  testDisplayBtn.addEventListener('click', testDisplayInfo);

  const testCaptureBtn = document.getElementById('test-capture-btn');
  testCaptureBtn.addEventListener('click', testScreenCapture);
}

/**
 * Handle Select Region button click
 */
async function handleSelectRegion() {
  console.log('[UI] Select Region clicked');
  updateStatus('Opening region selector...');

  try {
    await window.electronAPI.openSelector();
    updateStatus('Region selector opened - Use ESC to cancel, ENTER to confirm');
  } catch (error) {
    console.error('[UI] Error opening selector:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Handle Screenshot button click
 */
async function handleScreenshot() {
  console.log('[UI] Screenshot clicked');
  updateStatus('Taking screenshot and analyzing...');

  const screenshotBtn = document.getElementById('screenshot-btn');
  screenshotBtn.disabled = true;
  screenshotBtn.textContent = '⏳ Analyzing...';

  try {
    // TODO: Implement actual screenshot + AI analysis
    updateStatus('Screenshot feature coming soon in full implementation');

    setTimeout(() => {
      screenshotBtn.disabled = false;
      screenshotBtn.textContent = '📸 Screenshot & Analyze';
      updateStatus('Ready');
    }, 2000);
  } catch (error) {
    console.error('[UI] Error taking screenshot:', error);
    updateStatus(`Error: ${error.message}`, 'error');
    screenshotBtn.disabled = false;
    screenshotBtn.textContent = '📸 Screenshot & Analyze';
  }
}

/**
 * Handle Settings button click
 */
function handleSettings() {
  console.log('[UI] Settings clicked');
  updateStatus('Settings feature coming soon in full implementation');
}

/**
 * Test Display Info
 */
async function testDisplayInfo() {
  console.log('[Test] Testing display info...');
  updateTestResults('Testing display information...\n');

  try {
    const displayInfo = await window.electronAPI.getDisplayInfo();

    let results = '✅ Display Info Retrieved:\n\n';
    results += `Screen Size: ${displayInfo.size.width}x${displayInfo.size.height}\n`;
    results += `Work Area: ${displayInfo.workAreaSize.width}x${displayInfo.workAreaSize.height}\n`;
    results += `Scale Factor: ${displayInfo.scaleFactor}x\n`;
    results += `Retina Display: ${displayInfo.isRetina ? 'YES' : 'NO'}\n\n`;

    if (displayInfo.scaleFactor === 2) {
      results += '✅ PASS: Retina display detected correctly\n';
    } else {
      results += 'ℹ️  Standard display (no scaling needed)\n';
    }

    updateTestResults(results);
    console.log('[Test] Display info:', displayInfo);
  } catch (error) {
    updateTestResults(`❌ FAIL: ${error.message}\n`);
    console.error('[Test] Error:', error);
  }
}

/**
 * Test Screen Capture
 */
async function testScreenCapture() {
  console.log('[Test] Testing screen capture...');
  updateTestResults('Testing screen capture...\n');

  try {
    const result = await window.electronAPI.testCapture();

    if (result.success) {
      let results = '✅ Screen Capture SUCCESS:\n\n';
      results += `Captured Size: ${result.size.width}x${result.size.height}\n`;
      results += `Scale Factor: ${result.scaleFactor}x\n`;
      results += `Saved to: ${result.filepath}\n\n`;

      // Validate expected size on Retina
      if (result.scaleFactor === 2) {
        results += 'ℹ️  Retina display: Image should be 2x physical pixels\n';
      }

      results += '\n✅ PASS: Screen capture working!\n';
      updateTestResults(results);
    } else {
      let results = '❌ Screen Capture FAILED:\n\n';
      results += `Error: ${result.error}\n\n`;
      results += 'Common issues:\n';
      results += '- Screen Recording permission not granted\n';
      results += '- Check System Preferences → Security & Privacy → Privacy → Screen Recording\n';
      updateTestResults(results);
    }

    console.log('[Test] Capture result:', result);
  } catch (error) {
    updateTestResults(`❌ FAIL: ${error.message}\n`);
    console.error('[Test] Error:', error);
  }
}

/**
 * Update status display
 */
function updateStatus(message, type = 'normal') {
  const statusText = document.getElementById('status-text');
  statusText.textContent = message;

  // Color based on type
  if (type === 'error') {
    statusText.style.color = '#e74c3c';
  } else if (type === 'success') {
    statusText.style.color = '#2ecc71';
  } else if (type === 'warning') {
    statusText.style.color = '#f39c12';
  } else {
    statusText.style.color = '#1abc9c';
  }

  console.log(`[Status] ${message}`);
}

/**
 * Update test results display
 */
function updateTestResults(text) {
  const testResults = document.getElementById('test-results');
  testResults.textContent = text;
}

/**
 * Update region info display
 */
function updateRegionInfo(region) {
  const regionText = document.getElementById('region-text');

  if (region) {
    regionText.textContent = `${region.width}x${region.height} at (${region.left}, ${region.top})`;

    // Enable screenshot button
    const screenshotBtn = document.getElementById('screenshot-btn');
    screenshotBtn.disabled = false;
  } else {
    regionText.textContent = 'Not selected';

    // Disable screenshot button
    const screenshotBtn = document.getElementById('screenshot-btn');
    screenshotBtn.disabled = true;
  }
}

// Log initialization
console.log('[Renderer] Script loaded');
console.log('[Renderer] electronAPI available:', !!window.electronAPI);
