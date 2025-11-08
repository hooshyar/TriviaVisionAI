# TriviaVision AI - Desktop Trivia Screenshot Assistant

TriviaVision AI is a revolutionary Python desktop application that captures screenshots of trivia questions from your screen and uses **parallel AI processing** with both OpenAI and Google Gemini to provide instant answers with multiple perspectives.

## Features

- **🚀 Parallel AI Processing**: Queries both OpenAI and Google Gemini simultaneously for ultra-fast results
- **🤖 Dual AI Models**: Choose from latest models including `gpt-4o`, `gpt-4o-mini`, `gemini-2.0-flash-exp`, and more
- **⚙️ Easy Configuration UI**: No code editing! Configure API keys, models, and prompts through intuitive Settings dialog
- **🔒 Secure Key Management**: Password-masked API key inputs with show/hide toggle and connection testing
- **📸 Desktop Screenshot Capture**: Monitor any region of your screen for trivia questions
- **🎯 Advanced Region Selection**: Professional screen capture-style selector with drag to move, resize handles, and adjustment mode
- **✋ Draggable & Resizable**: Move selected region anywhere or resize with 8 corner/edge handles
- **👁️ Live Preview**: Real-time preview of the selected screen region (updates every second)
- **💻 Modern GUI Interface**: User-friendly Tkinter-based interface with side-by-side AI response comparison
- **⚡ Ultra-Fast Response**: Parallel execution means you get answers in the time it takes for the slowest API
- **💾 Configuration Persistence**: Saves all settings (API keys, models, prompts, region) automatically
- **📊 Performance Tracking**: Monitors and displays response time for each AI model
- **💬 Customizable Prompts**: Edit prompts with quick templates or create your own
- **🔧 Flexible Setup**: Works with one or both AI providers

## Installation

