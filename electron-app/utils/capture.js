/**
 * Screen Capture Module
 * Handles screenshot capture with Sharp-based region cropping
 */

const { desktopCapturer, screen } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { PATHS, REGION } = require('./constants');

class ScreenCapture {
  constructor() {
    this.scaleFactor = 1;
    this.updateScaleFactor();
  }

  /**
   * Update scale factor from primary display
   */
  updateScaleFactor() {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      this.scaleFactor = primaryDisplay.scaleFactor;
      logger.debug(`Screen scale factor: ${this.scaleFactor}x`);
    } catch (error) {
      logger.error('Failed to get scale factor:', error);
      this.scaleFactor = 1;
    }
  }

  /**
   * Get display information
   */
  getDisplayInfo() {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const { scaleFactor } = primaryDisplay;

      return {
        size: { width, height },
        workAreaSize: primaryDisplay.workAreaSize,
        scaleFactor: scaleFactor,
        isRetina: scaleFactor > 1,
        bounds: primaryDisplay.bounds
      };
    } catch (error) {
      logger.error('Failed to get display info:', error);
      throw new Error('Could not get display information');
    }
  }

  /**
   * Capture full screen
   * @returns {Promise<Buffer>} Screenshot as PNG buffer
   */
  async captureFullScreen() {
    try {
      this.updateScaleFactor();

      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;

      logger.debug(`Capturing full screen: ${width}x${height} @ ${this.scaleFactor}x`);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: width * this.scaleFactor,
          height: height * this.scaleFactor
        }
      });

      if (!sources || sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const primarySource = sources[0];
      const screenshot = primarySource.thumbnail;

      // Convert to PNG buffer
      const pngBuffer = screenshot.toPNG();

      logger.debug(`Screenshot captured: ${screenshot.getSize().width}x${screenshot.getSize().height}`);

      return pngBuffer;
    } catch (error) {
      logger.error('Full screen capture failed:', error);
      throw error;
    }
  }

  /**
   * Capture specific region
   * @param {Object} region - Region to capture { left, top, width, height } in physical pixels
   * @returns {Promise<Buffer>} Cropped screenshot as PNG buffer
   */
  async captureRegion(region) {
    try {
      // Validate region
      if (!region || region.width < REGION.MIN_WIDTH || region.height < REGION.MIN_HEIGHT) {
        throw new Error(`Invalid region: minimum size is ${REGION.MIN_WIDTH}x${REGION.MIN_HEIGHT}`);
      }

      logger.debug(`Capturing region: ${region.width}x${region.height} at (${region.left},${region.top})`);

      // Capture full screen first
      const fullScreenBuffer = await this.captureFullScreen();

      // Crop to region using Sharp
      const croppedBuffer = await sharp(fullScreenBuffer)
        .extract({
          left: Math.max(0, region.left),
          top: Math.max(0, region.top),
          width: region.width,
          height: region.height
        })
        .png()
        .toBuffer();

      logger.screenshot(region, true);

      return croppedBuffer;
    } catch (error) {
      logger.screenshot(region, false);
      logger.error('Region capture failed:', error);
      throw error;
    }
  }

  /**
   * Capture region and save to file
   * @param {Object} region - Region to capture
   * @param {string} filename - Optional filename (auto-generated if not provided)
   * @returns {Promise<Object>} {success, filepath, size, scaleFactor}
   */
  async captureAndSave(region, filename = null) {
    try {
      // Capture region
      const imageBuffer = await this.captureRegion(region);

      // Generate filename if not provided
      if (!filename) {
        const timestamp = new Date().toISOString()
          .replace(/[:.]/g, '-')
          .slice(0, -5);
        filename = `trivia_screenshot_${timestamp}.png`;
      }

      // Ensure filename has .png extension
      if (!filename.endsWith('.png')) {
        filename += '.png';
      }

      // Create directory if it doesn't exist
      const saveDir = path.join(process.cwd(), PATHS.CAPTURED_IMAGES);
      await fs.mkdir(saveDir, { recursive: true });

      // Full file path
      const filepath = path.join(saveDir, filename);

      // Save to file
      await fs.writeFile(filepath, imageBuffer);

      logger.info(`Screenshot saved: ${filepath}`);

      return {
        success: true,
        filepath: filepath,
        filename: filename,
        size: {
          width: region.width,
          height: region.height
        },
        scaleFactor: this.scaleFactor
      };
    } catch (error) {
      logger.error('Failed to save screenshot:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resize image for preview
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Promise<Buffer>} Resized image buffer
   */
  async resizeForPreview(imageBuffer, maxWidth = 400, maxHeight = 200) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Calculate dimensions maintaining aspect ratio
      let width = metadata.width;
      let height = metadata.height;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }

      // Resize
      const resized = await image
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();

      return resized;
    } catch (error) {
      logger.error('Failed to resize image:', error);
      throw error;
    }
  }

  /**
   * Convert logical pixels to physical pixels (for Retina/HiDPI)
   */
  logicalToPhysical(logicalRegion) {
    return {
      left: Math.round(logicalRegion.left * this.scaleFactor),
      top: Math.round(logicalRegion.top * this.scaleFactor),
      width: Math.round(logicalRegion.width * this.scaleFactor),
      height: Math.round(logicalRegion.height * this.scaleFactor)
    };
  }

  /**
   * Convert physical pixels to logical pixels
   */
  physicalToLogical(physicalRegion) {
    return {
      left: Math.round(physicalRegion.left / this.scaleFactor),
      top: Math.round(physicalRegion.top / this.scaleFactor),
      width: Math.round(physicalRegion.width / this.scaleFactor),
      height: Math.round(physicalRegion.height / this.scaleFactor)
    };
  }

  /**
   * Check if screenshot permissions are available (macOS)
   */
  async checkPermissions() {
    try {
      // Try to capture a small screenshot
      const testBuffer = await this.captureFullScreen();

      // Check if we got actual pixel data (not all black)
      const testImage = sharp(testBuffer);
      const stats = await testImage.stats();

      // If all channels have min/max of 0, likely permission denied
      const isBlank = stats.channels.every(channel =>
        channel.min === 0 && channel.max === 0
      );

      if (isBlank && process.platform === 'darwin') {
        logger.warn('Screenshot appears blank - check Screen Recording permissions on macOS');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const screenCapture = new ScreenCapture();

module.exports = {
  ScreenCapture,
  screenCapture
};
