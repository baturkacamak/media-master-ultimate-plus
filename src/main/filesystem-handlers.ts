import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import log from 'electron-log';
import { FileMetadata } from '../common/types';

const execPromise = promisify(exec);

// Define supported file extensions
const supportedImageFormats = [
    'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'heic', 'webp', 'raw', 'cr2', 'nef', 'arw'
];
const supportedVideoFormats = [
    'mp4', 'mov', 'avi', 'mkv', 'm4v', '3gp', 'wmv', 'flv', 'webm'
];
const supportedFormats = [...supportedImageFormats, ...supportedVideoFormats];

export function registerFileSystemHandlers() {
    // Scan directory for media files
    ipcMain.handle('files:scanDirectory', async (_event, dirPath, options) => {
        const { recursive = false, fileTypes = supportedFormats } = options || {};

        try {
            log.info(`Scanning directory: ${dirPath}, recursive: ${recursive}`);

            const results: string[] = [];
            await scanDirectoryRecursive(dirPath, fileTypes, recursive, results);

            log.info(`Scan complete. Found ${results.length} files.`);
            return { success: true, files: results };
        } catch (error) {
            log.error('Error scanning directory:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    });

    // Get file metadata
    ipcMain.handle('files:getMetadata', async (_event, filePath) => {
        try {
            log.debug(`Getting metadata for file: ${filePath}`);

            // Get basic file stats
            const stats = await fs.stat(filePath);

            // Basic metadata
            const metadata: FileMetadata = {
                path: filePath,
                name: path.basename(filePath),
                extension: path.extname(filePath).slice(1).toLowerCase(),
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                type: getFileType(filePath),
            };

            // Try to get EXIF data (using exiftool if available)
            try {
                const exifData = await getExifData(filePath);
                if (exifData) {
                    // Merge EXIF data with basic metadata
                    return {
                        success: true,
                        metadata: { ...metadata, ...exifData }
                    };
                }
            } catch (exifError) {
                log.warn(`Could not extract EXIF data from ${filePath}:`, exifError);
            }

            return { success: true, metadata };
        } catch (error) {
            log.error('Error getting file metadata:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    });

    // Organize files
    ipcMain.handle('files:organize', async (_event, options) => {
        const sender = BrowserWindow.fromWebContents(_event.sender);
        if (!sender) {
            return { success: false, error: 'Window not found' };
        }

        try {
            // Create required directories
            await fs.mkdir(options.destinationPath, { recursive: true });

            // Get file list
            const { success, files, error } = await ipcMain.handle(
                'files:scanDirectory',
                _event,
                options.sourcePath,
                { recursive: options.recursive, fileTypes: options.filters?.fileTypes }
            ) as { success: boolean; files?: string[]; error?: string };

            if (!success || !files) {
                return { success: false, error: error || 'Failed to scan directory' };
            }

            // Process files
            const total = files.length;
            let processed = 0;
            let succeeded = 0;
            let skipped = 0;
            let errors = 0;

            for (const file of files) {
                try {
                    processed++;

                    // Notify progress
                    sender.webContents.send('files:progress', {
                        file,
                        processed,
                        total,
                        percentage: Math.floor((processed / total) * 100),
                    });

                    // Process the file (placeholder for actual implementation)
                    // TODO: Implement file organization logic based on options

                    succeeded++;
                } catch (error) {
                    log.error(`Error processing file ${file}:`, error);
                    errors++;

                    // Notify error
                    sender.webContents.send('files:error', {
                        file,
                        error: (error as Error).message,
                    });
                }
            }

            // Notify completion
            sender.webContents.send('files:complete', {
                total,
                succeeded,
                skipped,
                errors,
            });

            return {
                success: true,
                results: {
                    total,
                    succeeded,
                    skipped,
                    errors,
                },
            };
        } catch (error) {
            log.error('Error organizing files:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    });
}

// Helper function to scan directory recursively
async function scanDirectoryRecursive(
    dirPath: string,
    fileTypes: string[],
    recursive: boolean,
    results: string[]
): Promise<void> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory() && recursive) {
                await scanDirectoryRecursive(fullPath, fileTypes, recursive, results);
            } else if (entry.isFile()) {
                const extension = path.extname(entry.name).slice(1).toLowerCase();
                if (fileTypes.includes(extension)) {
                    results.push(fullPath);
                }
            }
        }
    } catch (error) {
        log.error(`Error scanning directory ${dirPath}:`, error);
        throw error;
    }
}

// Helper function to determine file type
function getFileType(filePath: string): 'image' | 'video' | 'unknown' {
    const extension = path.extname(filePath).slice(1).toLowerCase();

    if (supportedImageFormats.includes(extension)) {
        return 'image';
    }

    if (supportedVideoFormats.includes(extension)) {
        return 'video';
    }

    return 'unknown';
}

// Helper function to get EXIF data using exiftool
async function getExifData(filePath: string): Promise<Record<string, any> | null> {
    try {
        // Check if exiftool is available
        try {
            await execPromise('exiftool -ver');
        } catch (error) {
            // ExifTool not available
            return null;
        }

        // Run exiftool to get metadata in JSON format
        const { stdout } = await execPromise(`exiftool -json -charset UTF8 "${filePath}"`);
        const jsonData = JSON.parse(stdout);

        if (Array.isArray(jsonData) && jsonData.length > 0) {
            const exif = jsonData[0];

            // Extract relevant EXIF fields
            return {
                // Date fields
                dateTimeOriginal: exif.DateTimeOriginal,
                createDate: exif.CreateDate,

                // Camera info
                make: exif.Make,
                model: exif.Model,

                // Image details
                width: exif.ImageWidth,
                height: exif.ImageHeight,

                // Geo data
                latitude: exif.GPSLatitude,
                longitude: exif.GPSLongitude,

                // Other metadata
                iso: exif.ISO,
                exposureTime: exif.ExposureTime,
                fNumber: exif.FNumber,
                focalLength: exif.FocalLength,

                // Full exif data
                exif,
            };
        }

        return null;
    } catch (error) {
        log.error(`Error getting EXIF data for ${filePath}:`, error);
        return null;
    }
}