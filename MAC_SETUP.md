# TriviaVision AI - macOS Setup Guide

This guide will help you set up and run TriviaVision AI on your Mac with full Retina display support and proper screen capture.

## Why This App Works Great on Mac

✅ **Automatic Retina Display Scaling** - Works perfectly on high-DPI displays
✅ **Native Screenshot Capture** - Uses `mss` library optimized for macOS
✅ **Multi-Monitor Support** - Handles multiple displays correctly
✅ **Fullscreen Overlay** - Clean region selection interface

## Prerequisites

1. **macOS 10.13 or later** (High Sierra+)
2. **Python 3.7 or higher**
3. **Screen Recording Permission** (required)

## Installation Steps

### 1. Install Python (if not already installed)

Check if Python 3 is installed:
```bash
python3 --version
```

If not installed, install using Homebrew:
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python3
```

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd TriviaVisionAI

# Install required packages
pip3 install -r requirements.txt
```

### 3. Grant Screen Recording Permission ⚠️ IMPORTANT

This is the most critical step for Mac users:

1. **Run the app once** (it may fail, but this triggers the permission request):
   ```bash
   python3 TriviaCaptureAI.py
   ```

2. **Grant Permission:**
   - Open **System Settings** (macOS 13+) or **System Preferences** (older versions)
   - Navigate to **Privacy & Security** → **Screen Recording**
   - You should see **Python** or **Terminal** in the list
   - **Check the box** to enable screen recording
   - If prompted, click **"Quit Now"** to close Terminal

3. **Restart Terminal:**
   - Completely quit Terminal (Cmd+Q)
   - Reopen Terminal
   - Navigate back to the project folder
   - Run the app again:
     ```bash
     cd TriviaVisionAI
     python3 TriviaCaptureAI.py
     ```

### 4. Configure API Keys

1. The app will launch with a GUI
2. Click the **⚙️ Settings** button
3. Go to **🔑 API Keys** tab
4. Enter your API keys:
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Gemini**: https://aistudio.google.com/app/apikey
5. Click **🧪 Test Connection** to verify
6. Click **💾 Save Settings**

## Using the App on Mac

### Selecting a Region

1. Click **📐 Select Region**
2. Your screen will dim with a semi-transparent overlay
3. **Draw** a rectangle around where trivia questions appear
4. **Adjust** the region:
   - Drag inside the box to move it
   - Drag corners/edges to resize
5. Click **✓ Confirm Selection**

### Taking Screenshots

1. Position a trivia question in the selected region
2. Click **📸 Take Screenshot & Analyze**
3. Both AI models will analyze in parallel
4. Results appear in ~1-3 seconds

## Retina Display Support

The app automatically detects and handles Retina displays:

- **UI coordinates** are shown in logical pixels (what you see)
- **Screenshot coordinates** are converted to physical pixels (2x or 3x)
- **Scale factor** is displayed in the terminal when you select a region

Example output:
```
Screen scale factor detected: 2x
Region selected (UI coords): 100,100 400x300
Region saved (physical pixels): 200,200 800x600
```

This ensures screenshots are captured at full Retina resolution.

## Troubleshooting

### "Screen recording permission required" error

**Solution:**
1. Go to System Settings > Privacy & Security > Screen Recording
2. Enable Python or Terminal
3. **IMPORTANT:** Quit Terminal completely (Cmd+Q)
4. Relaunch Terminal and try again

### Screenshots are blank/black

**Cause:** Screen recording permission not properly granted

**Solution:**
1. Check System Settings > Privacy & Security > Screen Recording
2. Make sure the checkbox is **enabled**
3. If it's already enabled, **disable and re-enable** it
4. Restart Terminal completely

### Region selector not appearing

**Solution:**
1. Press **Cmd+Tab** to switch to the selector window
2. Check if it's behind other windows
3. Look in the Dock for "Python" or the app icon
4. If stuck, press **Escape** to cancel and try again

### Coordinates seem off

The app now handles this automatically, but if you experience issues:

1. Check the terminal output for scale factor detection
2. The app should show: `Screen scale factor detected: 2x`
3. If scale factor is wrong, restart the app

### Wrong display on multi-monitor setup

**Solution:**
1. Make sure to select the region on your **primary display** first
2. External monitors should work, but test carefully
3. Check the coordinates in the terminal output

## Performance on Mac

Expected performance with recommended models:

| Component | Performance |
|-----------|-------------|
| Screenshot Capture | ~10-20ms with mss |
| Region Selection | Instant |
| OpenAI gpt-4o-mini | 1-3 seconds |
| Gemini 2.0 Flash | 0.5-2 seconds |
| Parallel Processing | Time of slowest (not sum) |

## Tips for Best Results on Mac

1. **Use mss library** - Already included in requirements.txt, essential for Mac
2. **Grant full permissions** - Don't skip the Screen Recording permission step
3. **Use primary display** - For most reliable results
4. **Select clear regions** - Make sure text is readable in the selected area
5. **Check terminal output** - Watch for error messages and scale factor detection

## Running on Startup (Optional)

Create an alias for easy launching:

```bash
# Add to ~/.zshrc or ~/.bash_profile
alias trivia="cd ~/path/to/TriviaVisionAI && python3 TriviaCaptureAI.py"

# Then just run:
trivia
```

## Uninstallation

To remove screen recording permission:
1. Go to System Settings > Privacy & Security > Screen Recording
2. Uncheck Python or Terminal
3. Delete the TriviaVisionAI folder

## Getting Help

If you encounter issues:

1. Check the terminal output for detailed error messages
2. Look for the scale factor detection message
3. Verify screen recording permission is granted
4. Make sure all dependencies are installed: `pip3 install -r requirements.txt`
5. Try creating a new region selection

## macOS Version Compatibility

| macOS Version | Status | Notes |
|---------------|--------|-------|
| Sonoma 14.x | ✅ Tested | Full support |
| Ventura 13.x | ✅ Compatible | Full support |
| Monterey 12.x | ✅ Compatible | Full support |
| Big Sur 11.x | ✅ Compatible | Full support |
| Catalina 10.15 | ✅ Compatible | Screen Recording permission introduced |
| Mojave 10.14 | ⚠️ Limited | May have permission issues |

## Summary

TriviaVision AI is fully optimized for macOS with automatic Retina scaling and native screenshot support. The most important step is granting Screen Recording permission - everything else is automated!

Enjoy using TriviaVision AI on your Mac! 🎯
