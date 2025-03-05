import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';
import { exifToolManager } from '@main/utils/exiftool-setup';

const execPromise = promisify(exec);

/**
 * EXIF field type definition
 */
export interface ExifField {
  tag: string;         // EXIF tag name
  value: string;       // Current value
  description: string; // User-friendly description
  editable: boolean;   // Whether this field can be edited
  type: 'text' | 'date' | 'number' | 'gps' | 'select'; // Field data type
  options?: string[];  // For select type fields, available options
}

/**
 * EXIF edit operation
 */
export interface ExifEditOperation {
  filePath: string;    // Target file path
  tag: string;         // EXIF tag to modify
  value: string;       // New value
  operation: 'set' | 'remove'; // Operation type
}

/**
 * EXIF backup options
 */
export interface ExifBackupOptions {
  createBackup: boolean;
  backupDir?: string;
}

/**
 * EXIF edit batch result
 */
export interface ExifEditResult {
  success: boolean;
  editedFiles: string[];
  failedFiles: Record<string, string>; // filepath -> error message
  error?: string;
}

/**
 * Service for editing EXIF metadata in media files
 */
export class ExifEditorService {
  private exiftoolAvailable: boolean = false;
  private backupDir: string | null = null;

  constructor() {
    this.checkExiftool();
  }

  /**
   * Check if exiftool is available
   */
  private async checkExiftool(): Promise<void> {
    try {
      const isReady = await exifToolManager.initialize();
      this.exiftoolAvailable = isReady;

      if (isReady) {
        log.info('ExifTool is available for metadata editing');
      } else {
        log.warn('ExifTool not available - using fallback metadata editing methods');
      }
    } catch (error) {
      this.exiftoolAvailable = false;
      log.warn('Error initializing ExifTool:', error);
    }
  }

  /**
   * Set backup directory
   */
  public setBackupDir(dir: string | null): void {
    this.backupDir = dir;
    if (dir) {
      // Ensure backup directory exists
      fs.mkdir(dir, { recursive: true }).catch(error => {
        log.error(`Failed to create backup directory: ${error}`);
      });
    }
  }

