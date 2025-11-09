# TriviaVisionAI - Electron Version

This is the Electron implementation of TriviaVisionAI.

## Current Status

**POC (Proof of Concept) Phase**

This is the initial setup to validate critical assumptions:
- ✅ Transparent fullscreen overlay without creating desktop space
- ✅ Screen capture with Retina display support
- ✅ Window positioning and basic UI

## Quick Start

### Prerequisites

- Node.js 18+ installed
- macOS, Windows, or Linux

### Installation

```bash
# Navigate to electron-app directory
cd electron-app

# Install dependencies
npm install
```

### Running

```bash
# Run in development mode
npm start

# Run with detailed logging
npm run dev
```

## Critical Tests

### Test 1: Desktop Space (MOST CRITICAL)

**macOS Users:**
1. Run the app: `npm start`
2. Click "🎯 Select Region" button
3. **Before closing overlay**: Open Mission Control (swipe up with 3-4 fingers)
4. **Check**: Did a new desktop space appear?

**Expected**: ✅ NO new desktop space (stays on current desktop)
**If FAIL**: ❌ Migration approach needs adjustment

### Test 2: Display Info

1. Click "Test Display Info" button
2. Verify scale factor detected correctly
3. On Retina Mac, should show "Scale Factor: 2x"

### Test 3: Screen Capture

1. Click "Test Screen Capture" button
2. Check console for capture results
3. Verify image saved to `../captured_images/`
4. On Retina Mac, verify captured size is 2x

**Note**: May require Screen Recording permission on macOS
- System Preferences → Security & Privacy → Privacy → Screen Recording
- Add Terminal or your IDE

## Project Structure

```
electron-app/
├── package.json          # Dependencies and scripts
├── main.js               # Main process (backend)
├── preload.js            # Security bridge
├── src/
│   ├── index.html        # Main window UI
│   ├── styles.css        # Styles (matches Python colors)
│   ├── renderer.js       # Main window logic
│   ├── selector.html     # Region selector UI
│   └── selector.js       # Region selector logic
├── assets/               # Icons, images
└── build/                # Build config
```

## Key Features Implemented

### ✅ Working
- Main window UI (matches Python design)
- Transparent overlay window
- Region selection with mouse
- Display info detection
- Basic screen capture
- Keyboard shortcuts (ESC/ENTER)

### ⏳ Not Yet Implemented
- Region cropping with Sharp
- OpenAI API integration
- Gemini API integration
- Parallel processing
- Configuration persistence
- Settings dialog
- Live preview
- Auto-updates

## Next Steps

Based on POC test results:

### If POC Passes:
1. Implement region cropping
2. Add configuration system
3. Integrate OpenAI API
4. Integrate Gemini API
5. Add settings dialog
6. Implement live preview
7. Build & distribution

### If POC Fails:
- Investigate alternative overlay approaches
- Consider PyQt/PySide migration
- Research other Electron window types

## Development

### Adding Features

Follow the migration plan in `ELECTRON_MIGRATION_PLAN.md`:
- Day 1-3: Foundation (✅ DONE)
- Day 4: Screen capture refinement
- Day 5-6: Full region selector
- Day 7: Live preview
- Day 8-10: AI integration
- Day 11-12: Polish & build

### Testing

```bash
# Run with console logging
npm run dev

# Check for errors in console
# Test all buttons and features
```

### Building

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Troubleshooting

### "Electron not found"
```bash
npm install
```

### macOS Security Warning
```bash
# Allow in System Preferences → Security & Privacy
# Or run:
xattr -cr node_modules/electron/dist/Electron.app
```

### Screen Capture Returns Black Image
- Grant Screen Recording permission
- System Preferences → Security & Privacy → Privacy → Screen Recording
- Add Terminal or VS Code
- Restart app

### Window Doesn't Appear
- Check console for errors
- Try: `npm run clean && npm install`
- Verify Node.js version: `node --version` (should be 18+)

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Migration Plan](../ELECTRON_MIGRATION_PLAN.md)
- [Decision Matrix](../MIGRATION_DECISION_MATRIX.md)
- [POC Test Guide](../POC_VALIDATION_TEST.md)

## License

MIT
