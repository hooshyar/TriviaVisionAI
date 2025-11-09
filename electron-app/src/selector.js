/**
 * TriviaVisionAI - Region Selector
 * Advanced region selection with 8 resize handles and drag-to-move
 */

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const instructionsDiv = document.getElementById('instructions');
const dimensionsDiv = document.getElementById('dimensions');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Constants
const HANDLE_SIZE = 10;
const MIN_SIZE = 20;

// State
let mode = 'drawing';  // 'drawing' or 'adjusting'
let isDrawing = false;
let isDragging = false;
let isResizing = false;

let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

let region = null;  // {left, top, width, height}
let dragStartX = 0;
let dragStartY = 0;
let activeHandle = null;

// Initialize
console.log('[Selector] Initialized');
console.log(`[Selector] Canvas: ${canvas.width}x${canvas.height}`);

// Load existing region if any
loadExistingRegion();

/**
 * Load existing region from configuration
 */
async function loadExistingRegion() {
  try {
    const result = await window.electronAPI.getRegion();
    if (result.success && result.region) {
      // Convert physical pixels to logical pixels
      const scaleFactor = await getScaleFactor();
      region = {
        left: Math.round(result.region.left / scaleFactor),
        top: Math.round(result.region.top / scaleFactor),
        width: Math.round(result.region.width / scaleFactor),
        height: Math.round(result.region.height / scaleFactor)
      };

      console.log('[Selector] Loaded existing region:', region);
      mode = 'adjusting';
      updateInstructions();
      draw();
    }
  } catch (error) {
    console.error('[Selector] Failed to load region:', error);
  }
}

/**
 * Get display scale factor
 */
async function getScaleFactor() {
  try {
    const result = await window.electronAPI.getDisplayInfo();
    return result.success ? result.displayInfo.scaleFactor : 1;
  } catch (error) {
    return 1;
  }
}

/**
 * Mouse event handlers
 */
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

function handleMouseDown(e) {
  const x = e.clientX;
  const y = e.clientY;

  if (mode === 'adjusting' && region) {
    // Check if clicking on a handle
    const handle = getHandleAtPosition(x, y);
    if (handle) {
      isResizing = true;
      activeHandle = handle;
      dragStartX = x;
      dragStartY = y;
      return;
    }

    // Check if clicking inside region (for dragging)
    if (isInsideRegion(x, y)) {
      isDragging = true;
      dragStartX = x;
      dragStartY = y;
      return;
    }

    // Clicking outside - start new drawing
    mode = 'drawing';
    region = null;
  }

  // Start drawing new region
  isDrawing = true;
  startX = x;
  startY = y;
  currentX = x;
  currentY = y;
}

function handleMouseMove(e) {
  const x = e.clientX;
  const y = e.clientY;

  if (isDrawing) {
    currentX = x;
    currentY = y;
    draw();
    updateDimensions();
  } else if (isDragging && region) {
    const dx = x - dragStartX;
    const dy = y - dragStartY;

    // Move region
    region.left = Math.max(0, Math.min(canvas.width - region.width, region.left + dx));
    region.top = Math.max(0, Math.min(canvas.height - region.height, region.top + dy));

    dragStartX = x;
    dragStartY = y;
    draw();
    updateDimensions();
  } else if (isResizing && region && activeHandle) {
    const dx = x - dragStartX;
    const dy = y - dragStartY;

    resizeRegion(activeHandle, dx, dy);

    dragStartX = x;
    dragStartY = y;
    draw();
    updateDimensions();
  } else if (mode === 'adjusting' && region) {
    // Update cursor based on position
    updateCursor(x, y);
  }
}

function handleMouseUp(e) {
  if (isDrawing) {
    isDrawing = false;

    // Calculate final region
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Only save if region is big enough
    if (width >= MIN_SIZE && height >= MIN_SIZE) {
      region = { left, top, width, height };
      mode = 'adjusting';
      console.log('[Selector] Region selected:', region);
      updateInstructions();
    } else {
      console.log('[Selector] Region too small, ignored');
    }

    draw();
  } else if (isDragging) {
    isDragging = false;
  } else if (isResizing) {
    isResizing = false;
    activeHandle = null;
  }
}

/**
 * Keyboard event handlers
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    console.log('[Selector] ESC - canceling');
    cancelSelection();
  } else if (e.key === 'Enter' && region) {
    console.log('[Selector] ENTER - confirming');
    confirmSelection();
  }
});

/**
 * Draw the selection
 */
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let drawRegion = null;

  if (isDrawing) {
    // Drawing new region
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    drawRegion = { left, top, width, height };
  } else if (region) {
    drawRegion = region;
  }

  if (!drawRegion) return;

  // Draw semi-transparent overlay everywhere
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clear the selected area
  ctx.clearRect(drawRegion.left, drawRegion.top, drawRegion.width, drawRegion.height);

  // Draw rectangle border
  ctx.strokeStyle = '#1abc9c';
  ctx.lineWidth = 3;
  ctx.strokeRect(drawRegion.left, drawRegion.top, drawRegion.width, drawRegion.height);

  // Draw handles if in adjusting mode
  if (mode === 'adjusting' && !isDrawing) {
    drawHandles(drawRegion);
  }
}

