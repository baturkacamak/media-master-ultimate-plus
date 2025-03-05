import { contextBridge, ipcRenderer } from 'electron';
import { ExifBackupOptions, ExifEditOperation } from '@main/services/exif-editor';

// Define the API exposed to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

    // File system operations
    selectDirectory: (options?: { title?: string; defaultPath?: string }) =>
      ipcRenderer.invoke('dialog:selectDirectory', options),
    selectFile: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:selectFile', options),

    // File operations
    scanDirectory: (dirPath: string, options: { recursive: boolean; fileTypes?: string[] }) =>
      ipcRenderer.invoke('files:scanDirectory', dirPath, options),
    getFileMetadata: (filePath: string) =>
      ipcRenderer.invoke('files:getMetadata', filePath),
    organizeFiles: (options: {
        sourcePath: string;
        destinationPath: string;
        operation: 'move' | 'copy';
        pattern: string;
        recursive: boolean;
        conflicts: 'rename' | 'skip' | 'overwrite';
        filters?: {
            dateFrom?: string;
            dateTo?: string;
            sizeLimit?: string;
            fileTypes?: string[];
        };
        options?: {
            createBackup: boolean;
            skipDuplicates: boolean;
            organizeByType: boolean;
            organizeByCamera: boolean;
            customRenamePattern?: string;
        };
    }) => ipcRenderer.invoke('files:organize', options),

    // Format conversion operations
    convertFile: (sourcePath: string, options: {
        targetFormat: string;
        quality: 'low' | 'medium' | 'high' | 'lossless';
        deleteOriginal?: boolean;
        resizeWidth?: number;
        resizeHeight?: number;
        maintainAspectRatio?: boolean;
    }) => ipcRenderer.invoke('conversion:convertFile', sourcePath, options),

    convertFiles: (filePaths: string[], options: {
        targetFormat: string;
        quality: 'low' | 'medium' | 'high' | 'lossless';
        deleteOriginal?: boolean;
        resizeWidth?: number;
        resizeHeight?: number;
        maintainAspectRatio?: boolean;
    }) => ipcRenderer.invoke('conversion:convertFiles', filePaths, options),

    // AI Categorization operations
    configureAi: (options: Partial<{
        useLocalModel: boolean;
        apiKey: string;
        confidenceThreshold: number;
        maxTags: number;
        includeDominantColors: boolean;
        includeObjectDetection: boolean;
    }>) => ipcRenderer.invoke('ai:configure', options),

    categorizeImage: (imagePath: string) =>
      ipcRenderer.invoke('ai:categorizeImage', imagePath),

    categorizeImages: (imagePaths: string[]) =>
      ipcRenderer.invoke('ai:categorizeImages', imagePaths),

    getCategories: () =>
      ipcRenderer.invoke('ai:getCategories'),

    addCustomCategories: (categories: string[]) =>
      ipcRenderer.invoke('ai:addCustomCategories', categories),

    removeCustomCategories: (categories: string[]) =>
      ipcRenderer.invoke('ai:removeCustomCategories', categories),

    // Face Recognition operations
    configureFaceRecognition: (options: Partial<{
        minFaceSize: number;
        maxFaceSize: number;
        confidenceThreshold: number;
        recognitionThreshold: number;
        enableLandmarks: boolean;
        enableAttributes: boolean;
        maxFacesPerImage: number;
        useLocalModel: boolean;
        apiKey: string;
    }>) => ipcRenderer.invoke('face:configure', options),

    detectFaces: (imagePath: string) =>
      ipcRenderer.invoke('face:detectFaces', imagePath),

    processFaceBatch: (imagePaths: string[]) =>
      ipcRenderer.invoke('face:processBatch', imagePaths),

    getAllPeople: () =>
      ipcRenderer.invoke('face:getAllPeople'),

    getPersonById: (personId: string) =>
      ipcRenderer.invoke('face:getPersonById', personId),

    createOrUpdatePerson: (person: Partial<{
        id: string;
        name: string;
        faceIds: string[];
        faceDescriptors: number[][];
        sampleImages: string[];
        thumbnailPath?: string;
        dateCreated: string;
        dateModified: string;
        imageCount: number;
    }> & { name: string }) =>
      ipcRenderer.invoke('face:createOrUpdatePerson', person),

    deletePerson: (personId: string) =>
      ipcRenderer.invoke('face:deletePerson', personId),

    addFaceToPerson: (personId: string, faceImage: string, faceRect: {
        x: number;
        y: number;
        width: number;
        height: number
    }) =>
      ipcRenderer.invoke('face:addFaceToPerson', personId, faceImage, faceRect),

    removeFaceFromPerson: (personId: string, faceId: string) =>
      ipcRenderer.invoke('face:removeFaceFromPerson', personId, faceId),

    getAvailableFormats: () => ipcRenderer.invoke('conversion:getAvailableFormats'),

    // EXIF Editing operations
    readExifMetadata: (filePath: string) =>
      ipcRenderer.invoke('exif:readMetadata', filePath),

    getExifCommonFields: (filePath: string) =>
      ipcRenderer.invoke('exif:getCommonFields', filePath),

    editExifMetadata: (operation: ExifEditOperation, options: ExifBackupOptions) =>
      ipcRenderer.invoke('exif:editMetadata', operation, options),

    batchEditExif: (operations: ExifEditOperation[], options: ExifBackupOptions) =>
      ipcRenderer.invoke('exif:batchEdit', operations, options),

    applyExifTemplate: (filePaths: string[], template: Omit<ExifEditOperation, 'filePath'>[], options: ExifBackupOptions) =>
      ipcRenderer.invoke('exif:applyTemplate', filePaths, template, options),

    configureExifBackup: (backupDir: string | null) =>
      ipcRenderer.invoke('exif:configureBackup', backupDir),

    // Configuration
    saveConfig: (profileName: string, config: Record<string, any>) =>
      ipcRenderer.invoke('config:save', profileName, config),
    loadConfig: (profileName: string) =>
      ipcRenderer.invoke('config:load', profileName),
    listConfigs: () =>
      ipcRenderer.invoke('config:list'),

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
        const validChannels = [
            'files:progress',
            'files:complete',
            'files:error',
            'config:changed',
            'conversion:progress',
            'conversion:complete',
            'conversion:error',
            'ai:progress',
            'ai:complete',
            'ai:error',
            'face:progress',
            'face:complete',
            'face:error',
        ];

        if (validChannels.includes(channel)) {
            const subscription = (_event: any, ...args: any[]) => callback(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }

        return () => {}; // Empty cleanup function for invalid channels
    },
});

// Initialize any preload-specific operations
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded successfully');
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
});