### Prerequisites
- Python 3.7 or higher
- At least one API key (both recommended for parallel processing):
  - **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))
  - **Google Gemini API key** ([Get one here](https://aistudio.google.com/app/apikey))

### macOS Specific Requirements

This app is **fully optimized for macOS**, including:
- ✅ Retina display support (automatic scaling)
- ✅ Native screenshot capture with `mss` library
- ✅ Multi-monitor support
- ⚠️ **Screen Recording Permission Required**

**Important for macOS users:**

Before running the app, you must grant Screen Recording permission:

1. Open **System Settings** (or System Preferences on older macOS)
2. Go to **Privacy & Security** → **Screen Recording**
3. Enable permission for **Python** or **Terminal** (whichever you use to run the app)
4. **Restart the terminal** and run the app again

The app will automatically detect if permissions are missing and guide you through the setup.

### Steps

1. Clone this repository:
```bash
git clone <repository-url>
cd TriviaVisionAI
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

**Note for macOS users:** All dependencies including `mss` are essential for proper functionality on Mac.

3. **Easy Setup - No Code Editing Required!**

   Simply run the app and click the **⚙️ Settings** button to configure:
   - API keys (password-masked with show/hide toggle)
   - AI models (choose from latest available models)
   - Custom prompts (with quick templates)

   All settings are automatically saved and loaded on next run.

   **Optional**: Set environment variables (auto-detected on first run):
   ```bash
   export OPENAI_API_KEY='your-openai-api-key-here'
   export GEMINI_API_KEY='your-gemini-api-key-here'
   ```

   **Note**: You can use just one API or both. The app will automatically detect which APIs are configured and use them accordingly.

## Usage

1. **Start the application:**
```bash
python TriviaCaptureAI.py
```

2. **Select and adjust a region:**
   - Click the "📐 Select Region" button
   - Your screen will dim with a semi-transparent overlay
   - **Draw**: Click and drag to draw a rectangle around the area where trivia questions appear
   - **Adjust Mode** (automatically enters after drawing):
     - **Move**: Drag anywhere inside the region to reposition it
     - **Resize**: Drag the corner or edge handles to resize
     - Real-time dimension display shows width × height
     - Different cursors indicate drag/resize mode
   - **Confirm**: Click "✓ Confirm Selection" button to save
   - **Cancel**: Click "✗ Cancel" button or press ESC to discard
   - **Re-adjust**: Click "📐 Select Region" again to modify existing region

3. **Monitor and capture:**
   - The app will show a live preview of your selected region
   - When a trivia question appears, click "📸 Take Screenshot & Analyze"
   - Watch as both AI models analyze the image **in parallel**
   - See responses from both OpenAI and Gemini side-by-side with timing information
   - Compare answers from both models for better accuracy

4. **Screenshots are automatically saved** to the `captured_images/` directory with timestamps

## Settings & Configuration

The app includes a comprehensive **Settings dialog** (⚙️ button) with three tabs:

### 🔑 API Keys Tab
- Enter and manage your OpenAI and Gemini API keys
- Password-masked input fields with show/hide toggle
- **Test Connection** buttons to verify your keys are valid
- Direct links to get API keys from providers

### 🤖 Models Tab
- Select from the latest available models:
  - **OpenAI**: gpt-4o, gpt-4o-mini (recommended), gpt-4-turbo, gpt-4
  - **Gemini**: gemini-2.0-flash-exp (recommended), gemini-1.5-flash, gemini-1.5-flash-8b, gemini-1.5-pro
- Model comparison guide with performance/cost insights
- Easily switch models without code editing

### 💬 Prompt Tab
- Customize the AI prompt for better results
- Three quick templates:
  - **Default**: Balanced approach
  - **Detailed**: Thorough analysis with explanations
  - **Quick**: Brief answers only
- Full text editor for custom prompts

All settings are automatically saved to `trivia_config.json` and persist across sessions.

## Why Parallel AI?

Running multiple AI models simultaneously provides several benefits:

- **⚡ Faster Results**: Get answers in the time it takes for the slowest API (not the sum of both)
- **🎯 Higher Accuracy**: Compare responses from different models to verify answers
- **🔄 Redundancy**: If one API is slow or fails, you still get results from the other
- **💡 Multiple Perspectives**: Different models may provide different insights or explanations
- **💰 Cost-Effective**: Use the fast, cheap mini/flash models while maintaining quality

## Dependencies

- **Pillow**: Image processing and manipulation
- **requests**: HTTP client for OpenAI API calls
- **google-generativeai**: Google Gemini API client
- **mss**: Fast cross-platform screenshot library (optional but recommended)
- **tkinter**: GUI framework (usually included with Python)

## Configuration File

The application automatically saves all settings to `trivia_config.json`:
- API keys (securely stored locally)
- Selected AI models
- Custom prompts
- Screen region coordinates

You only need to configure these once - they persist across sessions. Use the **⚙️ Settings** button anytime to update your configuration.

## How It Works

1. **Region Selection**: Uses a fullscreen transparent Tkinter overlay to let you select any area of your screen
2. **Live Monitoring**: Continuously captures screenshots of the selected region every second for preview
3. **Screenshot Capture**: On button click, captures the current frame from the selected region
4. **Parallel AI Analysis**:
   - Simultaneously sends the screenshot to both OpenAI (gpt-4o-mini) and Gemini (gemini-2.0-flash-exp)
   - Uses Python's `ThreadPoolExecutor` for true parallel execution
   - Both APIs process the image at the same time, not sequentially
5. **Response Display**: Shows answers from both models side-by-side with timing information

## Tips for Best Results

- Select a region that fully contains the trivia question text
- Ensure good contrast and readability in the selected area
- Wait for the question to be fully visible before taking a screenshot
- The AI works best with clear, well-lit text

## Troubleshooting

**"mss library not available" warning:**
- The app will still work using PIL's ImageGrab as a fallback
- For better performance, install mss: `pip install mss`

**"google-generativeai library not available" warning:**
- Gemini support won't be available
- Install it: `pip install google-generativeai`
- The app will still work with OpenAI only

**"API Keys Missing" error:**
- Click the **⚙️ Settings** button and go to the **🔑 API Keys** tab
- Enter at least one API key (OpenAI or Gemini)
- Use the **🧪 Test Connection** button to verify your key works
- Click **💾 Save Settings**

**Only one AI model showing results:**
- Open **⚙️ Settings** → **🔑 API Keys** tab
- Make sure both API keys are entered correctly
- Test each connection using the test buttons
- Verify google-generativeai is installed: `pip install google-generativeai`
- Check the terminal output for any error messages

**Wrong model being used:**
- Open **⚙️ Settings** → **🤖 Models** tab
- Select your preferred models from the dropdowns
- Click **💾 Save Settings**

**Want to customize AI responses:**
- Open **⚙️ Settings** → **💬 Prompt** tab
- Try the quick templates or write your own custom prompt
- Click **💾 Save Settings**

**Region selection not working:**
- Make sure you have proper display permissions on your system
- On macOS, you may need to grant screen recording permissions

**Want to adjust the selected region:**
- Simply click "📐 Select Region" again
- Your current region will appear with handles
- Drag to move, drag handles to resize
- Click "✓ Confirm Selection" to save changes

**Region too small error:**
- The minimum region size is 20x20 pixels
- Draw a larger selection area

### macOS Specific Troubleshooting

**Black or blank screenshots on Mac:**
- This usually means screen recording permission is not granted
- Go to System Settings > Privacy & Security > Screen Recording
- Enable Python or Terminal
- **Important:** Restart your terminal completely after granting permission

**Retina display issues (coordinates off):**
- The app now automatically handles Retina scaling
- If you see mismatched coordinates, check the terminal output for scale factor detection
- The app converts logical pixels (UI) to physical pixels (screenshots) automatically

**Fullscreen selector not appearing:**
- Press Cmd+Tab to ensure the selector window is in focus
- Check if Mission Control or other features are interfering
- Try clicking on the app in the Dock

**Multiple monitors on Mac:**
- The app detects all monitors automatically
- Make sure to select a region on your primary display for best results
- If using external monitors, the coordinates should work correctly

## Performance

With parallel processing, you get the best of both worlds:

| Model | Typical Response Time | Cost per 1K tokens |
|-------|----------------------|-------------------|
| OpenAI gpt-4o-mini | 1-3 seconds | $0.00015 input, $0.0006 output |
| Gemini 2.0 Flash | 0.5-2 seconds | Free tier available, then $0.000075 input, $0.0003 output |

**Parallel execution means you wait for the slowest response time, not the sum of both!**

## Contributing

Contributions are welcome! Feel free to:
- Fork this repository
- Create a feature branch
- Submit a pull request

Ideas for improvements:
- Add keyboard shortcuts for quick screenshot capture
- Support for multiple saved regions
- History of captured questions and answers with comparison
- Export answers to CSV/JSON
- Add more AI models (Claude, Llama, etc.)
- Confidence scoring and consensus from multiple models
- Automatic retry on API failures

## Disclaimer

This tool is intended for educational and entertainment purposes. Please use responsibly and ethically:
- Respect the rules of any trivia games or competitions
- Ensure you have proper permissions for screen capture
- Follow OpenAI's usage policies and guidelines

## License

This project is open source. Feel free to use and modify as needed.

## Credits

Built with:
- [OpenAI GPT-4o-mini](https://openai.com/) - Fast vision model
- [Google Gemini 2.0 Flash](https://ai.google.dev/) - Ultra-fast multimodal AI
- [Pillow](https://python-pillow.org/) - Image processing
- [mss](https://python-mss.readthedocs.io/) - Fast screenshots
- [Tkinter](https://docs.python.org/3/library/tkinter.html) - GUI framework
- Python's `concurrent.futures` - Parallel execution
