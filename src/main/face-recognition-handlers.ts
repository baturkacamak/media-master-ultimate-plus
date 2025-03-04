import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import {
  faceRecognitionService,
  FaceRecognitionOptions,
  FaceRecognitionResult,
  Person
} from './services/face-recognition';

/**
 * Sets up IPC handlers for face recognition functionality
 */
export function registerFaceRecognitionHandlers(): void {
  /**
   * Configure Face Recognition service
   */
  ipcMain.handle('face:configure', async (_event, options: Partial<FaceRecognitionOptions>) => {
    try {
      faceRecognitionService.configure(options);
      return { success: true };
    } catch (error) {
      log.error('Error configuring face recognition service:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Detect faces in a single image
   */
  ipcMain.handle('face:detectFaces', async (_event, imagePath: string) => {
    try {
      const result = await faceRecognitionService.detectFaces(imagePath);
      return {
        success: !result.error,
        result: result,
        error: result.error
      };
    } catch (error) {
      log.error('Error detecting faces:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Process multiple images
   */
  ipcMain.handle('face:processBatch', async (_event, imagePaths: string[]) => {
    const sender = BrowserWindow.fromWebContents(_event.sender);

    try {
      const results: FaceRecognitionResult[] = [];
      let processed = 0;

      for (const imagePath of imagePaths) {
        try {
          // Process the image
          const result = await faceRecognitionService.detectFaces(imagePath);
          results.push(result);

          // Update progress
          processed++;

          // Notify progress if we have a valid sender
          if (sender) {
            sender.webContents.send('face:progress', {
              processed,
              total: imagePaths.length,
              percentage: Math.floor((processed / imagePaths.length) * 100),
              currentFile: imagePath
            });
          }
        } catch (error) {
          log.error(`Error processing ${imagePath} during batch processing:`, error);
          results.push({
            filePath: imagePath,
            fileHash: '',
            imageWidth: 0,
            imageHeight: 0,
            faces: [],
            error: (error as Error).message
          });
        }
      }

      // Notify completion if we have a valid sender
      if (sender) {
        sender.webContents.send('face:complete', {
          total: imagePaths.length,
          processed
        });
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      log.error('Error in batch face processing:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get all people
   */
  ipcMain.handle('face:getAllPeople', async () => {
    try {
      const people = faceRecognitionService.getAllPeople();
      return {
        success: true,
        people
      };
    } catch (error) {
      log.error('Error getting people:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Get a person by ID
   */
  ipcMain.handle('face:getPersonById', async (_event, personId: string) => {
    try {
      const person = faceRecognitionService.getPersonById(personId);
      return {
        success: !!person,
        person
      };
    } catch (error) {
      log.error(`Error getting person ${personId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Create or update a person
   */
  ipcMain.handle('face:createOrUpdatePerson', async (_event, person: Partial<Person> & { name: string }) => {
    try {
      const result = await faceRecognitionService.createOrUpdatePerson(person);
      return {
        success: true,
        person: result
      };
    } catch (error) {
      log.error('Error creating/updating person:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Delete a person
   */
  ipcMain.handle('face:deletePerson', async (_event, personId: string) => {
    try {
      const success = await faceRecognitionService.deletePerson(personId);
      return { success };
    } catch (error) {
      log.error(`Error deleting person ${personId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Add face to a person
   */
  ipcMain.handle('face:addFaceToPerson', async (_event, personId: string, faceImage: string, faceRect: { x: number, y: number, width: number, height: number }) => {
    try {
      const result = await faceRecognitionService.addFaceToPerson(personId, faceImage, faceRect);
      return {
        success: !!result,
        person: result
      };
    } catch (error) {
      log.error(`Error adding face to person ${personId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * Remove face from a person
   */
  ipcMain.handle('face:removeFaceFromPerson', async (_event, personId: string, faceId: string) => {
    try {
      const result = await faceRecognitionService.removeFaceFromPerson(personId, faceId);
      return {
        success: !!result,
        person: result
      };
    } catch (error) {
      log.error(`Error removing face from person ${personId}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });
}

/**
 * Clean up face recognition resources when exiting application
 */
export function cleanupFaceRecognition(): void {
  faceRecognitionService.cleanup().catch(error => {
    log.error('Error cleaning up face recognition service:', error);
  });
}