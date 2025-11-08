import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk, ImageGrab
import base64
import requests
import time
import os
import json
import sys
import platform
from io import BytesIO
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from mss import mss
    MSS_AVAILABLE = True
except ImportError:
    MSS_AVAILABLE = False
    print("Warning: mss library not available. Install with: pip install mss")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai library not available. Install with: pip install google-generativeai")

# Detect platform
IS_MAC = platform.system() == 'Darwin'
IS_WINDOWS = platform.system() == 'Windows'
IS_LINUX = platform.system() == 'Linux'

CONFIG_FILE = "trivia_config.json"

# Default values
DEFAULT_CONFIG = {
    "api_keys": {
        "openai": os.environ.get("OPENAI_API_KEY", ""),
        "gemini": os.environ.get("GEMINI_API_KEY", "")
    },
    "models": {
        "openai_model": "gpt-4o-mini",
        "gemini_model": "gemini-2.0-flash-exp"
    },
    "prompt": "This image contains a trivia question. Please read the question carefully and provide the correct answer. Be concise and direct with your answer.",
    "region": None
}

# Available models
OPENAI_MODELS = [
    "gpt-4o",           # Latest full model (best quality)
    "gpt-4o-mini",      # Fast and cheap (recommended)
    "gpt-4-turbo",      # Previous generation
    "gpt-4"             # Original GPT-4
]

GEMINI_MODELS = [
    "gemini-2.0-flash-exp",      # Latest experimental flash (fastest)
    "gemini-1.5-flash",          # Stable flash model
    "gemini-1.5-flash-8b",       # Smaller, faster
    "gemini-1.5-pro",            # Pro model (best quality)
]


def get_screen_scale_factor():
    """Get the screen scale factor for Retina/HiDPI displays"""
    try:
        if IS_MAC and MSS_AVAILABLE:
            # On macOS, compare tkinter's logical pixels with mss's physical pixels
            temp_root = tk.Tk()
            temp_root.withdraw()

            # Get logical screen dimensions from tkinter
            logical_width = temp_root.winfo_screenwidth()
            logical_height = temp_root.winfo_screenheight()
            temp_root.destroy()

            # Get physical pixel dimensions from mss
            with mss() as sct:
                monitor = sct.monitors[1]  # Primary monitor (index 0 is all monitors)
                physical_width = monitor['width']
                physical_height = monitor['height']

            # Calculate scale factor (usually 1.0 or 2.0 on Mac)
            scale_width = physical_width / logical_width
            scale_height = physical_height / logical_height

            # Use the average and round to nearest integer
            scale_factor = round((scale_width + scale_height) / 2)

            print(f"Detected screen: {logical_width}x{logical_height} logical, {physical_width}x{physical_height} physical")
            return max(1, scale_factor)
        elif IS_MAC:
            # Fallback for macOS without mss - assume Retina
            print("Warning: mss not available, assuming 2x Retina display")
            return 2
        else:
            # Windows/Linux - no scaling for now
            return 1
    except Exception as e:
        print(f"Could not detect scale factor: {e}")
        if IS_MAC:
            return 2  # Safe default for macOS
        return 1


def check_macos_permissions():
    """Check if screen recording permissions are granted on macOS"""
    if not IS_MAC:
        return True

    try:
        # Try to take a small screenshot to test permissions
        if MSS_AVAILABLE:
            with mss() as sct:
                test_capture = sct.grab(sct.monitors[0])
                # Check if we got actual pixel data (not all black)
                # This is a basic check - permissions denied usually results in black screens
                return test_capture.size[0] > 0 and test_capture.size[1] > 0
        else:
            # Fallback to ImageGrab test
            test_img = ImageGrab.grab(bbox=(0, 0, 100, 100))
            return test_img is not None
    except Exception as e:
        print(f"Permission check failed: {e}")
        return False


def show_macos_permission_help():
    """Show help dialog for macOS screen recording permissions"""
    help_text = """macOS Screen Recording Permission Required

To capture screenshots, you need to grant permission:

1. Open System Preferences/System Settings
2. Go to Security & Privacy (or Privacy & Security)
3. Click on 'Screen Recording' in the left sidebar
4. Check the box next to Python or Terminal
5. Restart this application

Note: You may need to click the lock icon to make changes.

After granting permission, please restart the app."""

    messagebox.showwarning("Permission Required", help_text)


