/**
 * File metadata structure
 */
export interface FileMetadata {
    path: string;
    name: string;
    extension: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    type: 'image' | 'video' | 'unknown';

    // EXIF data (optional)
    dateTimeOriginal?: string;
    createDate?: string;
    make?: string;
    model?: string;
    width?: number;
    height?: number;
    latitude?: number;
    longitude?: number;
    iso?: number;
    exposureTime?: string;
    fNumber?: number;
    focalLength?: number;
    exif?: Record<string, any>;
}

/**
 * Option for organization pattern
 */
export interface PatternOption {
    code: string;
    description: string;
    example: string;
}

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'error';

/**
 * Task information
 */
export interface Task {
    id: number;
    name: string;
    status: TaskStatus;
    sourcePath: string;
    destinationPath: string;
    operation: 'move' | 'copy';
    pattern: string;
    options: Record<string, any>;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalFiles: number;
    processedFiles: number;
    succeededFiles: number;
    skippedFiles: number;
    errorFiles: number;
}

/**
 * File processing status
 */
export type FileStatus = 'pending' | 'processing' | 'succeeded' | 'skipped' | 'error';

/**
 * File processing information
 */
export interface FileProcessing {
    id: number;
    taskId: number;
    sourcePath: string;
    destinationPath?: string;
    fileName: string;
    extension: string;
    size: number;
    createdAt?: Date;
    modifiedAt?: Date;
    exifData?: string;
    status: FileStatus;
    errorMessage?: string;
}

/**
 * Electron API interface
 */
export interface ElectronAPI {
    // App info
    getAppVersion: () => Promise<string>;

    // File system operations
    selectDirectory: (options?: { title?: string; defaultPath?: string }) => Promise<string | null>;
    selectFile: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;

    // File operations
    scanDirectory: (dirPath: string, options: { recursive: boolean; fileTypes?: string[] }) => Promise<{ success: boolean; files?: string[]; error?: string }>;
    getFileMetadata: (filePath: string) => Promise<{ success: boolean; metadata?: FileMetadata; error?: string }>;
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
    }) => Promise<{ success: boolean; results?: { total: number; succeeded: number; skipped: number; errors: number }; error?: string }>;

    // Configuration
    saveConfig: (profileName: string, config: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    loadConfig: (profileName: string) => Promise<{ success: boolean; config?: Record<string, any>; error?: string }>;
    listConfigs: () => Promise<{ success: boolean; profiles?: string[]; error?: string }>;

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}