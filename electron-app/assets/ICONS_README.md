# Application Icons

## Required Icons for Distribution

Before building the application for distribution, you need to add icon files to this directory:

### macOS
- `icon.icns` - macOS application icon (1024x1024 or multiple sizes)

### Windows
- `icon.ico` - Windows application icon (256x256 or multiple sizes)

### Linux
- `icon.png` - PNG icon (512x512 or 1024x1024 recommended)

### Additional Sizes (Optional)
Create an `icons/` subdirectory with multiple PNG sizes:
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256
- 512x512
- 1024x1024

## Icon Design

The icon should represent the TriviaVisionAI application. Suggestions:
- Screenshot/camera symbol
- Brain/AI symbol
- Question mark with camera
- Trivia quiz symbol

## Generating Icons

### From PNG to ICNS (macOS):
```bash
# Install iconutil (comes with Xcode)
mkdir icon.iconset
sips -z 16 16 icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

### From PNG to ICO (Windows):
Use online converter or ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Placeholder

For development/testing, the application will use default Electron icons.
Production builds require proper icons for professional appearance.

## electron-builder Integration

Icons are automatically included in builds when present in this directory.
See `package.json` build configuration for icon paths.
