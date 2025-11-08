# TriviaVision AI - Desktop Trivia Screenshot Assistant

TriviaVision AI is a revolutionary Python desktop application that captures screenshots of trivia questions from your screen and uses **parallel AI processing** with both OpenAI and Google Gemini to provide instant answers with multiple perspectives.

## Features

- **🚀 Parallel AI Processing**: Queries both OpenAI and Google Gemini simultaneously for ultra-fast results
- **🤖 Dual AI Models**: Uses OpenAI's `gpt-4o-mini` and Google's `gemini-2.0-flash-exp` for best speed and accuracy
- **📸 Desktop Screenshot Capture**: Monitor any region of your screen for trivia questions
- **🎯 Interactive Region Selection**: Click and drag to select the area where trivia questions appear
- **👁️ Live Preview**: Real-time preview of the selected screen region (updates every second)
- **💻 Modern GUI Interface**: User-friendly Tkinter-based interface with side-by-side AI response comparison
- **⚡ Ultra-Fast Response**: Parallel execution means you get answers in the time it takes for the slowest API
- **💾 Configuration Persistence**: Saves your selected region for future sessions
- **📊 Performance Tracking**: Monitors and displays response time for each AI model
- **🔧 Flexible Setup**: Works with one or both AI providers

## Installation

### Prerequisites
- Python 3.7 or higher
- At least one API key (both recommended for parallel processing):
  - **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))
  - **Google Gemini API key** ([Get one here](https://aistudio.google.com/app/apikey))

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

3. Set your API keys (choose one or both):

   **Method 1: Environment Variables (Recommended)**
   ```bash
   # For OpenAI (required for OpenAI support)
   export OPENAI_API_KEY='your-openai-api-key-here'

   # For Gemini (required for Gemini support)
   export GEMINI_API_KEY='your-gemini-api-key-here'
   ```

   **Method 2: Edit the code**
   Open `TriviaCaptureAI.py` and replace the placeholder values on lines 28-29.

   **Note**: You can use just one API or both. The app will automatically detect which APIs are configured and use them accordingly.

## Usage

1. **Start the application:**
```bash
python TriviaCaptureAI.py
```

2. **Select a region:**
   - Click the "📐 Select Region" button
   - Your screen will dim with a semi-transparent overlay
   - Click and drag to draw a rectangle around the area where trivia questions appear
   - Release to confirm the selection
   - Press ESC to cancel

3. **Monitor and capture:**
   - The app will show a live preview of your selected region
   - When a trivia question appears, click "📸 Take Screenshot & Analyze"
   - Watch as both AI models analyze the image **in parallel**
   - See responses from both OpenAI and Gemini side-by-side with timing information
   - Compare answers from both models for better accuracy

4. **Screenshots are automatically saved** to the `captured_images/` directory with timestamps

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

## Configuration

The application saves your selected region to `trivia_config.json` automatically. This means you only need to select the region once, and it will be remembered in future sessions.

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
- Make sure you've set at least one API key as an environment variable
- OpenAI: `export OPENAI_API_KEY='your-key'`
- Gemini: `export GEMINI_API_KEY='your-key'`
- Or edit lines 28-29 in `TriviaCaptureAI.py`

**Only one AI model showing results:**
- Check that both API keys are correctly set
- Verify the library is installed: `pip install google-generativeai`
- Check the terminal output for any error messages

**Region selection not working:**
- Make sure you have proper display permissions on your system
- On macOS, you may need to grant screen recording permissions

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