  /**
   * Read EXIF metadata from a file
   */
  public async readExif(filePath: string): Promise<Record<string, any>> {
    try {
      if (this.exiftoolAvailable) {
        const output = await exifToolManager.execute(['-json', '-charset', 'UTF8', filePath]);
        const jsonData = JSON.parse(output);

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          return jsonData[0];
        }
        return {};
      } else {
        // Fallback method - less comprehensive
        // In a real implementation, you would use a JavaScript-based
        // EXIF library like exif-js or exifreader
        log.warn('Using fallback EXIF reading method - limited metadata support');

        // Mock implementation
        return {
          FileName: path.basename(filePath),
          FileSize: (await fs.stat(filePath)).size,
          FileModifyDate: new Date((await fs.stat(filePath)).mtime).toISOString()
        };
      }
    } catch (error) {
      log.error(`Error reading EXIF data from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get common EXIF fields in a structured format
   */
  public async getCommonExifFields(filePath: string): Promise<ExifField[]> {
    try {
      const exifData = await this.readExif(filePath);

      const fields: ExifField[] = [
        // Date/Time fields
        {
          tag: 'DateTimeOriginal',
          value: exifData.DateTimeOriginal || '',
          description: 'Original Date/Time',
          editable: true,
          type: 'date'
        },
        {
          tag: 'CreateDate',
          value: exifData.CreateDate || '',
          description: 'Creation Date/Time',
          editable: true,
          type: 'date'
        },
        {
          tag: 'ModifyDate',
          value: exifData.ModifyDate || '',
          description: 'Modification Date/Time',
          editable: true,
          type: 'date'
        },

        // Camera information
        {
          tag: 'Make',
          value: exifData.Make || '',
          description: 'Camera Manufacturer',
          editable: true,
          type: 'text'
        },
        {
          tag: 'Model',
          value: exifData.Model || '',
          description: 'Camera Model',
          editable: true,
          type: 'text'
        },
        {
          tag: 'LensModel',
          value: exifData.LensModel || '',
          description: 'Lens Model',
          editable: true,
          type: 'text'
        },

        // Exposure settings
        {
          tag: 'ISO',
          value: exifData.ISO?.toString() || '',
          description: 'ISO Speed',
          editable: true,
          type: 'number'
        },
        {
          tag: 'ExposureTime',
          value: exifData.ExposureTime?.toString() || '',
          description: 'Exposure Time',
          editable: true,
          type: 'text'
        },
        {
          tag: 'FNumber',
          value: exifData.FNumber?.toString() || '',
          description: 'F-Number',
          editable: true,
          type: 'number'
        },
        {
          tag: 'FocalLength',
          value: exifData.FocalLength?.toString() || '',
          description: 'Focal Length',
          editable: true,
          type: 'text'
        },

        // GPS information
        {
          tag: 'GPSLatitude',
          value: exifData.GPSLatitude?.toString() || '',
          description: 'GPS Latitude',
          editable: true,
          type: 'gps'
        },
        {
          tag: 'GPSLongitude',
          value: exifData.GPSLongitude?.toString() || '',
          description: 'GPS Longitude',
          editable: true,
          type: 'gps'
        },

        // Copyright and ownership
        {
          tag: 'Copyright',
          value: exifData.Copyright || '',
          description: 'Copyright',
          editable: true,
          type: 'text'
        },
        {
          tag: 'Artist',
          value: exifData.Artist || '',
          description: 'Artist/Creator',
          editable: true,
          type: 'text'
        },

        // Description
        {
          tag: 'ImageDescription',
          value: exifData.ImageDescription || '',
          description: 'Image Description',
          editable: true,
          type: 'text'
        },
        {
          tag: 'UserComment',
          value: exifData.UserComment || '',
          description: 'User Comment',
          editable: true,
          type: 'text'
        }
      ];

      return fields;
    } catch (error) {
      log.error(`Error getting EXIF fields for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Create a backup of a file before editing
   */
  private async createBackup(filePath: string): Promise<string> {
    if (!this.backupDir) {
      throw new Error('Backup directory not set');
    }

    try {
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `${fileName}.${timestamp}.bak`);

      await fs.copyFile(filePath, backupPath);
      log.info(`Created backup of ${filePath} at ${backupPath}`);

      return backupPath;
    } catch (error) {
      log.error(`Failed to create backup of ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Edit EXIF metadata in a single file
   */
  public async editExif(
    operation: ExifEditOperation,
    options: ExifBackupOptions = { createBackup: true }
  ): Promise<string> {
    try {
      // Create backup if requested
      if (options.createBackup) {
        if (options.backupDir) {
          this.setBackupDir(options.backupDir);
        }

        if (this.backupDir) {
          await this.createBackup(operation.filePath);
        }
      }

      if (this.exiftoolAvailable) {
        // Use exiftool for editing
        let command: string;

        if (operation.operation === 'set') {
          command = `exiftool -${operation.tag}="${operation.value}" -overwrite_original "${operation.filePath}"`;
        } else { // remove
          command = `exiftool -${operation.tag}= -overwrite_original "${operation.filePath}"`;
        }

        await execPromise(command);
      } else {
        // Fallback - this is just a placeholder as proper EXIF
        // editing requires exiftool or a comprehensive library
        log.warn(`Fallback EXIF editing not fully implemented for ${operation.tag}`);
        throw new Error('Exiftool is required for EXIF editing but is not available');
      }

      return operation.filePath;
    } catch (error) {
      log.error(`Error editing EXIF in ${operation.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Edit EXIF metadata in multiple files
   */
  public async batchEditExif(
    operations: ExifEditOperation[],
    options: ExifBackupOptions = { createBackup: true }
  ): Promise<ExifEditResult> {
    const result: ExifEditResult = {
      success: true,
      editedFiles: [],
      failedFiles: {}
    };

    for (const operation of operations) {
      try {
        await this.editExif(operation, options);
        result.editedFiles.push(operation.filePath);
      } catch (error) {
        result.failedFiles[operation.filePath] = (error as Error).message;
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Apply an EXIF template to multiple files
   * A template is a set of EXIF operations to apply to all files
   */
  public async applyExifTemplate(
    filePaths: string[],
    template: Omit<ExifEditOperation, 'filePath'>[],
    options: ExifBackupOptions = { createBackup: true }
  ): Promise<ExifEditResult> {
    // Convert template to individual operations for each file
    const operations: ExifEditOperation[] = [];

    for (const filePath of filePaths) {
      for (const templateOp of template) {
        operations.push({
          filePath,
          tag: templateOp.tag,
          value: templateOp.value,
          operation: templateOp.operation
        });
      }
    }

    return this.batchEditExif(operations, options);
  }
}

// Singleton instance for global usage
export const exifEditorService = new ExifEditorService();