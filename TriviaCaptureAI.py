import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk, ImageGrab
import base64
import requests
import time
import os
import json
from io import BytesIO
import threading

try:
    from mss import mss
    MSS_AVAILABLE = True
except ImportError:
    MSS_AVAILABLE = False
    print("Warning: mss library not available. Install with: pip install mss")

CONFIG_FILE = "trivia_config.json"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY")


class RegionSelector:
    """Interactive region selector for choosing screen area to monitor"""

    def __init__(self, callback):
        self.callback = callback
        self.start_x = None
        self.start_y = None
        self.rect = None
        self.region = None

    def select_region(self):
        """Open fullscreen transparent window to select region"""
        self.root = tk.Tk()
        self.root.attributes('-fullscreen', True)
        self.root.attributes('-alpha', 0.3)
        self.root.configure(bg='black')

        self.canvas = tk.Canvas(self.root, cursor="cross", bg='grey', highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        instruction = tk.Label(
            self.root,
            text="Click and drag to select the region for trivia questions. Press ESC to cancel.",
            font=('Arial', 16, 'bold'),
            bg='black',
            fg='white'
        )
        instruction.place(relx=0.5, rely=0.05, anchor='center')

        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_release)
        self.root.bind("<Escape>", lambda e: self.root.destroy())

        self.root.mainloop()

    def on_press(self, event):
        self.start_x = event.x
        self.start_y = event.y
        if self.rect:
            self.canvas.delete(self.rect)
        self.rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y,
            outline='red', width=3
        )

    def on_drag(self, event):
        cur_x, cur_y = event.x, event.y
        self.canvas.coords(self.rect, self.start_x, self.start_y, cur_x, cur_y)

    def on_release(self, event):
        end_x, end_y = event.x, event.y

        x1 = min(self.start_x, end_x)
        y1 = min(self.start_y, end_y)
        x2 = max(self.start_x, end_x)
        y2 = max(self.start_y, end_y)

        self.region = {
            'top': y1,
            'left': x1,
            'width': x2 - x1,
            'height': y2 - y1
        }

        self.root.destroy()
        if self.callback:
            self.callback(self.region)


