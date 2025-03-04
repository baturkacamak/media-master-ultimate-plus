import { ipcMain } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { formatConversionService, ConversionOptions } from './services/format-conversion';

/**
 * Sets up IPC handlers for format conversion functionality
 */
export function registerFormatConversionHandlers(): void {
  /**
   * Convert a single file
   */
  ipcMain.handle('conversion:convertFile', async (_event, sourcePath: string, options: Partial<ConversionOptions>) => {
    try {
      log.info(`Converting file: ${sourcePath} to format: ${options.targetFormat}`);

      const sourceExt = path.extname(sourcePath);
      const targetExt = `.${options.targetFormat}`;

      // Create target path by replacing extension
      const targetPath = sourcePath.replace(sourceExt, targetExt);

      const result = await formatConversionService.convertFile(sourcePath, targetPath, options);

      return {
        success: true,
        targetPath: result
      };
    } catch (error) {
      log.error('Error converting file:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Convert multiple files
   */
  ipcMain.handle('conversion:convertFiles', async (_event, filePaths: string[], options: Partial<ConversionOptions>) => {
    try {
      log.info(`Converting ${filePaths.length} files to format: ${options.targetFormat}`);

      const results = {
        success: true,
        converted: 0,
        failed: 0,
        targetPaths: [] as string[]
      };

      for (const sourcePath of filePaths) {
        try {
          const sourceExt = path.extname(sourcePath);
          const targetExt = `.${options.targetFormat}`;

          // Create target path by replacing extension
          const targetPath = sourcePath.replace(sourceExt, targetExt);

          const result = await formatConversionService.convertFile(sourcePath, targetPath, options);
          results.converted++;
          results.targetPaths.push(result);
        } catch (error) {
          log.error(`Failed to convert file ${sourcePath}:`, error);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      log.error('Error in batch file conversion:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get available formats for conversion
   */
  ipcMain.handle('conversion:getAvailableFormats', async () => {
    return {
      success: true,
      formats: {
        image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp'],
        video: ['mp4', 'mov', 'avi', 'mkv', 'webm']
      }
    };
  });
}

/**
 * Clean up temporary files when exiting application
 */
export function cleanupFormatConversion(): void {
  formatConversionService.cleanup().catch(error => {
    log.error('Error cleaning up format conversion temporary files:', error);
  });
}