class SettingsDialog:
    """Settings dialog for configuring API keys, models, and prompts"""

    def __init__(self, parent, config):
        self.parent = parent
        self.config = config.copy()
        self.result = None

        self.dialog = tk.Toplevel(parent)
        self.dialog.title("⚙️ Settings")
        self.dialog.geometry("700x650")
        self.dialog.configure(bg='#2c3e50')
        self.dialog.transient(parent)
        self.dialog.grab_set()

        self.setup_ui()

    def setup_ui(self):
        """Setup the settings UI"""

        # Create notebook for tabs
        style = ttk.Style()
        style.theme_use('default')
        style.configure('TNotebook', background='#2c3e50', borderwidth=0)
        style.configure('TNotebook.Tab', padding=[20, 10], background='#34495e', foreground='white')
        style.map('TNotebook.Tab', background=[('selected', '#1abc9c')])

        notebook = ttk.Notebook(self.dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # API Keys Tab
        api_frame = tk.Frame(notebook, bg='#34495e', padx=20, pady=20)
        notebook.add(api_frame, text='🔑 API Keys')
        self.setup_api_tab(api_frame)

        # Models Tab
        models_frame = tk.Frame(notebook, bg='#34495e', padx=20, pady=20)
        notebook.add(models_frame, text='🤖 Models')
        self.setup_models_tab(models_frame)

        # Prompt Tab
        prompt_frame = tk.Frame(notebook, bg='#34495e', padx=20, pady=20)
        notebook.add(prompt_frame, text='💬 Prompt')
        self.setup_prompt_tab(prompt_frame)

        # Buttons at bottom
        button_frame = tk.Frame(self.dialog, bg='#2c3e50', pady=10)
        button_frame.pack(fill=tk.X, padx=10)

        tk.Button(
            button_frame,
            text="💾 Save Settings",
            command=self.save_settings,
            font=('Arial', 12, 'bold'),
            bg='#27ae60',
            fg='white',
            padx=20,
            pady=10,
            cursor='hand2'
        ).pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)

        tk.Button(
            button_frame,
            text="❌ Cancel",
            command=self.dialog.destroy,
            font=('Arial', 12, 'bold'),
            bg='#e74c3c',
            fg='white',
            padx=20,
            pady=10,
            cursor='hand2'
        ).pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)

    def setup_api_tab(self, parent):
        """Setup API keys configuration tab"""

        tk.Label(
            parent,
            text="Configure your AI API keys",
            font=('Arial', 14, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        ).pack(pady=(0, 20))

        # OpenAI API Key
        openai_frame = tk.LabelFrame(
            parent,
            text="OpenAI API Key",
            font=('Arial', 11, 'bold'),
            bg='#2c3e50',
            fg='#10a37f',
            padx=15,
            pady=15
        )
        openai_frame.pack(fill=tk.X, pady=10)

        tk.Label(
            openai_frame,
            text="Get your key from: https://platform.openai.com/api-keys",
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#95a5a6'
        ).pack(anchor='w')

        self.openai_key_var = tk.StringVar(value=self.config.get('api_keys', {}).get('openai', ''))
        openai_entry = tk.Entry(
            openai_frame,
            textvariable=self.openai_key_var,
            font=('Arial', 10),
            bg='#1e2a38',
            fg='#ecf0f1',
            insertbackground='white',
            show='•',
            relief=tk.FLAT
        )
        openai_entry.pack(fill=tk.X, pady=(5, 10), ipady=8)

        tk.Button(
            openai_frame,
            text="👁️ Show/Hide",
            command=lambda: self.toggle_visibility(openai_entry),
            font=('Arial', 9),
            bg='#3498db',
            fg='white',
            cursor='hand2'
        ).pack(side=tk.LEFT)

        tk.Button(
            openai_frame,
            text="🧪 Test Connection",
            command=lambda: self.test_openai_connection(),
            font=('Arial', 9),
            bg='#9b59b6',
            fg='white',
            cursor='hand2'
        ).pack(side=tk.LEFT, padx=5)

        # Gemini API Key
        gemini_frame = tk.LabelFrame(
            parent,
            text="Google Gemini API Key",
            font=('Arial', 11, 'bold'),
            bg='#2c3e50',
            fg='#4285f4',
            padx=15,
            pady=15
        )
        gemini_frame.pack(fill=tk.X, pady=10)

        tk.Label(
            gemini_frame,
            text="Get your key from: https://aistudio.google.com/app/apikey",
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#95a5a6'
        ).pack(anchor='w')

        self.gemini_key_var = tk.StringVar(value=self.config.get('api_keys', {}).get('gemini', ''))
        gemini_entry = tk.Entry(
            gemini_frame,
            textvariable=self.gemini_key_var,
            font=('Arial', 10),
            bg='#1e2a38',
            fg='#ecf0f1',
            insertbackground='white',
            show='•',
            relief=tk.FLAT
        )
        gemini_entry.pack(fill=tk.X, pady=(5, 10), ipady=8)

        tk.Button(
            gemini_frame,
            text="👁️ Show/Hide",
            command=lambda: self.toggle_visibility(gemini_entry),
            font=('Arial', 9),
            bg='#3498db',
            fg='white',
            cursor='hand2'
        ).pack(side=tk.LEFT)

        tk.Button(
            gemini_frame,
            text="🧪 Test Connection",
            command=lambda: self.test_gemini_connection(),
            font=('Arial', 9),
            bg='#9b59b6',
            fg='white',
            cursor='hand2'
        ).pack(side=tk.LEFT, padx=5)

    def setup_models_tab(self, parent):
        """Setup models selection tab"""

        tk.Label(
            parent,
            text="Select AI models for analysis",
            font=('Arial', 14, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        ).pack(pady=(0, 20))

        # OpenAI Model Selection
        openai_frame = tk.LabelFrame(
            parent,
            text="OpenAI Model",
            font=('Arial', 11, 'bold'),
            bg='#2c3e50',
            fg='#10a37f',
            padx=15,
            pady=15
        )
        openai_frame.pack(fill=tk.X, pady=10)

        tk.Label(
            openai_frame,
            text="Recommended: gpt-4o-mini (fast and cheap)",
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#95a5a6'
        ).pack(anchor='w')

        self.openai_model_var = tk.StringVar(value=self.config.get('models', {}).get('openai_model', 'gpt-4o-mini'))
        openai_combo = ttk.Combobox(
            openai_frame,
            textvariable=self.openai_model_var,
            values=OPENAI_MODELS,
            state='readonly',
            font=('Arial', 10)
        )
        openai_combo.pack(fill=tk.X, pady=5)

        # Gemini Model Selection
        gemini_frame = tk.LabelFrame(
            parent,
            text="Gemini Model",
            font=('Arial', 11, 'bold'),
            bg='#2c3e50',
            fg='#4285f4',
            padx=15,
            pady=15
        )
        gemini_frame.pack(fill=tk.X, pady=10)

        tk.Label(
            gemini_frame,
            text="Recommended: gemini-2.0-flash-exp (fastest experimental)",
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#95a5a6'
        ).pack(anchor='w')

        self.gemini_model_var = tk.StringVar(value=self.config.get('models', {}).get('gemini_model', 'gemini-2.0-flash-exp'))
        gemini_combo = ttk.Combobox(
            gemini_frame,
            textvariable=self.gemini_model_var,
            values=GEMINI_MODELS,
            state='readonly',
            font=('Arial', 10)
        )
        gemini_combo.pack(fill=tk.X, pady=5)

        # Model comparison info
        info_frame = tk.Frame(parent, bg='#2c3e50', pady=10)
        info_frame.pack(fill=tk.X, pady=20)

        tk.Label(
            info_frame,
            text="💡 Model Comparison:",
            font=('Arial', 10, 'bold'),
            bg='#2c3e50',
            fg='#f39c12'
        ).pack(anchor='w')

        comparison_text = """
• gpt-4o: Best quality, slower, more expensive
• gpt-4o-mini: Great balance of speed/quality (Recommended)
• gemini-2.0-flash-exp: Experimental, fastest, latest features
• gemini-1.5-pro: Best Gemini quality, slower
        """

        tk.Label(
            info_frame,
            text=comparison_text,
            font=('Arial', 9),
            bg='#2c3e50',
            fg='#bdc3c7',
            justify=tk.LEFT
        ).pack(anchor='w', padx=10)

    def setup_prompt_tab(self, parent):
        """Setup prompt customization tab"""

        tk.Label(
            parent,
            text="Customize the AI prompt for better results",
            font=('Arial', 14, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        ).pack(pady=(0, 20))

        tk.Label(
            parent,
            text="This prompt is sent to both AI models along with the screenshot:",
            font=('Arial', 10),
            bg='#34495e',
            fg='#95a5a6'
        ).pack(anchor='w', pady=(0, 10))

        # Prompt text area
        prompt_frame = tk.Frame(parent, bg='#2c3e50', relief=tk.SOLID, borderwidth=1)
        prompt_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.prompt_text = tk.Text(
            prompt_frame,
            font=('Arial', 10),
            bg='#1e2a38',
            fg='#ecf0f1',
            insertbackground='white',
            wrap=tk.WORD,
            relief=tk.FLAT,
            padx=10,
            pady=10
        )
        self.prompt_text.pack(fill=tk.BOTH, expand=True)
        self.prompt_text.insert(1.0, self.config.get('prompt', DEFAULT_CONFIG['prompt']))

        # Quick templates
        tk.Label(
            parent,
            text="Quick Templates:",
            font=('Arial', 10, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        ).pack(anchor='w', pady=(10, 5))

        templates_frame = tk.Frame(parent, bg='#34495e')
        templates_frame.pack(fill=tk.X)

        templates = [
            ("Default", DEFAULT_CONFIG['prompt']),
            ("Detailed", "This image shows a trivia question. Please analyze the question carefully, consider all options if present, and provide the most accurate answer with a brief explanation."),
            ("Quick", "Read this trivia question and give me the answer only. Be brief."),
        ]

        for name, template in templates:
            tk.Button(
                templates_frame,
                text=name,
                command=lambda t=template: self.set_prompt(t),
                font=('Arial', 9),
                bg='#3498db',
                fg='white',
                cursor='hand2',
                padx=10,
                pady=5
            ).pack(side=tk.LEFT, padx=2)

    def toggle_visibility(self, entry):
        """Toggle password visibility"""
        current_show = entry.cget('show')
        entry.config(show='' if current_show else '•')

    def set_prompt(self, template):
        """Set prompt from template"""
        self.prompt_text.delete(1.0, tk.END)
        self.prompt_text.insert(1.0, template)

    def test_openai_connection(self):
        """Test OpenAI API connection"""
        api_key = self.openai_key_var.get().strip()
        if not api_key:
            messagebox.showwarning("No API Key", "Please enter an OpenAI API key first.")
            return

        messagebox.showinfo("Testing", "Testing OpenAI connection...\n(This may take a few seconds)")

        # Simple test request
        try:
            headers = {
                "Authorization": f"Bearer {api_key}"
            }
            response = requests.get(
                "https://api.openai.com/v1/models",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                messagebox.showinfo("Success", "✅ OpenAI API key is valid!")
            else:
                messagebox.showerror("Error", f"❌ Invalid API key or connection error\n\nStatus: {response.status_code}")
        except Exception as e:
            messagebox.showerror("Error", f"❌ Connection failed:\n\n{str(e)}")

    def test_gemini_connection(self):
        """Test Gemini API connection"""
        api_key = self.gemini_key_var.get().strip()
        if not api_key:
            messagebox.showwarning("No API Key", "Please enter a Gemini API key first.")
            return

        if not GEMINI_AVAILABLE:
            messagebox.showerror("Library Missing", "google-generativeai library not installed.\n\nInstall with: pip install google-generativeai")
            return

        messagebox.showinfo("Testing", "Testing Gemini connection...\n(This may take a few seconds)")

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Test")
            if response:
                messagebox.showinfo("Success", "✅ Gemini API key is valid!")
            else:
                messagebox.showerror("Error", "❌ Could not connect to Gemini")
        except Exception as e:
            messagebox.showerror("Error", f"❌ Connection failed:\n\n{str(e)}")

    def save_settings(self):
        """Save settings and close dialog"""
        self.result = {
            'api_keys': {
                'openai': self.openai_key_var.get().strip(),
                'gemini': self.gemini_key_var.get().strip()
            },
            'models': {
                'openai_model': self.openai_model_var.get(),
                'gemini_model': self.gemini_model_var.get()
            },
            'prompt': self.prompt_text.get(1.0, tk.END).strip(),
            'region': self.config.get('region')
        }
        self.dialog.destroy()

    def show(self):
        """Show dialog and wait for result"""
        self.dialog.wait_window()
        return self.result


class RegionSelector:
    """Enhanced interactive region selector with dragging and resizing capabilities"""

    def __init__(self, callback, initial_region=None):
        self.callback = callback
        self.initial_region = initial_region
        self.region = None

        # Drawing state
        self.drawing = False
        self.start_x = None
        self.start_y = None

        # Adjustment state
        self.adjusting = False
        self.dragging = False
        self.resizing = False
        self.resize_handle = None
        self.drag_start_x = None
        self.drag_start_y = None

        # UI elements
        self.rect = None
        self.fill_rect = None
        self.handles = {}
        self.dimension_text = None
        self.instruction_label = None

        # Handle size
        self.handle_size = 10

        # Screen scale factor for Retina/HiDPI displays
        self.scale_factor = get_screen_scale_factor()
        print(f"Screen scale factor detected: {self.scale_factor}x")

    def select_region(self):
        """Open fullscreen window to select and adjust region"""
        self.root = tk.Tk()
        self.root.withdraw()  # Hide initially
        self.root.update_idletasks()

        # Get screen dimensions BEFORE going fullscreen
        self.screen_width = self.root.winfo_screenwidth()
        self.screen_height = self.root.winfo_screenheight()

        # Platform-specific fullscreen setup with more transparency for better visibility
        if IS_MAC:
            # macOS-specific fullscreen handling
            self.root.attributes('-fullscreen', True)
            self.root.attributes('-alpha', 0.15)  # More transparent on Mac
            # Ensure window is on top
            self.root.attributes('-topmost', True)
        else:
            # Windows/Linux fullscreen
            self.root.attributes('-fullscreen', True)
            self.root.attributes('-alpha', 0.2)  # More transparent
            self.root.attributes('-topmost', True)

        self.root.configure(bg='black')
        self.root.deiconify()  # Show the window

        self.canvas = tk.Canvas(self.root, cursor="cross", bg='grey', highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        # Instruction label - more helpful for seamless workflow
        self.instruction_label = tk.Label(
            self.root,
            text="Drag to select the trivia question area on your screen • ESC to cancel",
            font=('Arial', 14, 'bold'),
            bg='black',
            fg='#1abc9c'
        )
        self.instruction_label.place(relx=0.5, rely=0.05, anchor='center')

        # Control buttons (initially hidden)
        self.button_frame = tk.Frame(self.root, bg='#2c3e50')

        self.confirm_button = tk.Button(
            self.button_frame,
            text="✓ Confirm Selection",
            command=self.confirm_selection,
            font=('Arial', 14, 'bold'),
            bg='#27ae60',
            fg='white',
            padx=30,
            pady=15,
            cursor='hand2'
        )
        self.confirm_button.pack(side=tk.LEFT, padx=10)

        self.cancel_button = tk.Button(
            self.button_frame,
            text="✗ Cancel",
            command=self.cancel_selection,
            font=('Arial', 14, 'bold'),
            bg='#e74c3c',
            fg='white',
            padx=30,
            pady=15,
            cursor='hand2'
        )
        self.cancel_button.pack(side=tk.LEFT, padx=10)

        # If initial region provided, start in adjustment mode
        if self.initial_region:
            self.create_region_from_dict(self.initial_region)
            self.enter_adjustment_mode()
        else:
            # Bind drawing events
            self.canvas.bind("<ButtonPress-1>", self.on_draw_press)
            self.canvas.bind("<B1-Motion>", self.on_draw_drag)
            self.canvas.bind("<ButtonRelease-1>", self.on_draw_release)

        self.root.bind("<Escape>", lambda e: self.cancel_selection())

        self.root.mainloop()

    def create_region_from_dict(self, region_dict):
        """Create visual region from saved coordinates"""
        # Convert physical pixels back to logical pixels for display
        x1 = region_dict['left'] / self.scale_factor
        y1 = region_dict['top'] / self.scale_factor
        x2 = x1 + (region_dict['width'] / self.scale_factor)
        y2 = y1 + (region_dict['height'] / self.scale_factor)

        self.start_x = x1
        self.start_y = y1
        self.draw_region(x1, y1, x2, y2)

    def on_draw_press(self, event):
        """Handle mouse press during drawing phase"""
        self.drawing = True
        self.start_x = event.x
        self.start_y = event.y

        # Clear any existing selection
        if self.rect:
            self.canvas.delete(self.rect)
        if self.fill_rect:
            self.canvas.delete(self.fill_rect)

        # Create new rectangle
        self.rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y,
            outline='#1abc9c', width=3
        )
        self.fill_rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y,
            fill='#1abc9c', stipple='gray50', outline=''
        )

    def on_draw_drag(self, event):
        """Handle mouse drag during drawing phase"""
        if not self.drawing:
            return

        cur_x, cur_y = event.x, event.y
        self.canvas.coords(self.rect, self.start_x, self.start_y, cur_x, cur_y)
        self.canvas.coords(self.fill_rect, self.start_x, self.start_y, cur_x, cur_y)
        self.update_dimension_display(self.start_x, self.start_y, cur_x, cur_y)

    def on_draw_release(self, event):
        """Handle mouse release after drawing"""
        if not self.drawing:
            return

        self.drawing = False
        end_x, end_y = event.x, event.y

        # Ensure minimum size
        if abs(end_x - self.start_x) < 20 or abs(end_y - self.start_y) < 20:
            messagebox.showwarning("Region Too Small", "Please select a larger region (minimum 20x20 pixels)")
            self.canvas.delete(self.rect)
            self.canvas.delete(self.fill_rect)
            return

        # Normalize coordinates
        x1 = min(self.start_x, end_x)
        y1 = min(self.start_y, end_y)
        x2 = max(self.start_x, end_x)
        y2 = max(self.start_y, end_y)

        self.draw_region(x1, y1, x2, y2)
        self.enter_adjustment_mode()

    def draw_region(self, x1, y1, x2, y2):
        """Draw the selection region with handles"""
        # Update rectangle
        if not self.rect:
            self.rect = self.canvas.create_rectangle(
                x1, y1, x2, y2,
                outline='#1abc9c', width=3
            )
            self.fill_rect = self.canvas.create_rectangle(
                x1, y1, x2, y2,
                fill='#1abc9c', stipple='gray50', outline=''
            )
        else:
            self.canvas.coords(self.rect, x1, y1, x2, y2)
            self.canvas.coords(self.fill_rect, x1, y1, x2, y2)

        self.update_dimension_display(x1, y1, x2, y2)

    def enter_adjustment_mode(self):
        """Enter adjustment mode with dragging and resizing"""
        self.adjusting = True

        # Update instruction
        self.instruction_label.config(
            text="✓ Drag box to move • Drag corners to resize • Click 'Confirm' when ready",
            fg='#1abc9c',
            font=('Arial', 13, 'bold')
        )

        # Show buttons
        self.button_frame.place(relx=0.5, rely=0.95, anchor='center')

        # Unbind drawing events
        self.canvas.unbind("<ButtonPress-1>")
        self.canvas.unbind("<B1-Motion>")
        self.canvas.unbind("<ButtonRelease-1>")

        # Bind adjustment events
        self.canvas.bind("<ButtonPress-1>", self.on_adjust_press)
        self.canvas.bind("<B1-Motion>", self.on_adjust_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_adjust_release)
        self.canvas.bind("<Motion>", self.on_motion)

        # Draw handles
        self.update_handles()

    def update_handles(self):
        """Update resize handles positions"""
        if not self.rect:
            return

        coords = self.canvas.coords(self.rect)
        if len(coords) < 4:
            return

        x1, y1, x2, y2 = coords

        # Clear old handles
        for handle in self.handles.values():
            self.canvas.delete(handle)
        self.handles.clear()

        # Create handles at corners and edges
        handle_positions = {
            'nw': (x1, y1),
            'n': ((x1+x2)/2, y1),
            'ne': (x2, y1),
            'e': (x2, (y1+y2)/2),
            'se': (x2, y2),
            's': ((x1+x2)/2, y2),
            'sw': (x1, y2),
            'w': (x1, (y1+y2)/2)
        }

        for pos_name, (hx, hy) in handle_positions.items():
            handle = self.canvas.create_rectangle(
                hx - self.handle_size/2, hy - self.handle_size/2,
                hx + self.handle_size/2, hy + self.handle_size/2,
                fill='#1abc9c', outline='white', width=2
            )
            self.handles[pos_name] = handle

    def on_motion(self, event):
        """Update cursor based on position"""
        if self.dragging or self.resizing:
            return

        coords = self.canvas.coords(self.rect)
        if len(coords) < 4:
            return

        x1, y1, x2, y2 = coords
        x, y = event.x, event.y

        # Check if over a handle
        for pos_name, handle in self.handles.items():
            handle_coords = self.canvas.coords(handle)
            if (handle_coords[0] <= x <= handle_coords[2] and
                handle_coords[1] <= y <= handle_coords[3]):
                self.set_resize_cursor(pos_name)
                return

        # Check if inside region
        if x1 <= x <= x2 and y1 <= y <= y2:
            self.canvas.config(cursor="fleur")  # Move cursor
        else:
            self.canvas.config(cursor="cross")

    def set_resize_cursor(self, handle_pos):
        """Set appropriate cursor for resize handle"""
        cursors = {
            'nw': 'top_left_corner',
            'n': 'top_side',
            'ne': 'top_right_corner',
            'e': 'right_side',
            'se': 'bottom_right_corner',
            's': 'bottom_side',
            'sw': 'bottom_left_corner',
            'w': 'left_side'
        }
        self.canvas.config(cursor=cursors.get(handle_pos, 'cross'))

    def on_adjust_press(self, event):
        """Handle mouse press in adjustment mode"""
        coords = self.canvas.coords(self.rect)
        if len(coords) < 4:
            return

        x1, y1, x2, y2 = coords
        x, y = event.x, event.y

        # Check if clicking a handle
        for pos_name, handle in self.handles.items():
            handle_coords = self.canvas.coords(handle)
            if (handle_coords[0] <= x <= handle_coords[2] and
                handle_coords[1] <= y <= handle_coords[3]):
                self.resizing = True
                self.resize_handle = pos_name
                self.drag_start_x = x
                self.drag_start_y = y
                return

        # Check if inside region (for dragging)
        if x1 <= x <= x2 and y1 <= y <= y2:
            self.dragging = True
            self.drag_start_x = x
            self.drag_start_y = y

    def on_adjust_drag(self, event):
        """Handle mouse drag in adjustment mode"""
        if not (self.dragging or self.resizing):
            return

        coords = self.canvas.coords(self.rect)
        if len(coords) < 4:
            return

        x1, y1, x2, y2 = coords
        dx = event.x - self.drag_start_x
        dy = event.y - self.drag_start_y

        if self.dragging:
            # Move entire region
            new_x1 = max(0, min(self.screen_width - (x2-x1), x1 + dx))
            new_y1 = max(0, min(self.screen_height - (y2-y1), y1 + dy))
            new_x2 = new_x1 + (x2 - x1)
            new_y2 = new_y1 + (y2 - y1)

            self.canvas.coords(self.rect, new_x1, new_y1, new_x2, new_y2)
            self.canvas.coords(self.fill_rect, new_x1, new_y1, new_x2, new_y2)

        elif self.resizing:
            # Resize based on handle
            new_x1, new_y1, new_x2, new_y2 = x1, y1, x2, y2

            if 'n' in self.resize_handle:
                new_y1 = min(y2 - 20, event.y)
            if 's' in self.resize_handle:
                new_y2 = max(y1 + 20, event.y)
            if 'w' in self.resize_handle:
                new_x1 = min(x2 - 20, event.x)
            if 'e' in self.resize_handle:
                new_x2 = max(x1 + 20, event.x)

            # Constrain to screen bounds
            new_x1 = max(0, new_x1)
            new_y1 = max(0, new_y1)
            new_x2 = min(self.screen_width, new_x2)
            new_y2 = min(self.screen_height, new_y2)

            self.canvas.coords(self.rect, new_x1, new_y1, new_x2, new_y2)
            self.canvas.coords(self.fill_rect, new_x1, new_y1, new_x2, new_y2)

        self.drag_start_x = event.x
        self.drag_start_y = event.y
        self.update_handles()
        self.update_dimension_display(new_x1, new_y1, new_x2, new_y2)

    def on_adjust_release(self, event):
        """Handle mouse release in adjustment mode"""
        self.dragging = False
        self.resizing = False
        self.resize_handle = None

    def update_dimension_display(self, x1, y1, x2, y2):
        """Show region dimensions"""
        width = abs(x2 - x1)
        height = abs(y2 - y1)

        if self.dimension_text:
            self.canvas.delete(self.dimension_text)

        # Display dimensions near the region
        text_x = (x1 + x2) / 2
        text_y = min(y1, y2) - 20

        self.dimension_text = self.canvas.create_text(
            text_x, text_y,
            text=f"{width} × {height} px",
            font=('Arial', 14, 'bold'),
            fill='#1abc9c',
            tags='dimension'
        )

    def confirm_selection(self):
        """Confirm the selected region"""
        if not self.rect:
            return

        coords = self.canvas.coords(self.rect)
        if len(coords) < 4:
            return

        x1, y1, x2, y2 = coords

        # Apply scale factor for Retina/HiDPI displays
        # UI coordinates are in logical pixels, but screenshots need physical pixels
        self.region = {
            'top': int(y1 * self.scale_factor),
            'left': int(x1 * self.scale_factor),
            'width': int((x2 - x1) * self.scale_factor),
            'height': int((y2 - y1) * self.scale_factor)
        }

        print(f"Region selected (UI coords): {int(x1)},{int(y1)} {int(x2-x1)}x{int(y2-y1)}")
        print(f"Region saved (physical pixels): {self.region['left']},{self.region['top']} {self.region['width']}x{self.region['height']}")

        self.root.destroy()
        if self.callback:
            self.callback(self.region)

    def cancel_selection(self):
        """Cancel region selection"""
        self.region = None
        self.root.destroy()


class TriviaVisionAI:
    """Main application for desktop trivia screenshot AI"""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("TriviaVision AI")

        # Compact window size for seamless left-side positioning
        window_width = 500
        window_height = 750

        # Position on the left side of the screen
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        # Position at left side with small margin
        x_position = 20
        y_position = (screen_height - window_height) // 2  # Vertically centered

        self.root.geometry(f"{window_width}x{window_height}+{x_position}+{y_position}")
        self.root.configure(bg='#2c3e50')

        # Make window stay on top (optional, but helpful for workflow)
        if IS_MAC:
            # On Mac, use a lighter touch - not always on top, but easy to access
            pass
        else:
            # On Windows/Linux, might want to keep it on top
            # self.root.attributes('-topmost', True)
            pass

        self.preview_running = False
        self.preview_image_label = None

        # Load configuration
        self.config = self.load_config()
        self.region = self.config.get('region')

        self.setup_ui()

        if self.region:
            self.start_preview()

    def load_config(self):
        """Load saved configuration"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    print(f"Loaded configuration from {CONFIG_FILE}")
                    # Merge with defaults for any missing keys
                    merged_config = DEFAULT_CONFIG.copy()
                    merged_config.update(config)
                    if 'api_keys' in config:
                        merged_config['api_keys'].update(config.get('api_keys', {}))
                    if 'models' in config:
                        merged_config['models'].update(config.get('models', {}))
                    return merged_config
            except Exception as e:
                print(f"Error loading config: {e}")
                return DEFAULT_CONFIG.copy()
        return DEFAULT_CONFIG.copy()

    def save_config(self):
        """Save configuration"""
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(self.config, f, indent=2)
            print("Configuration saved")
        except Exception as e:
            print(f"Error saving config: {e}")

    def setup_ui(self):
        """Setup the user interface"""

        # Compact Title
        title_frame = tk.Frame(self.root, bg='#34495e', pady=10)
        title_frame.pack(fill=tk.X)

        title_label = tk.Label(
            title_frame,
            text="🎯 TriviaVision AI",
            font=('Arial', 16, 'bold'),
            bg='#34495e',
            fg='#ecf0f1'
        )
        title_label.pack()

        subtitle_label = tk.Label(
            title_frame,
            text="Trivia Screenshot Assistant",
            font=('Arial', 9),
            bg='#34495e',
            fg='#bdc3c7'
        )
        subtitle_label.pack()

        # Preview Frame - Compact
        preview_frame = tk.LabelFrame(
            self.root,
            text="Live Preview",
            font=('Arial', 10, 'bold'),
            bg='#34495e',
            fg='#ecf0f1',
            padx=5,
            pady=5
        )
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        self.preview_image_label = tk.Label(
            preview_frame,
            text="No region selected\n\nClick 'Select Region'\nto choose screen area",
            font=('Arial', 10),
            bg='#2c3e50',
            fg='#95a5a6',
            width=40,
            height=8
        )
        self.preview_image_label.pack(expand=True)

        # AI Responses Frame - Stacked vertically for compact layout
        responses_main_frame = tk.Frame(self.root, bg='#2c3e50')
        responses_main_frame.pack(fill=tk.BOTH, padx=10, pady=5, expand=True)

        # OpenAI Response Frame
        openai_frame = tk.LabelFrame(
            responses_main_frame,
            text="🤖 OpenAI",
            font=('Arial', 9, 'bold'),
            bg='#34495e',
            fg='#10a37f',
            padx=5,
            pady=5
        )
        openai_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 3))

        self.openai_text = tk.Text(
            openai_frame,
            height=4,
            font=('Arial', 9),
            bg='#1e2a38',
            fg='#ecf0f1',
            wrap=tk.WORD,
            state='disabled'
        )
        self.openai_text.pack(fill=tk.BOTH, expand=True)

        # Gemini Response Frame
        gemini_frame = tk.LabelFrame(
            responses_main_frame,
            text="✨ Gemini",
            font=('Arial', 9, 'bold'),
            bg='#34495e',
            fg='#4285f4',
            padx=5,
            pady=5
        )
        gemini_frame.pack(fill=tk.BOTH, expand=True, pady=(3, 0))

        self.gemini_text = tk.Text(
            gemini_frame,
            height=4,
            font=('Arial', 9),
            bg='#1e2a38',
            fg='#ecf0f1',
            wrap=tk.WORD,
            state='disabled'
        )
        self.gemini_text.pack(fill=tk.BOTH, expand=True)

        # Combined Status Frame - Compact
        status_frame = tk.LabelFrame(
            self.root,
            text="📊 Status",
            font=('Arial', 9, 'bold'),
            bg='#34495e',
            fg='#ecf0f1',
            padx=5,
            pady=5
        )
        status_frame.pack(fill=tk.X, padx=10, pady=5)

        self.status_text = tk.Text(
            status_frame,
            height=2,
            font=('Arial', 8),
            bg='#1e2a38',
            fg='#95a5a6',
            wrap=tk.WORD,
            state='disabled'
        )
        self.status_text.pack(fill=tk.BOTH, expand=True)

        # Control Buttons Frame - Vertical stacking for compact layout
        button_frame = tk.Frame(self.root, bg='#2c3e50', pady=5)
        button_frame.pack(fill=tk.X, padx=10)

        # Select Region Button
        self.select_button = tk.Button(
            button_frame,
            text="📐 Select Region",
            command=self.select_region,
            font=('Arial', 10, 'bold'),
            bg='#3498db',
            fg='white',
            padx=10,
            pady=8,
            cursor='hand2'
        )
        self.select_button.pack(fill=tk.X, pady=2)

        # Take Screenshot Button
        self.screenshot_button = tk.Button(
            button_frame,
            text="📸 Screenshot & Analyze",
            command=self.take_screenshot,
            font=('Arial', 10, 'bold'),
            bg='#27ae60',
            fg='white',
            padx=10,
            pady=8,
            cursor='hand2',
            state='disabled' if not self.region else 'normal'
        )
        self.screenshot_button.pack(fill=tk.X, pady=2)

        # Settings Button
        self.settings_button = tk.Button(
            button_frame,
            text="⚙️ Settings",
            command=self.open_settings,
            font=('Arial', 10, 'bold'),
            bg='#9b59b6',
            fg='white',
            padx=10,
            pady=8,
            cursor='hand2'
        )
        self.settings_button.pack(fill=tk.X, pady=2)

        # Region Info Label - Compact
        self.region_info_label = tk.Label(
            self.root,
            text=self.get_region_info_text(),
            font=('Arial', 8),
            bg='#2c3e50',
            fg='#95a5a6'
        )
        self.region_info_label.pack(pady=3)

    def get_region_info_text(self):
        """Get region info text for display"""
        if self.region:
            return f"Region: {self.region['width']}x{self.region['height']} at ({self.region['left']}, {self.region['top']})"
        return "No region selected"

    def open_settings(self):
        """Open settings dialog"""
        dialog = SettingsDialog(self.root, self.config)
        result = dialog.show()

        if result:
            self.config = result
            self.region = result.get('region')
            self.save_config()
            self.update_status("✅ Settings saved successfully!")

            # Update UI
            self.region_info_label.config(text=self.get_region_info_text())

            # Restart preview if region changed
            if self.region:
                self.start_preview()

    def select_region(self):
        """Handle region selection button click"""
        # Check macOS permissions first
        if IS_MAC and not check_macos_permissions():
            show_macos_permission_help()
            self.update_status("❌ Screen recording permission required on macOS")
            return

        if self.region:
            self.update_status("Adjust your region: drag to move, drag handles to resize...")
        else:
            self.update_status("Draw a rectangle to select the region...")

        def region_selected(region):
            if region:  # Only update if region was confirmed (not cancelled)
                self.region = region
                self.config['region'] = region
                self.save_config()
                self.region_info_label.config(text=self.get_region_info_text())
                self.screenshot_button.config(state='normal')
                self.update_status(f"✅ Region selected: {region['width']}x{region['height']} pixels")
                self.start_preview()
            else:
                self.update_status("Region selection cancelled")

        try:
            # Pass existing region to allow adjustment
            selector = RegionSelector(region_selected, initial_region=self.region)
            self.root.after(100, selector.select_region)
        except Exception as e:
            error_msg = f"❌ Error opening region selector: {str(e)}"
            self.update_status(error_msg)
            print(f"Region selection error: {e}")
            if IS_MAC:
                messagebox.showerror("Region Selection Error",
                    f"Could not open region selector.\n\n{str(e)}\n\nOn macOS, make sure screen recording permission is granted.")

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

            # Resize for preview (maintain aspect ratio) - smaller for compact window
            preview_width = 400  # Reduced from 600 for compact window
            aspect_ratio = screenshot.height / screenshot.width
            preview_height = int(preview_width * aspect_ratio)

            # Limit preview height to fit in compact window
            max_preview_height = 200
            if preview_height > max_preview_height:
                preview_height = max_preview_height
                preview_width = int(preview_height / aspect_ratio)

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
        try:
            if MSS_AVAILABLE:
                # Use mss for faster and more reliable capture (especially on macOS)
                with mss() as sct:
                    monitor = {
                        'top': region['top'],
                        'left': region['left'],
                        'width': region['width'],
                        'height': region['height']
                    }
                    screenshot = sct.grab(monitor)
                    img = Image.frombytes('RGB', screenshot.size, screenshot.rgb)

                    # Verify we didn't get a blank screenshot (permission issue on Mac)
                    if IS_MAC:
                        # Quick check: if image is all black, might be permission issue
                        extrema = img.convert('L').getextrema()
                        if extrema == (0, 0):
                            raise Exception("Screenshot appears blank - check screen recording permissions")

                    return img
            else:
                # Fallback to PIL ImageGrab
                bbox = (
                    region['left'],
                    region['top'],
                    region['left'] + region['width'],
                    region['top'] + region['height']
                )
                img = ImageGrab.grab(bbox=bbox)

                if img is None:
                    raise Exception("Screenshot capture failed")

                return img

        except Exception as e:
            print(f"Screenshot capture error: {e}")
            if IS_MAC:
                show_macos_permission_help()
            raise

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

        # Check which APIs are available from config
        has_openai = self.config.get('api_keys', {}).get('openai', '').strip()
        has_gemini = GEMINI_AVAILABLE and self.config.get('api_keys', {}).get('gemini', '').strip()

        if not has_openai and not has_gemini:
            messagebox.showerror(
                "API Keys Missing",
                "Please configure your API keys:\n\n"
                "Click the ⚙️ Settings button to add:\n"
                "• OpenAI API key\n"
                "• Gemini API key\n\n"
                "You need at least one API key configured."
            )
            return

        self.update_status("📸 Taking screenshot... Preparing parallel AI analysis...")
        self.screenshot_button.config(state='disabled')

        # Run analysis in background thread to keep UI responsive
        thread = threading.Thread(target=self.analyze_screenshot_parallel)
        thread.daemon = True
        thread.start()

    def update_openai_text(self, message):
        """Update OpenAI response text"""
        self.openai_text.config(state='normal')
        self.openai_text.delete(1.0, tk.END)
        self.openai_text.insert(1.0, message)
        self.openai_text.config(state='disabled')

    def update_gemini_text(self, message):
        """Update Gemini response text"""
        self.gemini_text.config(state='normal')
        self.gemini_text.delete(1.0, tk.END)
        self.gemini_text.insert(1.0, message)
        self.gemini_text.config(state='disabled')

    def analyze_screenshot_parallel(self):
        """Capture and analyze screenshot with multiple AIs in parallel"""
        try:
            # Capture screenshot
            screenshot = self.capture_region(self.region)

            # Save screenshot
            save_dir = "captured_images"
            os.makedirs(save_dir, exist_ok=True)

            timestamp = time.strftime("%Y%m%d_%H%M%S")
            screenshot_path = os.path.join(save_dir, f"trivia_screenshot_{timestamp}.png")
            screenshot.save(screenshot_path, optimize=True, quality=85)

            self.root.after(0, self.update_status, f"📸 Screenshot saved! Running parallel AI analysis...")
            self.root.after(0, self.update_openai_text, "⏳ Analyzing...")
            self.root.after(0, self.update_gemini_text, "⏳ Analyzing...")

            # Check which APIs are available from config
            has_openai = self.config.get('api_keys', {}).get('openai', '').strip()
            has_gemini = GEMINI_AVAILABLE and self.config.get('api_keys', {}).get('gemini', '').strip()

            # Run parallel queries
            with ThreadPoolExecutor(max_workers=2) as executor:
                futures = {}

                if has_openai:
                    futures['openai'] = executor.submit(self.analyze_with_openai, screenshot)

                if has_gemini:
                    futures['gemini'] = executor.submit(self.analyze_with_gemini, screenshot)

                # Collect results as they complete
                results = {}
                for model_name, future in futures.items():
                    try:
                        result = future.result(timeout=30)
                        results[model_name] = result
                    except Exception as e:
                        results[model_name] = {'error': str(e), 'duration': 0}

            # Update UI with results
            if 'openai' in results:
                if 'error' in results['openai']:
                    self.root.after(0, self.update_openai_text, f"❌ Error: {results['openai']['error']}")
                else:
                    response = f"⏱️ {results['openai']['duration']:.2f}s\n\n{results['openai']['response']}"
                    self.root.after(0, self.update_openai_text, response)
            else:
                self.root.after(0, self.update_openai_text, "⚠️ API key not configured")

            if 'gemini' in results:
                if 'error' in results['gemini']:
                    self.root.after(0, self.update_gemini_text, f"❌ Error: {results['gemini']['error']}")
                else:
                    response = f"⏱️ {results['gemini']['duration']:.2f}s\n\n{results['gemini']['response']}"
                    self.root.after(0, self.update_gemini_text, response)
            else:
                self.root.after(0, self.update_gemini_text, "⚠️ API not available")

            # Update status
            status_msg = "✅ Analysis complete! "
            if 'openai' in results and 'error' not in results['openai']:
                status_msg += f"OpenAI: {results['openai']['duration']:.2f}s | "
            if 'gemini' in results and 'error' not in results['gemini']:
                status_msg += f"Gemini: {results['gemini']['duration']:.2f}s"

            self.root.after(0, self.update_status, status_msg)

        except Exception as e:
            error_msg = f"❌ Error: {str(e)}"
            self.root.after(0, self.update_status, error_msg)
            print(f"Analysis error: {e}")

        finally:
            self.root.after(0, lambda: self.screenshot_button.config(state='normal'))

    def analyze_with_openai(self, image):
        """Send image to OpenAI API for analysis"""
        try:
            # Get config values
            api_key = self.config.get('api_keys', {}).get('openai', '')
            model = self.config.get('models', {}).get('openai_model', 'gpt-4o-mini')
            prompt = self.config.get('prompt', DEFAULT_CONFIG['prompt'])

            # Convert image to base64
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
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

            print(f"OpenAI response received in {duration:.2f} seconds")

            response_json = response.json()

            if 'choices' in response_json and len(response_json['choices']) > 0:
                content = response_json['choices'][0].get('message', {}).get('content', 'No answer found')
                return {'response': content, 'duration': duration}
            else:
                error_msg = response_json.get('error', {}).get('message', 'Unknown error')
                return {'error': error_msg, 'duration': duration}

        except Exception as e:
            print(f"OpenAI error: {e}")
            return {'error': str(e), 'duration': 0}

    def analyze_with_gemini(self, image):
        """Send image to Google Gemini API for analysis"""
        try:
            if not GEMINI_AVAILABLE:
                return {'error': 'Gemini library not installed', 'duration': 0}

            # Get config values
            api_key = self.config.get('api_keys', {}).get('gemini', '')
            model_name = self.config.get('models', {}).get('gemini_model', 'gemini-2.0-flash-exp')
            prompt = self.config.get('prompt', DEFAULT_CONFIG['prompt'])

            # Configure Gemini
            genai.configure(api_key=api_key)

            # Use configured model
            model = genai.GenerativeModel(model_name)

            start_time = time.time()
            response = model.generate_content([prompt, image])
            duration = time.time() - start_time

            print(f"Gemini response received in {duration:.2f} seconds")

            if response.text:
                return {'response': response.text, 'duration': duration}
            else:
                return {'error': 'No response from Gemini', 'duration': duration}

        except Exception as e:
            print(f"Gemini error: {e}")
            return {'error': str(e), 'duration': 0}

    def run(self):
        """Start the application"""
        self.root.mainloop()


def main():
    """Main entry point"""
    print("=" * 70)
    print("TriviaVision AI - Desktop Trivia Screenshot Assistant")
    print("Parallel AI Processing with OpenAI & Google Gemini")
    print("=" * 70)
    print()

    # Platform detection
    print(f"Platform: {platform.system()} {platform.release()}")
    if IS_MAC:
        print("macOS detected - Retina display support enabled")
        print()

    # Check dependencies
    if not MSS_AVAILABLE:
        print("⚠️  Warning: 'mss' library not found. Install for better performance:")
        print("   pip install mss")
        if IS_MAC:
            print("   Note: mss is highly recommended for macOS!")
        print()
    else:
        print("✓ mss library available for fast screenshot capture")

    if not GEMINI_AVAILABLE:
        print("⚠️  Warning: 'google-generativeai' library not found.")
        print("   Install for Gemini support: pip install google-generativeai")
        print()
    else:
        print("✓ Google Gemini library available")

    # macOS permission check
    if IS_MAC:
        print()
        print("Checking macOS screen recording permissions...")
        if check_macos_permissions():
            print("✓ Screen recording permissions OK")
        else:
            print("⚠️  WARNING: Screen recording permissions may not be granted!")
            print("   You may need to enable Screen Recording permission in System Settings")
            print("   Go to: System Settings > Privacy & Security > Screen Recording")
            print("   Enable permission for Python/Terminal and restart this app")
        print()

    print("💡 Configure your API keys and models using the ⚙️ Settings button in the app.")
    print()

    app = TriviaVisionAI()
    app.run()


if __name__ == "__main__":
    main()
