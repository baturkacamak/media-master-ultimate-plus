import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import {
  exifEditorService,
  ExifEditOperation,
  ExifBackupOptions
} from './services/exif-editor';

/**
 * Sets up IPC handlers for EXIF editing functionality
 */
export function registerExifEditingHandlers(): void {
  /**
   * Read EXIF metadata from a file
   */
  ipcMain.handle('exif:readMetadata', async (_event, filePath: string) => {
    try {
      const exifData = await exifEditorService.readExif(filePath);
      return {
        success: true,
        metadata: exifData
      };
    } catch (error) {
      log.error('Error reading EXIF metadata:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get common EXIF fields in a structured format
   */
  ipcMain.handle('exif:getCommonFields', async (_event, filePath: string) => {
    try {
      const fields = await exifEditorService.getCommonExifFields(filePath);
      return {
        success: true,
        fields
      };
    } catch (error) {
      log.error('Error getting common EXIF fields:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Edit EXIF metadata in a single file
   */
  ipcMain.handle('exif:editMetadata', async (_event, operation: ExifEditOperation, options: ExifBackupOptions) => {
    try {
      const result = await exifEditorService.editExif(operation, options);
      return {
        success: true,
        filePath: result
      };
    } catch (error) {
      log.error('Error editing EXIF metadata:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Batch edit EXIF metadata in multiple files
   */
  ipcMain.handle('exif:batchEdit', async (_event, operations: ExifEditOperation[], options: ExifBackupOptions) => {
    const sender = BrowserWindow.fromWebContents(_event.sender);

    try {
      // Process files
      let processed = 0;
      const totalOperations = operations.length;

      // Group operations by file for better progress reporting
      const fileOperations: Record<string, ExifEditOperation[]> = {};
      for (const op of operations) {
        if (!fileOperations[op.filePath]) {
          fileOperations[op.filePath] = [];
        }
        fileOperations[op.filePath].push(op);
      }

      const result = {
        success: true,
        editedFiles: [] as string[],
        failedFiles: {} as Record<string, string>
      };

      // Process each file
      const filePaths = Object.keys(fileOperations);
      const totalFiles = filePaths.length;

      for (const filePath of filePaths) {
        try {
          const fileOps = fileOperations[filePath];

          // Process all operations for this file
          for (const op of fileOps) {
            await exifEditorService.editExif(op, options);
            processed++;

            // Notify progress if we have a valid sender
            if (sender) {
              sender.webContents.send('exif:progress', {
                processed,
                total: totalOperations,
                percentage: Math.floor((processed / totalOperations) * 100),
                currentFile: filePath
              });
            }
          }

          // If all operations succeeded, add to editedFiles
          result.editedFiles.push(filePath);
        } catch (error) {
          result.failedFiles[filePath] = (error as Error).message;
          result.success = false;
          processed += fileOperations[filePath].length;
        }
      }

      // Notify completion if we have a valid sender
      if (sender) {
        sender.webContents.send('exif:complete', {
          totalFiles,
          editedFiles: result.editedFiles.length,
          failedFiles: Object.keys(result.failedFiles).length
        });
      }

      return result;
    } catch (error) {
      log.error('Error in batch EXIF editing:', error);
      return {
        success: false,
        error: (error as Error).message,
        editedFiles: [],
        failedFiles: {}
      };
    }
  });

  /**
   * Apply an EXIF template to multiple files
   */
  ipcMain.handle('exif:applyTemplate', async (_event, filePaths: string[], template: Omit<ExifEditOperation, 'filePath'>[], options: ExifBackupOptions) => {
    try {
      const result = await exifEditorService.applyExifTemplate(filePaths, template, options);
      return result;
    } catch (error) {
      log.error('Error applying EXIF template:', error);
      return {
        success: false,
        error: (error as Error).message,
        editedFiles: [],
        failedFiles: {}
      };
    }
  });

  /**
   * Configure backup directory
   */
  ipcMain.handle('exif:configureBackup', async (_event, backupDir: string | null) => {
    try {
      exifEditorService.setBackupDir(backupDir);
      return { success: true };
    } catch (error) {
      log.error('Error configuring EXIF backup directory:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });
}