/**
 * Draw resize handles
 */
function drawHandles(r) {
  const handles = getHandlePositions(r);

  ctx.fillStyle = '#1abc9c';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  Object.values(handles).forEach(handle => {
    ctx.fillRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
    ctx.strokeRect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
  });
}

/**
 * Get handle positions
 */
function getHandlePositions(r) {
  return {
    'nw': { x: r.left, y: r.top },
    'n':  { x: r.left + r.width / 2, y: r.top },
    'ne': { x: r.left + r.width, y: r.top },
    'e':  { x: r.left + r.width, y: r.top + r.height / 2 },
    'se': { x: r.left + r.width, y: r.top + r.height },
    's':  { x: r.left + r.width / 2, y: r.top + r.height },
    'sw': { x: r.left, y: r.top + r.height },
    'w':  { x: r.left, y: r.top + r.height / 2 }
  };
}

/**
 * Get handle at position (if any)
 */
function getHandleAtPosition(x, y) {
  if (!region) return null;

  const handles = getHandlePositions(region);

  for (const [name, pos] of Object.entries(handles)) {
    if (Math.abs(x - pos.x) <= HANDLE_SIZE && Math.abs(y - pos.y) <= HANDLE_SIZE) {
      return name;
    }
  }

  return null;
}

/**
 * Check if point is inside region
 */
function isInsideRegion(x, y) {
  if (!region) return false;

  return x >= region.left && x <= region.left + region.width &&
         y >= region.top && y <= region.top + region.height;
}

/**
 * Resize region based on handle
 */
function resizeRegion(handle, dx, dy) {
  const original = { ...region };

  // Adjust based on handle
  if (handle.includes('n')) {
    region.top += dy;
    region.height -= dy;
  }
  if (handle.includes('s')) {
    region.height += dy;
  }
  if (handle.includes('w')) {
    region.left += dx;
    region.width -= dx;
  }
  if (handle.includes('e')) {
    region.width += dx;
  }

  // Enforce minimum size
  if (region.width < MIN_SIZE) {
    region.left = original.left;
    region.width = original.width;
  }
  if (region.height < MIN_SIZE) {
    region.top = original.top;
    region.height = original.height;
  }

  // Constrain to canvas bounds
  region.left = Math.max(0, region.left);
  region.top = Math.max(0, region.top);
  region.width = Math.min(canvas.width - region.left, region.width);
  region.height = Math.min(canvas.height - region.top, region.height);
}

/**
 * Update cursor based on position
 */
function updateCursor(x, y) {
  const handle = getHandleAtPosition(x, y);

  if (handle) {
    const cursors = {
      'nw': 'nwse-resize',
      'n': 'ns-resize',
      'ne': 'nesw-resize',
      'e': 'ew-resize',
      'se': 'nwse-resize',
      's': 'ns-resize',
      'sw': 'nesw-resize',
      'w': 'ew-resize'
    };
    canvas.style.cursor = cursors[handle];
  } else if (isInsideRegion(x, y)) {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'crosshair';
  }
}

/**
 * Update instructions
 */
function updateInstructions() {
  if (mode === 'drawing') {
    instructionsDiv.innerHTML = `
      <h2>Draw Region</h2>
      <div class="step">Drag to select trivia question area</div>
      <div class="step"><span class="key">ESC</span> to cancel</div>
    `;
  } else {
    instructionsDiv.innerHTML = `
      <h2>Adjust Region</h2>
      <div class="step">Drag region to move • Drag handles to resize</div>
      <div class="step"><span class="key">ENTER</span> to confirm • <span class="key">ESC</span> to cancel</div>
    `;
  }
}

/**
 * Update dimensions display
 */
function updateDimensions() {
  let r = null;

  if (isDrawing) {
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    dimensionsDiv.textContent = `${width} × ${height}`;
  } else if (region) {
    dimensionsDiv.textContent = `${region.width} × ${region.height}`;
  }

  dimensionsDiv.style.display = 'block';
}

/**
 * Confirm selection
 */
async function confirmSelection() {
  if (!region) return;

  console.log('[Selector] Confirming region:', region);

  try {
    // Get scale factor
    const scaleFactor = await getScaleFactor();

    // Convert to physical pixels
    const physicalRegion = {
      left: Math.round(region.left * scaleFactor),
      top: Math.round(region.top * scaleFactor),
      width: Math.round(region.width * scaleFactor),
      height: Math.round(region.height * scaleFactor)
    };

    console.log('[Selector] Physical region:', physicalRegion);

    // Save to configuration
    await window.electronAPI.setRegion(physicalRegion);

    // Close selector
    window.electronAPI.closeSelector();
  } catch (error) {
    console.error('[Selector] Error confirming selection:', error);
  }
}

/**
 * Cancel selection
 */
function cancelSelection() {
  console.log('[Selector] Canceling selection');
  window.electronAPI.closeSelector();
}

// Initial instructions
updateInstructions();
