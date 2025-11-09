/**
 * TriviaVisionAI - Region Selector
 * Interactive region selection overlay
 */

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const instructionsDiv = document.getElementById('instructions');
const dimensionsDiv = document.getElementById('dimensions');
const testBanner = document.getElementById('test-banner');

// Set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// State
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let selectedRegion = null;

// Initialize
console.log('[Selector] Initialized');
console.log(`[Selector] Canvas size: ${canvas.width}x${canvas.height}`);

// Hide test banner after 5 seconds
setTimeout(() => {
  testBanner.style.display = 'none';
}, 5000);

/**
 * Mouse event handlers
 */
canvas.addEventListener('mousedown', (e) => {
  console.log('[Selector] Mouse down');
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = startX;
  currentY = startY;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  currentX = e.clientX;
  currentY = e.clientY;

  // Redraw
  draw();

  // Update dimensions display
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  dimensionsDiv.textContent = `${width} × ${height}`;
  dimensionsDiv.style.display = 'block';
});

canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return;

  console.log('[Selector] Mouse up');
  isDrawing = false;

  // Calculate final region
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  // Only save if region is big enough (at least 20x20)
  if (width >= 20 && height >= 20) {
    selectedRegion = { left, top, width, height };
    console.log('[Selector] Region selected:', selectedRegion);

    // Update instructions
    instructionsDiv.innerHTML = `
      <h2>Region Selected: ${width} × ${height}</h2>
      <div class="step"><span class="key">ENTER</span> to confirm | <span class="key">ESC</span> to cancel | Draw again to change</div>
    `;
  } else {
    console.log('[Selector] Region too small, ignored');
  }

  draw();
});

/**
 * Keyboard event handlers
 */
document.addEventListener('keydown', (e) => {
  console.log('[Selector] Key pressed:', e.key);

  if (e.key === 'Escape') {
    console.log('[Selector] ESC pressed - canceling');
    cancelSelection();
  } else if (e.key === 'Enter' && selectedRegion) {
    console.log('[Selector] ENTER pressed - confirming');
    confirmSelection();
  }
});

/**
 * Draw the selection rectangle
 */
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isDrawing && !selectedRegion) return;

  let left, top, width, height;

  if (isDrawing) {
    // Drawing in progress
    left = Math.min(startX, currentX);
    top = Math.min(startY, currentY);
    width = Math.abs(currentX - startX);
    height = Math.abs(currentY - startY);
  } else if (selectedRegion) {
    // Showing selected region
    ({ left, top, width, height } = selectedRegion);
  }

  // Draw semi-transparent overlay everywhere
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clear the selected area (make it transparent)
  ctx.clearRect(left, top, width, height);

  // Draw rectangle border
  ctx.strokeStyle = '#1abc9c';
  ctx.lineWidth = 3;
  ctx.strokeRect(left, top, width, height);

  // Draw corner markers
  const markerSize = 20;
  ctx.fillStyle = '#1abc9c';

  // Top-left
  ctx.fillRect(left - 2, top - 2, markerSize, 4);
  ctx.fillRect(left - 2, top - 2, 4, markerSize);

  // Top-right
  ctx.fillRect(left + width - markerSize + 2, top - 2, markerSize, 4);
  ctx.fillRect(left + width - 2, top - 2, 4, markerSize);

  // Bottom-left
  ctx.fillRect(left - 2, top + height - 2, markerSize, 4);
  ctx.fillRect(left - 2, top + height - markerSize + 2, 4, markerSize);

  // Bottom-right
  ctx.fillRect(left + width - markerSize + 2, top + height - 2, markerSize, 4);
  ctx.fillRect(left + width - 2, top + height - markerSize + 2, 4, markerSize);
}

/**
 * Confirm selection and close
 */
function confirmSelection() {
  console.log('[Selector] Confirming selection:', selectedRegion);

  // TODO: Send selected region back to main process
  // For now, just close
  if (window.electronAPI) {
    window.electronAPI.closeSelector();
  } else {
    window.close();
  }
}

/**
 * Cancel selection and close
 */
function cancelSelection() {
  console.log('[Selector] Canceling selection');

  if (window.electronAPI) {
    window.electronAPI.closeSelector();
  } else {
    window.close();
  }
}

// Log when ready
console.log('[Selector] Ready for region selection');
console.log('[Selector] CRITICAL TEST: Check if this created a new desktop space on macOS');
