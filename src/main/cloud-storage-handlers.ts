import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { cloudStorageService } from './services/cloud-storage';
import { CloudProvider, CloudFile, UploadOptions } from '@common/types';

/**
 * Sets up IPC handlers for cloud storage functionality
 */
export function registerCloudStorageHandlers(): void {
  /**
   * Initialize cloud storage service
   */
  ipcMain.handle('cloud:initialize', async () => {
    try {
      await cloudStorageService.initialize();
      return { success: true };
    } catch (error) {
      log.error('Error initializing cloud storage:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Configure a cloud provider
   */
  ipcMain.handle('cloud:configureProvider', async (_event, provider: CloudProvider, config: any) => {
    try {
      await cloudStorageService.configureProvider(provider, config);
      return { success: true };
    } catch (error) {
      log.error(`Error configuring cloud provider ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get configuration for a provider
   */
  ipcMain.handle('cloud:getProviderConfig', async (_event, provider: CloudProvider) => {
    try {
      const config = cloudStorageService.getProviderConfig(provider);
      return {
        success: true,
        config
      };
    } catch (error) {
      log.error(`Error getting config for provider ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get all provider configurations
   */
  ipcMain.handle('cloud:getAllProviderConfigs', async () => {
    try {
      const configs = cloudStorageService.getAllProviderConfigs();
      return {
        success: true,
        configs
      };
    } catch (error) {
      log.error('Error getting all provider configs:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Set active provider
   */
  ipcMain.handle('cloud:setActiveProvider', async (_event, provider: CloudProvider) => {
    try {
      cloudStorageService.setActiveProvider(provider);
      return { success: true };
    } catch (error) {
      log.error(`Error setting active provider to ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get active provider
   */
  ipcMain.handle('cloud:getActiveProvider', async () => {
    try {
      const provider = cloudStorageService.getActiveProvider();
      return {
        success: true,
        provider
      };
    } catch (error) {
      log.error('Error getting active provider:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get authorization URL
   */
  ipcMain.handle('cloud:getAuthorizationUrl', async (_event, provider: CloudProvider) => {
    try {
      const url = cloudStorageService.getAuthorizationUrl(provider);
      return {
        success: true,
        url
      };
    } catch (error) {
      log.error(`Error getting authorization URL for ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Exchange authorization code for token
   */
  ipcMain.handle('cloud:exchangeCodeForToken', async (_event, provider: CloudProvider, code: string) => {
    try {
      await cloudStorageService.exchangeCodeForToken(provider, code);
      return { success: true };
    } catch (error) {
      log.error(`Error exchanging code for token for ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * List files
   */
  ipcMain.handle('cloud:listFiles', async (_event, provider: CloudProvider, folderId?: string) => {
    try {
      const files = await cloudStorageService.listFiles(provider, folderId);
      return {
        success: true,
        files
      };
    } catch (error) {
      log.error(`Error listing files for ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Upload file
   */
  ipcMain.handle('cloud:uploadFile', async (_event, provider: CloudProvider, filePath: string, options: UploadOptions) => {
    try {
      const file = await cloudStorageService.uploadFile(provider, filePath, options);
      return {
        success: true,
        file
      };
    } catch (error) {
      log.error(`Error uploading file to ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Upload multiple files
   */
  ipcMain.handle('cloud:uploadFiles', async (_event, provider: CloudProvider, filePaths: string[], options: UploadOptions) => {
    const sender = BrowserWindow.fromWebContents(_event.sender);

    try {
      const results: CloudFile[] = [];
      let processed = 0;
      let failed = 0;

      for (const filePath of filePaths) {
        try {
          // Process file name if needed
          const fileName = options.preserveDirectoryStructure && options.basePath ?
            path.basename(filePath) :
            filePath.replace(options.basePath || '', '').replace(/^[\/\\]/, '');

          // Create folder structure if needed
          let targetFolderId = options.folderId;

          if (options.preserveDirectoryStructure && options.basePath) {
            const relativePath = path.dirname(filePath.replace(options.basePath, ''));
            if (relativePath !== '.' && relativePath !== '/') {
              // Create folders for the path
              const folders = relativePath.split(/[\/\\]/).filter(Boolean);
              let currentFolderId = options.folderId;

              for (const folder of folders) {
                try {
                  // Try to find if folder exists
                  const files = await cloudStorageService.listFiles(provider, currentFolderId);
                  const existingFolder = files.find(f => f.isFolder && f.name === folder);

                  if (existingFolder) {
                    currentFolderId = existingFolder.id;
                  } else {
                    // Create folder
                    const newFolder = await cloudStorageService.createFolder(provider, folder, currentFolderId);
                    currentFolderId = newFolder.id;
                  }
                } catch (error) {
                  log.error(`Error creating folder structure for ${filePath}:`, error);
                  throw error;
                }
              }

              targetFolderId = currentFolderId;
            }
          }

          // Upload file
          const uploadOptions = {
            ...options,
            folderId: targetFolderId,
            fileName: path.basename(fileName)
          };

          const file = await cloudStorageService.uploadFile(provider, filePath, uploadOptions);
          results.push(file);

          // Update progress
          processed++;

          // Notify progress
          if (sender) {
            sender.webContents.send('cloud:progress', {
              file: filePath,
              processed,
              total: filePaths.length,
              percentage: Math.floor((processed / filePaths.length) * 100),
            });
          }
        } catch (error) {
          log.error(`Error uploading file ${filePath}:`, error);
          failed++;

          // Notify error
          if (sender) {
            sender.webContents.send('cloud:error', {
              file: filePath,
              error: (error as Error).message,
            });
          }
        }
      }

      // Notify completion
      if (sender) {
        sender.webContents.send('cloud:complete', {
          total: filePaths.length,
          processed,
          failed,
        });
      }

      return {
        success: true,
        results,
        processed,
        failed,
      };
    } catch (error) {
      log.error(`Error in batch upload to ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Create folder
   */
  ipcMain.handle('cloud:createFolder', async (_event, provider: CloudProvider, folderName: string, parentFolderId?: string) => {
    try {
      const folder = await cloudStorageService.createFolder(provider, folderName, parentFolderId);
      return {
        success: true,
        folder
      };
    } catch (error) {
      log.error(`Error creating folder in ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Download file
   */
  ipcMain.handle('cloud:downloadFile', async (_event, provider: CloudProvider, fileId: string, destinationPath: string) => {
    try {
      const filePath = await cloudStorageService.downloadFile(provider, fileId, destinationPath);
      return {
        success: true,
        filePath
      };
    } catch (error) {
      log.error(`Error downloading file from ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Disconnect from a provider
   */
  ipcMain.handle('cloud:disconnect', async (_event, provider: CloudProvider) => {
    try {
      await cloudStorageService.disconnect(provider);
      return { success: true };
    } catch (error) {
      log.error(`Error disconnecting from ${provider}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });
}

/**
 * Clean up cloud storage resources when exiting application
 */
export function cleanupCloudStorage(): void {
  cloudStorageService.cleanup().catch(error => {
    log.error('Error cleaning up cloud storage service:', error);
  });
}