class TriviaVisionAI:
    """Main application for desktop trivia screenshot AI"""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("TriviaVision AI - Desktop Trivia Helper")
        self.root.geometry("800x700")
        self.root.configure(bg='#2c3e50')

        self.region = None
        self.preview_running = False
        self.preview_image_label = None

        self.load_config()
        self.setup_ui()

        if self.region:
            self.start_preview()

    def load_config(self):
        """Load saved region configuration"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self.region = config.get('region')
                    print(f"Loaded saved region: {self.region}")
            except Exception as e:
                print(f"Error loading config: {e}")

    def save_config(self):
        """Save region configuration"""
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump({'region': self.region}, f)
            print("Region configuration saved")
        except Exception as e:
            print(f"Error saving config: {e}")

    def setup_ui(self):
        """Setup the user interface"""

        # Title
        title_frame = tk.Frame(self.root, bg='#34495e', pady=15)
        title_frame.pack(fill=tk.X)

        title_label = tk.Label(
            title_frame,
            text="🎯 TriviaVision AI",
            font=('Arial', 24, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        )
        title_label.pack()

        subtitle_label = tk.Label(
            title_frame,
            text="Desktop Trivia Screenshot Assistant",
            font=('Arial', 12),
            bg='#34495e',
            fg='#bdc3c7'
        )
        subtitle_label.pack()

        # Preview Frame
        preview_frame = tk.LabelFrame(
            self.root,
            text="Live Preview of Selected Region",
            font=('Arial', 12, 'bold'),
            bg='#34495e',
            fg='#ecf0f1',
            padx=10,
            pady=10
        )
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        self.preview_image_label = tk.Label(
            preview_frame,
            text="No region selected\n\nClick 'Select Region' to choose the area of your screen\nwhere trivia questions appear",
            font=('Arial', 14),
            bg='#2c3e50',
            fg='#95a5a6',
            width=60,
            height=15
        )
        self.preview_image_label.pack(expand=True)

        # Status Frame
        status_frame = tk.LabelFrame(
            self.root,
            text="AI Response",
            font=('Arial', 12, 'bold'),
            bg='#34495e',
            fg='#ecf0f1',
            padx=10,
            pady=10
        )
        status_frame.pack(fill=tk.BOTH, padx=20, pady=10)

        self.status_text = tk.Text(
            status_frame,
            height=6,
            font=('Arial', 11),
            bg='#1e2a38',
            fg='#ecf0f1',
            wrap=tk.WORD,
            state='disabled'
        )
        self.status_text.pack(fill=tk.BOTH, expand=True)

        # Control Buttons Frame
        button_frame = tk.Frame(self.root, bg='#2c3e50', pady=10)
        button_frame.pack(fill=tk.X, padx=20)

        # Select Region Button
        self.select_button = tk.Button(
            button_frame,
            text="📐 Select Region",
            command=self.select_region,
            font=('Arial', 12, 'bold'),
            bg='#3498db',
            fg='white',
            padx=20,
            pady=10,
            cursor='hand2'
        )
        self.select_button.pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)

        # Take Screenshot Button
        self.screenshot_button = tk.Button(
            button_frame,
            text="📸 Take Screenshot & Analyze",
            command=self.take_screenshot,
            font=('Arial', 12, 'bold'),
            bg='#27ae60',
            fg='white',
            padx=20,
            pady=10,
            cursor='hand2',
            state='disabled' if not self.region else 'normal'
        )
        self.screenshot_button.pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)

        # Region Info Label
        self.region_info_label = tk.Label(
            self.root,
            text=self.get_region_info_text(),
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#95a5a6'
        )
        self.region_info_label.pack(pady=5)

    def get_region_info_text(self):
        """Get region info text for display"""
        if self.region:
            return f"Region: {self.region['width']}x{self.region['height']} at ({self.region['left']}, {self.region['top']})"
        return "No region selected"

    def select_region(self):
        """Handle region selection button click"""
        self.update_status("Please select a region on your screen...")

        def region_selected(region):
            self.region = region
            self.save_config()
            self.region_info_label.config(text=self.get_region_info_text())
            self.screenshot_button.config(state='normal')
            self.update_status(f"Region selected: {region['width']}x{region['height']} pixels")
            self.start_preview()

        selector = RegionSelector(region_selected)
        self.root.after(100, selector.select_region)

    def start_preview(self):
        """Start live preview of selected region"""
        if not self.region:
            return

        self.preview_running = True
        self.update_preview()

    def update_preview(self):
        """Update the preview image"""
        if not self.preview_running or not self.region:
            return

        try:
            screenshot = self.capture_region(self.region)

            # Resize for preview (maintain aspect ratio)
            preview_width = 600
            aspect_ratio = screenshot.height / screenshot.width
            preview_height = int(preview_width * aspect_ratio)

            screenshot_resized = screenshot.resize((preview_width, preview_height), Image.Resampling.LANCZOS)

            photo = ImageTk.PhotoImage(screenshot_resized)
            self.preview_image_label.config(image=photo, text="")
            self.preview_image_label.image = photo

        except Exception as e:
            print(f"Preview error: {e}")

        # Update every 1000ms (1 second)
        self.root.after(1000, self.update_preview)

    def capture_region(self, region):
        """Capture screenshot of specified region"""
        if MSS_AVAILABLE:
            # Use mss for faster capture
            with mss() as sct:
                monitor = {
                    'top': region['top'],
                    'left': region['left'],
                    'width': region['width'],
                    'height': region['height']
                }
                screenshot = sct.grab(monitor)
                return Image.frombytes('RGB', screenshot.size, screenshot.rgb)
        else:
            # Fallback to PIL ImageGrab
            bbox = (
                region['left'],
                region['top'],
                region['left'] + region['width'],
                region['top'] + region['height']
            )
            return ImageGrab.grab(bbox=bbox)

    def update_status(self, message):
        """Update status text display"""
        self.status_text.config(state='normal')
        self.status_text.delete(1.0, tk.END)
        self.status_text.insert(1.0, message)
        self.status_text.config(state='disabled')

    def take_screenshot(self):
        """Take screenshot and analyze with AI"""
        if not self.region:
            messagebox.showwarning("No Region", "Please select a region first!")
            return

        if OPENAI_API_KEY == "YOUR_API_KEY" or not OPENAI_API_KEY:
            messagebox.showerror(
                "API Key Missing",
                "Please set your OpenAI API key:\n\n"
                "1. Set environment variable: OPENAI_API_KEY\n"
                "2. Or edit the code to add your API key"
            )
            return

        self.update_status("📸 Taking screenshot...\n\nPlease wait...")
        self.screenshot_button.config(state='disabled')

        # Run analysis in background thread to keep UI responsive
        thread = threading.Thread(target=self.analyze_screenshot)
        thread.daemon = True
        thread.start()

    def analyze_screenshot(self):
        """Capture and analyze screenshot with AI"""
        try:
            # Capture screenshot
            screenshot = self.capture_region(self.region)

            # Save screenshot
            save_dir = "captured_images"
            os.makedirs(save_dir, exist_ok=True)

            timestamp = time.strftime("%Y%m%d_%H%M%S")
            screenshot_path = os.path.join(save_dir, f"trivia_screenshot_{timestamp}.png")
            screenshot.save(screenshot_path, optimize=True, quality=85)

            self.root.after(0, self.update_status, f"📸 Screenshot saved to {screenshot_path}\n\n🤖 Analyzing with AI...")

            # Analyze with AI
            response_text = self.analyze_image_with_ai(screenshot)

            # Update UI with response
            self.root.after(0, self.update_status, f"✅ AI Response:\n\n{response_text}")

        except Exception as e:
            error_msg = f"❌ Error: {str(e)}"
            self.root.after(0, self.update_status, error_msg)
            print(f"Analysis error: {e}")

        finally:
            self.root.after(0, lambda: self.screenshot_button.config(state='normal'))

    def analyze_image_with_ai(self, image):
        """Send image to OpenAI GPT-4 Vision API for analysis"""

        # Convert image to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        payload = {
            "model": "gpt-4o",  # Updated to latest vision model
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "This image contains a trivia question. Please read the question carefully and provide the correct answer. Be concise and direct."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 500
        }

        start_time = time.time()
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        duration = time.time() - start_time

        print(f"API response received in {duration:.2f} seconds")

        response_json = response.json()

        if 'choices' in response_json and len(response_json['choices']) > 0:
            content = response_json['choices'][0].get('message', {}).get('content', 'No answer found')
            return content
        else:
            error_msg = response_json.get('error', {}).get('message', 'Unknown error')
            return f"Error: {error_msg}"

    def run(self):
        """Start the application"""
        self.root.mainloop()


def main():
    """Main entry point"""
    print("=" * 60)
    print("TriviaVision AI - Desktop Trivia Screenshot Assistant")
    print("=" * 60)
    print()

    if not MSS_AVAILABLE:
        print("⚠️  Warning: 'mss' library not found. Install for better performance:")
        print("   pip install mss")
        print()

    if OPENAI_API_KEY == "YOUR_API_KEY":
        print("⚠️  Warning: OpenAI API key not set!")
        print("   Set environment variable: export OPENAI_API_KEY='your-key-here'")
        print()

    app = TriviaVisionAI()
    app.run()


if __name__ == "__main__":
    main()
