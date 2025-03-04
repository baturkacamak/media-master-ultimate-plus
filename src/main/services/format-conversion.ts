import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';

const execPromise = promisify(exec);

/**
 * Supported format conversion types
 */
export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'tiff' | 'bmp';
export type VideoFormat = 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm';
export type ConversionFormat = ImageFormat | VideoFormat;

/**
 * Quality settings for image conversion
 */
export type ConversionQuality = 'low' | 'medium' | 'high' | 'lossless';

/**
 * Options for format conversion
 */
export interface ConversionOptions {
  sourceFormat: ConversionFormat;
  targetFormat: ConversionFormat;
  quality: ConversionQuality;
  deleteOriginal?: boolean;
  resizeWidth?: number;
  resizeHeight?: number;
  maintainAspectRatio?: boolean;
}

/**
 * Maps quality settings to actual numerical values
 */
const QUALITY_MAP = {
  low: 50,
  medium: 75,
  high: 90,
  lossless: 100,
};

/**
 * Manages file format conversion operations
 */
export class FormatConversionService {
  private ffmpegAvailable: boolean = false;
  private imagemagickAvailable: boolean = false;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(app.getPath('temp'), 'mediamaster-conversion');
    this.checkDependencies();
  }

  /**
   * Check if external dependencies (ffmpeg, imagemagick) are available
   */
  private async checkDependencies(): Promise<void> {
    try {
      await execPromise('ffmpeg -version');
      this.ffmpegAvailable = true;
      log.info('FFmpeg is available for video processing');
    } catch (error) {
      this.ffmpegAvailable = false;
      log.warn('FFmpeg not available - video conversion will use fallback methods');
    }

    try {
      await execPromise('convert -version');
      this.imagemagickAvailable = true;
      log.info('ImageMagick is available for image processing');
    } catch (error) {
      this.imagemagickAvailable = false;
      log.warn('ImageMagick not available - image conversion will use fallback methods');
    }

    // Create temp directory
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      log.error('Failed to create temporary directory for conversions:', error);
    }
  }

  /**
   * Determines if a format is an image format
   */
  private isImageFormat(format: ConversionFormat): boolean {
    const imageFormats: ImageFormat[] = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp'];
    return imageFormats.includes(format as ImageFormat);
  }

  /**
   * Determines if a format is a video format
   */
  private isVideoFormat(format: ConversionFormat): boolean {
    const videoFormats: VideoFormat[] = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    return videoFormats.includes(format as VideoFormat);
  }

  /**
   * Convert a single file from one format to another
   * @param sourcePath Source file path
   * @param targetPath Target file path
   * @param options Conversion options
   * @returns Promise that resolves with target file path on success
   */
  public async convertFile(
    sourcePath: string,
    targetPath: string,
    options: Partial<ConversionOptions> = {}
  ): Promise<string> {
    try {
      const sourceExt = path.extname(sourcePath).slice(1).toLowerCase() as ConversionFormat;
      const targetExt = path.extname(targetPath).slice(1).toLowerCase() as ConversionFormat;

      const defaultOptions: ConversionOptions = {
        sourceFormat: sourceExt,
        targetFormat: targetExt,
        quality: 'high',
        deleteOriginal: false,
        maintainAspectRatio: true,
      };

      const mergedOptions: ConversionOptions = { ...defaultOptions, ...options };

      // Validate conversion is possible
      if (this.isImageFormat(sourceExt) && this.isImageFormat(targetExt)) {
        return await this.convertImage(sourcePath, targetPath, mergedOptions);
      } else if (this.isVideoFormat(sourceExt) && this.isVideoFormat(targetExt)) {
        return await this.convertVideo(sourcePath, targetPath, mergedOptions);
      } else {
        throw new Error(`Unsupported conversion from ${sourceExt} to ${targetExt}`);
      }
    } catch (error) {
      log.error(`Error converting file ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * Convert an image file from one format to another
   */
  private async convertImage(
    sourcePath: string,
    targetPath: string,
    options: ConversionOptions
  ): Promise<string> {
    try {
      const quality = QUALITY_MAP[options.quality];

      if (this.imagemagickAvailable) {
        // Use ImageMagick if available
        let command = `convert "${sourcePath}" -quality ${quality}`;

        // Add resize if specified
        if (options.resizeWidth && options.resizeHeight) {
          const resizeOpt = options.maintainAspectRatio ? '\\>' : '!';
          command += ` -resize ${options.resizeWidth}x${options.resizeHeight}${resizeOpt}`;
        }

        command += ` "${targetPath}"`;
        await execPromise(command);
      } else {
        // Use native libraries as fallback
        // For now, read file with fs and do a basic conversion
        // This is a placeholder - in a real implementation, you would use libraries like Sharp
        const imageData = await fs.readFile(sourcePath);
        await fs.writeFile(targetPath, imageData);
        log.warn(`Basic image copy performed instead of conversion from ${options.sourceFormat} to ${options.targetFormat}`);
      }

      // Delete original if requested
      if (options.deleteOriginal) {
        await fs.unlink(sourcePath);
      }

      return targetPath;
    } catch (error) {
      log.error(`Error converting image ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * Convert a video file from one format to another
   */
  private async convertVideo(
    sourcePath: string,
    targetPath: string,
    options: ConversionOptions
  ): Promise<string> {
    try {
      if (this.ffmpegAvailable) {
        // Map quality to ffmpeg settings
        const crf = options.quality === 'low' ? 28 :
          options.quality === 'medium' ? 23 :
            options.quality === 'high' ? 18 : 0; // 0 is lossless for some codecs

        let command = `ffmpeg -i "${sourcePath}" -c:v libx264 -crf ${crf} -c:a aac -strict experimental`;

        // Add resize if specified
        if (options.resizeWidth && options.resizeHeight) {
          command += ` -vf "scale=${options.resizeWidth}:${options.resizeHeight}"`;
        }

        command += ` "${targetPath}" -y`; // -y to overwrite without asking
        await execPromise(command);
      } else {
        // If ffmpeg is not available, we can't do much with video
        throw new Error('FFmpeg is required for video conversion but is not available');
      }

      // Delete original if requested
      if (options.deleteOriginal) {
        await fs.unlink(sourcePath);
      }

      return targetPath;
    } catch (error) {
      log.error(`Error converting video ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup temporary files
   */
  public async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      log.info('Cleaned up temporary conversion files');
    } catch (error) {
      log.error('Error cleaning up temporary conversion files:', error);
    }
  }
}

// Instance for global usage
export const formatConversionService = new FormatConversionService();