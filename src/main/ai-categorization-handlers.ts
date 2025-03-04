import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import {
  aiCategorizationService,
  CategorizationOptions,
  CategorizationResult
} from './services/ai-categorization';

/**
 * Sets up IPC handlers for AI categorization functionality
 */
export function registerAiCategorizationHandlers(): void {
  /**
   * Configure AI Categorization service
   */
  ipcMain.handle('ai:configure', async (_event, options: Partial<CategorizationOptions>) => {
    try {
      aiCategorizationService.configure(options);
      return { success: true };
    } catch (error) {
      log.error('Error configuring AI service:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Categorize a single image
   */
  ipcMain.handle('ai:categorizeImage', async (_event, imagePath: string) => {
    try {
      const result = await aiCategorizationService.categorizeImage(imagePath);
      return {
        success: !result.error,
        result: result,
        error: result.error
      };
    } catch (error) {
      log.error('Error categorizing image:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Categorize multiple images
   */
  ipcMain.handle('ai:categorizeImages', async (_event, imagePaths: string[]) => {
    const sender = BrowserWindow.fromWebContents(_event.sender);

    try {
      const results: CategorizationResult[] = [];
      let processed = 0;

      for (const imagePath of imagePaths) {
        try {
          // Process the image
          const result = await aiCategorizationService.categorizeImage(imagePath);
          results.push(result);

          // Update progress
          processed++;

          // Notify progress if we have a valid sender
          if (sender) {
            sender.webContents.send('ai:progress', {
              processed,
              total: imagePaths.length,
              percentage: Math.floor((processed / imagePaths.length) * 100),
              currentFile: imagePath
            });
          }
        } catch (error) {
          log.error(`Error processing ${imagePath} during batch categorization:`, error);
          results.push({
            filePath: imagePath,
            tags: [],
            error: (error as Error).message
          });
        }
      }

      // Notify completion if we have a valid sender
      if (sender) {
        sender.webContents.send('ai:complete', {
          total: imagePaths.length,
          processed
        });
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      log.error('Error in batch image categorization:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get available categories
   */
  ipcMain.handle('ai:getCategories', async () => {
    try {
      const categories = aiCategorizationService.getAllCategories();
      return {
        success: true,
        categories
      };
    } catch (error) {
      log.error('Error getting categories:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Add custom categories
   */
  ipcMain.handle('ai:addCustomCategories', async (_event, categories: string[]) => {
    try {
      aiCategorizationService.addCustomCategories(categories);
      return { success: true };
    } catch (error) {
      log.error('Error adding custom categories:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Remove custom categories
   */
  ipcMain.handle('ai:removeCustomCategories', async (_event, categories: string[]) => {
    try {
      aiCategorizationService.removeCustomCategories(categories);
      return { success: true };
    } catch (error) {
      log.error('Error removing custom categories:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });
}

/**
 * Clean up AI categorization resources when exiting application
 */
export function cleanupAiCategorization(): void {
  aiCategorizationService.cleanup().catch(error => {
    log.error('Error cleaning up AI categorization service:', error);
  });
}