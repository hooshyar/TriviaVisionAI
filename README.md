# TriviaVision AI - Desktop Trivia Screenshot Assistant

TriviaVision AI is a revolutionary Python desktop application that captures screenshots of trivia questions from your screen and uses OpenAI's GPT-4 Vision AI to provide instant answers.

## Features

- **Desktop Screenshot Capture**: Monitor any region of your screen for trivia questions
- **Interactive Region Selection**: Click and drag to select the area where trivia questions appear
- **Live Preview**: Real-time preview of the selected screen region (updates every second)
- **GUI Interface**: User-friendly Tkinter-based interface with intuitive buttons
- **AI-Powered Analysis**: Leverages OpenAI's GPT-4o Vision model for accurate trivia answers
- **Configuration Persistence**: Saves your selected region for future sessions
- **Fast Performance**: Uses `mss` library for optimized screenshot capture
- **Response Tracking**: Monitors and reports AI response time

## Installation

### Prerequisites
- Python 3.7 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

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

3. Set your OpenAI API key (choose one method):

   **Method 1: Environment Variable (Recommended)**
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

   **Method 2: Edit the code**
   Open `TriviaCaptureAI.py` and replace `YOUR_API_KEY` on line 20 with your actual API key.

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
   - Wait a few seconds for the AI to analyze the image
   - The answer will appear in the "AI Response" section

4. **Screenshots are automatically saved** to the `captured_images/` directory with timestamps

## Dependencies

- **Pillow**: Image processing and manipulation
- **requests**: HTTP client for OpenAI API calls
- **mss**: Fast cross-platform screenshot library (optional but recommended)
- **tkinter**: GUI framework (usually included with Python)

## Configuration

The application saves your selected region to `trivia_config.json` automatically. This means you only need to select the region once, and it will be remembered in future sessions.

## How It Works

1. **Region Selection**: Uses a fullscreen transparent Tkinter overlay to let you select any area of your screen
2. **Live Monitoring**: Continuously captures screenshots of the selected region every second for preview
3. **Screenshot Capture**: On button click, captures the current frame from the selected region
4. **AI Analysis**: Sends the screenshot to OpenAI's GPT-4o Vision model with an optimized prompt
5. **Response Display**: Shows the AI's answer in the application window

## Tips for Best Results

- Select a region that fully contains the trivia question text
- Ensure good contrast and readability in the selected area
- Wait for the question to be fully visible before taking a screenshot
- The AI works best with clear, well-lit text

## Troubleshooting

**"mss library not available" warning:**
- The app will still work using PIL's ImageGrab as a fallback
- For better performance, install mss: `pip install mss`

**"API Key Missing" error:**
- Make sure you've set the OPENAI_API_KEY environment variable
- Or edit line 20 in `TriviaCaptureAI.py` to include your key

**Region selection not working:**
- Make sure you have proper display permissions on your system
- On macOS, you may need to grant screen recording permissions

## Contributing

Contributions are welcome! Feel free to:
- Fork this repository
- Create a feature branch
- Submit a pull request

Ideas for improvements:
- Add keyboard shortcuts for quick screenshot capture
- Support for multiple saved regions
- History of captured questions and answers
- Export answers to a file
- Integration with other AI models

## Disclaimer

This tool is intended for educational and entertainment purposes. Please use responsibly and ethically:
- Respect the rules of any trivia games or competitions
- Ensure you have proper permissions for screen capture
- Follow OpenAI's usage policies and guidelines

## License

This project is open source. Feel free to use and modify as needed.

## Credits

Built with:
- [OpenAI GPT-4o Vision](https://openai.com/)
- [Pillow](https://python-pillow.org/)
- [mss](https://python-mss.readthedocs.io/)
- [Tkinter](https://docs.python.org/3/library/tkinter.html)
